const Comment = require("../models/comment")
const { body,validationResult } = require('express-validator')


exports.comment_post = [
    body("content", "Content must be specified").trim().isLength({min:1}).escape(),

    (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.status(400).json({errors: errors.array()});
        } else {
            const comment = new Comment(
                {
                    content: req.body.content,
                    author: req.body.author, // might have to change
                    post: req.params.postid,
                    timestamp: Date.now()
                }
            )

            comment.save((err) => {
                if (err) return next(err);
                res.status(201).json({message: "The message was created successfully", status: 201});
            }) 
        }
    }
]

// Find comments for specific post
exports.comments_get = (req, res, next) => {
    Comment.find({post: req.params.postid}).select({post: 0}).populate("author", "first_name last_name avatar").exec((err, comment_list) => {
        if (err) return next(err);
        if (comment_list == null || comment_list == "") {
            const error = new Error("Comments not found");
            error.status = 404;
            return next(error);
        }
        res.status(200).json({comment_list: comment_list})
    });
}

exports.comment_get = (req, res, next) => {
    Comment.findById(req.params.commentid).select({post: 0}).populate("author", "first_name last_name avatar").exec((err, thecomment) => {
        if (err) return next(err);
        if (thecomment == null || thecomment == "") {
            const error = new Error("Comment not found");
            error.status = 404;
            return next(error);
        }
        res.status(200).json({comment_list: thepost});
    })
}

exports.comment_put = [
    body("content", "Content must be specified").trim().isLength({min:1}).escape(),

    (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.status(400).json({errors: errors.array()});
        } else {
            const comment = new Comment(
                {
                    content: req.body.content,
                    author: req.body.author, // might have to change
                    post: req.params.postid,
                    timestamp: Date.now(),
                    _id: req.params.commentid
                }
            )

            Comment.findByIdAndUpdate(req.params.commentid, comment, {}, (err) => {
                if (err) return next(err);
                res.status(200).json({message: "The comment was updated succesfully"})
            })
        }
    }
]

exports.comment_delete = (req, res, next) => {
    async.parallel({
        comment(cb) {
            Comment.findById(req.params.commentid).exec(cb);
        },
    }, (err, results) => {
        if (err) return next(err);

        if (results == null) {
            const error = new Error("Comment not found");
            error.status = 404;
            return next(error);
        }

        Comment.findByIdAndDelete(req.params.commentid, (err) => {
            if (err) return next(err);
            res.status(204).json({message: "The comment was deleted successfully"});
        })
    })
}