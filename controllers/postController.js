const Post = require("../models/post");
const Comment = require("../models/comment")
const jwt = require("jsonwebtoken");
const fs = require("fs");
const { body,validationResult } = require('express-validator');
const {nanoid} = require("nanoid");
const async = require("async");

// setup multer
const multer = require("multer");
const sharp = require("sharp");
const storage = multer.memoryStorage();
const upload = multer({storage: storage});

// setup dompurify
const createDOMPurify = require("dompurify");
const { JSDOM } = require("jsdom");

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);



exports.post_post = [
    upload.single("photo"),
    body("title", "Title must be specified").trim().isLength({min:1}).escape(),
    body("content", "Content must be specified").isLength({min:5}),
    body("description", "Description must be specified").trim().isLength({min:5}).escape(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({errors: errors.array()})
        } else {
            const decoded = jwt.decode(req.headers.authorization.split(" ")[1]);
            const cleanContent = DOMPurify.sanitize(req.body.content);

            if(req.file) { // Photo uploaded
                const fileName = "images/posts/" + nanoid() + ".webp";
                sharp(req.file.buffer).resize({width:1920}).webp().toFile("public/"+fileName, (err) => {
                    if (err) return next(err);
        
                    const post = new Post(
                        {
                            title: req.body.title,
                            content: cleanContent,
                            description: req.body.description,
                            author: decoded._id,
                            timestamp: Date.now(),
                            photo: {
                                contentType: "image/webp",
                                path: fileName
                            },
                            published: req.body.published
                        }
                    )
        
                    post.save((err) => {
                        if (err) return next(err);
                        res.status(201).json({status: 201 ,message: "The post was created successfully"})
                    })
                })
            } else { // No photo uploaded -> Using a default picture by setting photo properties undefined.
                const post = new Post(
                    {
                        title: req.body.title,
                        content: cleanContent,
                        description: req.body.description,
                        author: decoded._id,
                        timestamp: Date.now(),
                        photo: {
                            contentType: undefined,
                            path: undefined
                        },
                        published: req.body.published
                    }
                )

                post.save((err) => {
                    if (err) return next(err);
                    res.status(201).json({status: 201 ,message: "The post was created successfully"})
                })
            }
        }
    }
]

// GET all posts
exports.posts_get = (req, res, next) => {
    Post.find().populate("author", "first_name last_name avatar").exec((err, post_list) => {
        if (err) return next(err);
        if (post_list == null) {
            const error = new Error("No post found");
            err.status = 404;
            return next(error);
        }
        res.status(200).json({post_list: post_list})
    })
}

// GET single post based on postID
exports.post_get = (req, res, next) => {
    Post.findById(req.params.postid).populate("author", "first_name last_name avatar").exec((err, thepost) => {
        if (err) return next(err);
        if (thepost === null) {
            const error = new Error("No post found");
            error.status = 404;
            return next(error);
        }
        res.status(200).json({status: 200, post_list: thepost})
    })
}


// GET single post based on postID
exports.get_post_commentcount = (req, res, next) => {
    Post.findById(req.params.postid).populate("author", "first_name last_name avatar").exec((err, thepost) => {
        if (err) return next(err);
        if (thepost === null) {
            const error = new Error("No post found");
            error.status = 404;
            return next(error);
        }
        Comment.find({post: req.params.postid}).count((err, count) => {
            if (err) return next(err);
            res.status(200).json({status: 200, post_list: thepost, count: count})
        })
    })
}


// GET all posts from specific authorID
exports.get_posts_author = (req, res, next) => {
    const decoded = jwt.decode(req.headers.authorization.split(" ")[1]);

    Post.find({author: decoded._id}).populate("author", "first_name last_name avatar").exec((err, post_list) => {
        if (err) return next(err);
        if (post_list === null) {
            const error = new Error("No post found");
            error.status = 404;
            return next(error);
        }
        res.status(200).json({post_list: post_list})
    })
}


