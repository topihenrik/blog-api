const config = require("../utils/config");
const Post = require("../models/post");
const Comment = require("../models/comment");
const { body, validationResult } = require("express-validator");
const createError = require("http-errors");
const streamifier = require("streamifier");
const cloudinary = require("../utils/cloudinary");
const DOMPurify = require("../utils/dompurify");

// setup multer and sharp
const multer = require("multer");
const sharp = require("sharp");
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if ((file.mimetype === "image/png") || (file.mimetype === "image/jpeg")) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

const limits = {
    fields: 100,
    fileSize: 2097152,
    files: 1,
    parts: 100
};

const upload = multer({ storage: storage, limits: limits, fileFilter: fileFilter });

async function uploadImage(buffer) {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: config.CLOUD_FOLDER
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
}

// create a single post - have to be logged in
exports.post_post = [
    upload.single("photo"),
    body("title", "Define title using a Heading 1 element. Minimum length is 5 characters.").trim().isLength({ min: 5 }),
    body("content", "Content must be defined. Minimum length is 10 characters.").isLength({ min: 26 }),
    body("description", "Define description using a paragraph element. Minimum length is 5 characters.").trim().isLength({ min: 5 }),
    body("published", "Published value must be a boolean.").isBoolean().escape(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const cleanTitle = DOMPurify.sanitize(req.body.title);
            const cleanContent = DOMPurify.sanitize(req.body.content);
            const cleanDescription = DOMPurify.sanitize(req.body.description);

            if (req.file) { // new photo uploaded
                const buffer = await sharp(req.file.buffer).resize({ width: 1920 }).webp().toBuffer();
                const photo = await uploadImage(buffer); // uploading the cover image file to cloudinary.

                const newPost = new Post(
                    {
                        title: cleanTitle,
                        content: cleanContent,
                        description: cleanDescription,
                        author: req.user._id,
                        timestamp: Date.now(),
                        photo: {
                            is_default: false,
                            public_id: photo.public_id,
                            originalName: req.file.originalname,
                            url: photo.secure_url
                        },
                        published: req.body.published
                    }
                );

                await newPost.save();
                return res.status(201).json({});
            } else { // no photo uploaded -> using a default picture by setting photo properties undefined.
                const newPost = new Post(
                    {
                        title: cleanTitle,
                        content: cleanContent,
                        description: cleanDescription,
                        author: req.user._id,
                        timestamp: Date.now(),
                        photo: {
                            is_default: true,
                            public_id: undefined,
                            originalName: "default.webp",
                            url: undefined
                        },
                        published: req.body.published
                    }
                );
                await newPost.save();
                return res.status(201).json({});
            }
        } catch (error) {
            return next(error);
        }
    }
];

// get all posts - includes a comment count - value "published" needs to be true
exports.get_posts = async (req, res, next) => {
    try {
        const posts_array = await Post.find({ published: true }, { content: 0 }).populate("author", "first_name last_name avatar").sort("-timestamp").lean();
        if (posts_array.length === 0) {
            return res.status(200).json(posts_array);
        }

        // add post's comment count to the response.
        await Promise.all(
            posts_array.map((post, i) => {
                return new Promise((resolve, reject) => {
                    let post_final = null;
                    Comment.countDocuments({ post: post._id.toString() }, (err, count) => {
                        if (err) return reject(err);
                        post_final = { ...post, count: count };
                        posts_array[i] = post_final;
                        resolve();
                    });
                });
            })
        );

        return res.status(200).json(posts_array);
    } catch (error) {
        return next(error);
    }
};

// get single post with comment count based on post _id
// if the requester isn't the author then value "published" needs to be true
exports.get_post = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.postid).populate("author", "first_name last_name avatar");
        if (!post) {
            return next(createError(404, "No post found"));
        }

        if (post.author._id.toString() !== req.token?._id && post.published === false) {
            return next(createError(401, "Post has not been published"));
        }

        const commentCount = await Comment.countDocuments({ post: req.params.postid });
        const post_final = { ...post.toJSON(), count: commentCount };
        return res.status(200).json(post_final);
    } catch (error) {
        return next(error);
    }
};

