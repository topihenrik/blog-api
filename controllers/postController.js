const Post = require("../models/post");
const Comment = require("../models/comment")
const jwt = require("jsonwebtoken");
const fs = require("fs");
const { body,validationResult } = require('express-validator');
const {nanoid} = require("nanoid");
const async = require("async");
const streamifier = require("streamifier");
const cloudinary = require("../utils/cloudinary");

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
}

const limits = {
    fields: 100,
    fileSize: 2097152,
    files: 1,
    parts: 100
}

const upload = multer({storage: storage, limits: limits, fileFilter: fileFilter});



// setup dompurify
const createDOMPurify = require("dompurify");
const { JSDOM } = require("jsdom");

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);


exports.post_post = [
    upload.single("photo"),
    body("title", "Define title using a Heading 1 element. Minimum length is 5 characters.").trim().isLength({min:5}).escape(),
    body("content", "Content must be defined. Minimum length is 10 characters.").isLength({min:10}),
    body("description", "Define description using a paragraph element. Minimum length is 5 characters.").trim().isLength({min:5}).escape(),
    body("published", "Published value must be a boolean.").isBoolean().escape(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({errors: errors.array()})
        } else {
            const decoded = jwt.decode(req.headers.authorization.split(" ")[1]);
            const cleanContent = DOMPurify.sanitize(req.body.content);

            if(req.file) { // Photo uploaded
                /* const fileName = "images/posts/" + nanoid() + ".webp"; */
                sharp(req.file.buffer).resize({width:1920}).webp().toBuffer((err, data, info) => {
                    if (err) return next(err);

                    // Uploading the post photo file to Cloudinary.
                    const uploadStream = cloudinary.uploader.upload_stream(
                        {
                            folder: (process.env.NODE_ENV === 'production'?"blog-api":"dev-blog-api")
                        },
                        (error, result) => {
                            if (error) return next(error);

                            const post = new Post(
                                {
                                    title: req.body.title,
                                    content: cleanContent,
                                    description: req.body.description,
                                    author: decoded._id,
                                    timestamp: Date.now(),
                                    photo: {
                                        is_default: false,
                                        public_id: result.public_id,
                                        originalName: req.file.originalname,
                                        url: result.secure_url
                                    },
                                    published: req.body.published
                                }
                            )
                
                            post.save((err) => {
                                if (err) return next(err);
                                res.status(201).json({status: 201 ,message: "The post was created successfully"})
                            })
                        }
                    )
                    streamifier.createReadStream(data).pipe(uploadStream);
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
                            is_default: true,
                            public_id: undefined,
                            originalName: "default.webp",
                            url: undefined
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


// GET all posts. Includes a comment count. Value "published" needs to be true.
exports.get_posts = (req, res, next) => {
    Post.find({published: true}, {content: 0}).populate("author", "first_name last_name avatar").lean().exec((err, post_list) => {
        if (err) return next(err);
        if (post_list == null) {
            const error = new Error("No post found");
            err.status = 404;
            return next(error);
        }

        let post_list_with_count = [];
        const promises = post_list.map((post) => {
            return new Promise((resolve, reject) => {
                let post_new = {};
                Comment.countDocuments({post: post._id.toString()}, (err, count) => {
                    if (err) return reject(err);
                    post_new = {
                        ...post,
                        count: count
                    }
                    post_list_with_count.push(post_new)
                    resolve();
                })
            }) 
        })

        Promise.all(promises)
            .then(() => {
                res.status(200).json({post_list: post_list_with_count})
            })
            .catch((err) => {
                return next(err)
            })
    })
}


// GET single post based on postID. Value "published" needs to be true.
exports.get_post = (req, res, next) => {
    Post.findById(req.params.postid).populate("author", "first_name last_name avatar").exec((err, thepost) => {
        if (err) return next(err);
        if (thepost === null) {
            const error = new Error("No post found");
            error.status = 404;
            return next(error);
        }

        if (thepost.published === false) {
            const error = new Error("This post has not been published")
            error.status = 404;
            return next(error);
        }

        res.status(200).json({status: 200, post_list: thepost})
    })
}


// GET single post based on postID. Requires the requestee to be the author.
exports.get_post_edit = (req, res, next) => {
    const decoded = jwt.decode(req.headers.authorization.split(" ")[1]);
    Post.findById(req.params.postid).populate("author", "first_name last_name avatar").exec((err, thepost) => {
        if (err) return next(err);
        if (thepost === null) {
            const error = new Error("No post found");
            error.status = 404;
            return next(error);
        }

        if (thepost.author._id.toString() !== decoded._id) {
            const error = new Error("No authorization.");
            error.status = 401;
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

        Comment.countDocuments({post: req.params.postid}, (err, count) => {
            if (err) return next(err);
            res.status(200).json({status: 200, post_list: thepost, count: count})
        })
    })
}


// GET all posts from specific authorID
exports.get_posts_author = (req, res, next) => {
    const decoded = jwt.decode(req.headers.authorization.split(" ")[1]);

    Post.find({author: decoded._id}).populate("author", "first_name last_name avatar").lean().exec((err, post_list) => {
        if (err) return next(err);
        if (post_list === null) {
            const error = new Error("No post found");
            error.status = 404;
            return next(error);
        }

        // Check if the requestee is the author.
        if (post_list[0]?.author._id.toString() !== decoded._id) {
            const error = new Error("No authorization");
            error.status = 401;
            return next(error);
        }

        let post_list_with_count = [];
        const promises = post_list.map((post) => {
            return new Promise((resolve, reject) => {
                let post_new = {};
                Comment.countDocuments({post: post._id.toString()}, (err, count) => {
                    if (err) return reject(err);
                    post_new = {
                        ...post,
                        count: count
                    }
                    post_list_with_count.push(post_new);
                    resolve();
                })
            })
        })

        Promise.all(promises)
            .then(() => {
                res.status(200).json({post_list: post_list_with_count})
            })
            .catch((err) => {
                return next(err);
            })      
    })
}


// PUT update single post
exports.put_post = [
    upload.single("photo"),
    body("title", "Define title using a Heading 1 element. Minimum length is 5 characters.").trim().isLength({min:5}).escape(),
    body("content", "Content must be defined. Minimum length is 10 characters.").isLength({min:10}),
    body("description", "Define description using a paragraph element. Minimum length is 5 characters.").trim().isLength({min:5}).escape(),
    body("postID", "Post ID must be specified").trim().isLength({min:1}).escape(),
    body("published", "Published value must be a boolean.").isBoolean().escape(),
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
                
                // Published post can't be unpublished
                if (oldpost.published && !JSON.parse(req.body.published)) {
                    req.body.published = true;
                }

                // Optimize if the user submits a new photo. Otherwise use the old one.
                if(req.file) { // New photo uploaded
                    /* const fileName = "images/posts/" + nanoid() + ".webp"; */
                    sharp(req.file.buffer).resize({width:1920}).webp().toBuffer((err, data, info) => {
                        if (err) return next(err);  
                        
                        // Uploading the post photo file to Cloudinary.
                        const uploadStream = cloudinary.uploader.upload_stream(
                            {
                                folder: (process.env.NODE_ENV === 'production'?"blog-api":"dev-blog-api")
                            },
                            (error, result) => {
                                if (error) return next(error);

                                const post = new Post(
                                    {
                                        title: req.body.title,
                                        content: cleanContent,
                                        description: req.body.description,
                                        author: decoded._id,
                                        timestamp: oldpost.timestamp,
                                        edit_timestamp: Date.now(),
                                        photo: {
                                            is_default: false,
                                            public_id: result.public_id,
                                            originalName: req.file.originalname,
                                            url: result.secure_url
                                        },
                                        published: req.body.published,
                                        _id: req.body.postID
                                    }
                                )
        
                                Post.findByIdAndUpdate(req.body.postID, post, {}, (err) => {
                                    if (err) return next(err);
        
                                    // If previous image is not a default image -> Delete it.
                                    if (!oldpost.photo.is_default) {
                                        cloudinary.uploader.destroy(oldpost.photo.public_id, (error) => {
                                            if (error) return next(error);
                                        })
                                    }
        
                                    res.status(201).json({status: 201, message: "The post was updated succesfully"});
                                })
                            }
                        )
                        streamifier.createReadStream(data).pipe(uploadStream);
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
                                is_default: oldpost.photo.is_default,
                                public_id: oldpost.photo.public_id,
                                originalName: oldpost.photo.originalName,
                                url: oldpost.photo.url
                            },
                            published: req.body.published,
                            _id: req.body.postID
                        }
                    )
        
                    Post.findByIdAndUpdate(req.body.postID, post, {}, (err) => {
                        if (err) return next(err);
                        res.status(201).json({status: 201, message: "The post was updated succesfully"});
                    })

                }
            })
        }
    }
]


exports.delete_post = (req, res, next) => {
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
            const error = new Error("Confirmation title didn't match.")
            error.status = 400;
            return next(error);
        }

        Comment.deleteMany({post: req.params.postid}).exec((err) => {
            if (err) return next(err);

            Post.findByIdAndDelete(req.params.postid, (err) => {
                if(err) return next(err);

                // If the posts image is not a default image -> Delete it.
                if (!results.post.is_default) {
                    cloudinary.uploader.destroy(results.post.photo.public_id, (error) => {
                        if (error) return next(error);
                    });
                }

                res.status(200).json({status: 200, message: "The post and its comments were deleted successfully"})
            })
        })
    })
}