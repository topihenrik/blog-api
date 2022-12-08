const Comment = require("../models/comment");
const Post = require("../models/post");
const { body,validationResult } = require("express-validator");
const createError = require("http-errors");
const DOMPurify = require("../utils/dompurify");

// create a single comment - have to be logged in
exports.post_comment = [
    body("content", "Content must be specified").trim().isLength({ min: 1 }),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            const cleanContent = DOMPurify.sanitize(req.body.content);
            const post = await Post.findById(req.params.postid);
            if (!post) {
                return next(createError(404, "Comment's parent post doesn't exist"));
            }

            const newComment = new Comment(
                {
                    content: cleanContent,
                    author: req.token._id,
                    post: req.params.postid,
                    timestamp: Date.now()
                }
            );

            await newComment.save();
            return res.status(201).json();
        } catch (error) {
            return next(error);
        }
    }
];

// get comments for specific post
exports.get_comments = async (req, res, next) => {
    try {
        const comments_array = await Comment.find({ post: req.params.postid }).select({ post: 0 }).populate("author", "_id first_name last_name avatar");
        res.status(200).json(comments_array);
    } catch (error) {
        return next(error);
    }
};

// update a single comment - requestee has to be the author
exports.put_comment = [
    body("content", "Content must be specified").trim().isLength({ min: 1 }),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const cleanContent = DOMPurify.sanitize(req.body.content);

            const oldcomment = await Comment.findById(req.params.commentid);

            if (oldcomment.author.toString() !== req.token._id) {
                return next(createError(401, "No authorization"));
            }

            const editComment = {
                content: cleanContent,
                author: req.token._id,
                post: req.params.postid,
                timestamp: oldcomment.timestamp,
                edit_timestamp: Date.now(),
                _id: req.params.commentid
            };

            await Comment.findByIdAndUpdate(req.params.commentid, editComment, {});
            return res.status(200).json();
        } catch (error) {
            return next(error);
        }
    }
];

// delete a single comment - requestee has to be the author
exports.delete_comment = async (req, res, next) => {
    try {
        const comment = await Comment.findById(req.params.commentid);

        if (!comment) {
            return next(createError(404, "Comment not found"));
        }

        if (comment.author.toString() !== req.token._id) {
            return next(createError(401, "No authorization"));
        }

        await Comment.findByIdAndDelete(req.params.commentid);
        return res.status(200).json({});
    } catch (error) {
        return next(error);
    }
};