// get all posts from specific author _id
exports.get_posts_author = async (req, res, next) => {
    try {
        const posts_array = await Post.find({ author: req.user._id }).populate("author", "first_name last_name avatar").sort("-timestamp").lean();
        if (posts_array.length === 0) {
            return res.status(200).json(posts_array);
        }

        // add post's comment count to the response.
        await Promise.all(
            posts_array.map((post, i) => {
                return new Promise((resolve, reject) => {
                    let post_final = null;
                    Comment.countDocuments({ post: post._id.toString() }, (err, count) => {
                        if (err) return reject(err);
                        post_final = { ...post, count: count };
                        posts_array[i] = post_final;
                        resolve();
                    });
                });
            })
        );

        return res.status(200).json(posts_array);
    } catch (error) {
        return next(error);
    }
};

// update single post - requestee has to be the author
exports.put_post = [
    upload.single("photo"),
    body("title", "Define title using a Heading 1 element. Minimum length is 5 characters.").trim().isLength({ min: 5 }),
    body("content", "Content must be defined. Minimum length is 10 characters.").isLength({ min: 26 }),
    body("description", "Define description using a paragraph element. Minimum length is 5 characters.").trim().isLength({ min: 5 }),
    body("published", "Published value must be a boolean.").isBoolean().escape(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const cleanTitle = DOMPurify.sanitize(req.body.title);
            const cleanContent = DOMPurify.sanitize(req.body.content);
            const cleanDescription = DOMPurify.sanitize(req.body.description);

            const oldpost = await Post.findById(req.params.postid);

            if (!oldpost) {
                return next(createError(404, "Post doesn't exist"));
            }

            if (oldpost.author.toString() !== req.user._id.toString()) {
                return next(createError(401, "No authorization"));
            }

            if (oldpost.published && !JSON.parse(req.body.published)) {
                return next(createError(400, "Published post can't be unpublished"));
            }

            if (req.file) {
                const buffer = await sharp(req.file.buffer).resize({ width: 1920 }).webp().toBuffer();
                const photo = await uploadImage(buffer); // uploading the cover image file to cloudinary.

                const editPost = {
                    title: cleanTitle,
                    content: cleanContent,
                    description: cleanDescription,
                    author: req.user._id,
                    timestamp: oldpost.timestamp,
                    edit_timestamp: Date.now(),
                    photo: {
                        is_default: false,
                        public_id: photo.public_id,
                        originalName: req.file.originalname,
                        url: photo.secure_url
                    },
                    published: req.body.published,
                    _id: req.params.postid
                };

                await Post.findByIdAndUpdate(req.params.postid, editPost, {});

                if (!oldpost.photo.is_default) {
                    await cloudinary.uploader.destroy(oldpost.photo.public_id);
                }

                return res.status(201).json({});
            } else {
                const editPost = {
                    title: cleanTitle,
                    content: cleanContent,
                    description: cleanDescription,
                    author: req.user._id,
                    timestamp: oldpost.timestamp,
                    edit_timestamp: Date.now(),
                    photo: {
                        is_default: oldpost.photo.is_default,
                        public_id: oldpost.photo.public_id,
                        originalName: oldpost.photo.originalName,
                        url: oldpost.photo.url
                    },
                    published: req.body.published,
                    _id: req.params.postid
                };

                await Post.findByIdAndUpdate(req.params.postid, editPost, {});

                return res.status(201).json({});
            }
        } catch (error) {
            return next(error);
        }
    }
];

// delete single post - requestee has to be the author
exports.delete_post = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.postid);
        if (!post) {
            return next(createError(404, "The post doesn't exist"));
        }

        if (post.author.toString() !== req.user._id.toString()) {
            return next(createError(401, "No authorization"));
        }

        if (req.body.confirmation !== post.title) {
            return next(createError(400, "Confirmation title didn't match"));
        }

        await Comment.deleteMany({ post: req.params.postid });
        await Post.findByIdAndDelete(req.params.postid);

        if (!post.photo.is_default) {
            await cloudinary.uploader.destroy(post.photo.public_id);
        }

        res.status(200).json({});
    } catch (error) {
        return next(error);
    }
};