// PUT update single post
exports.post_put = [
    upload.single("photo"),
    body("title", "Title must be specified").trim().isLength({min:1}).escape(),
    body("content", "Content must be specified").isLength({min:5}),
    body("description", "Description must be specified").trim().isLength({min:5}).escape(),
    body("postID", "Post ID must be specified").trim().isLength({min:1}).escape(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({errors: errors.array()});
        } else {
            const decoded = jwt.decode(req.headers.authorization.split(" ")[1]);
            const cleanContent = DOMPurify.sanitize(req.body.content);

            // Check if the user is authorized to make the change. (POST CREATOR == POST UPDATER)
            Post.findById(req.body.postID).exec((err, oldpost) => {
                if (err) return next(err);
                if (oldpost == null || oldpost == "") {
                    const error = new Error("Post doesn't exist");
                    error.status = 404;
                    return next(error);
                }
                if (oldpost.author.toString() !== decoded._id) {
                    const error = new Error("No authorization.");
                    error.status = 401;
                    return next(error);
                }
                
                // Optimize if the user submits a new photo. Otherwise use the old one.
                if(req.file) { // New photo uploaded
                    const fileName = "images/posts/" + nanoid() + ".webp";
                    sharp(req.file.buffer).resize({width:1920}).webp().toFile("public/"+fileName, (err) => {
                        if (err) return next(err);             

                        const post = new Post(
                            {
                                title: req.body.title,
                                content: cleanContent,
                                description: req.body.description,
                                author: decoded._id,
                                timestamp: oldpost.timestamp,
                                edit_timestamp: Date.now(),
                                photo: {
                                    contentType: "image/webp",
                                    path: fileName
                                },
                                published: req.body.published,
                                _id: req.body.postID
                            }
                        )

                        Post.findByIdAndUpdate(req.body.postID, post, {}, (err) => {
                            if (err) return next(err);

                            // If previous image is not a default image -> Delete it.
                            if (!oldpost.photo.path.includes("default-")) {
                                try {
                                    fs.unlinkSync(process.cwd()+"/public/"+oldpost.photo.path)
                                } catch(err) {
                                    if (err) return next(err);
                                }
                            }

                            res.status(200).json({status: 200, message: "The post was updated succesfully"});
                        })
                    })
                } else { // No new photo;
                    const post = new Post(
                        {
                            title: req.body.title,
                            content: cleanContent,
                            description: req.body.description,
                            author: decoded._id,
                            timestamp: oldpost.timestamp,
                            edit_timestamp: Date.now(),
                            photo: {
                                contentType: oldpost.photo.contentType,
                                path: oldpost.photo.path
                            },
                            published: req.body.published,
                            _id: req.body.postID
                        }
                    )
        
                    Post.findByIdAndUpdate(req.body.postID, post, {}, (err) => {
                        if (err) return next(err);
                        res.status(200).json({status: 200, message: "The post was updated succesfully"});
                    })

                }

            })
        }
    }
]


exports.post_delete = (req, res, next) => {
    async.parallel({
        post(cb) {
            Post.findById(req.params.postid).exec(cb);
        },
    }, (err, results) => {
        if (err) return next(err);

        if (results.post == null) {
            res.status(404).json({message: "The post does not exist"})
        }

        const decoded = jwt.decode(req.headers.authorization.split(" ")[1]);
        if (decoded._id !== results.post.author.toString()) {
            const error = new Error("No authorization.");
            error.status = 401;
            return next(error);
        }

        if (req.body.confirmation !== results.post.title) {
            console.log(req.body.confirmation)
            console.log(results.post.title);
            const error = new Error("Confirmation title didn't match.")
            error.status = 400;
            return next(error);
        }

        Comment.deleteMany({post: req.params.postid}).exec((err) => {
            if (err) return next(err);

            Post.findByIdAndDelete(req.params.postid, (err) => {
                if(err) return next(err);

                // If the posts image is not a default image -> Delete it.
                if (!results.post.photo.path.includes("default-")) {
                    try {
                        fs.unlinkSync(process.cwd()+"/public/"+results.post.photo.path);
                    } catch(err) {
                        if (err) return next(err);
                    }
                }

                res.status(200).json({status: 200, message: "The post and its comments were deleted successfully"})
            })
        })
    })
}