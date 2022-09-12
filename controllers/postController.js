const Post = require("../models/post");
const { body,validationResult } = require('express-validator');
const jwt = require("jsonwebtoken");
const {nanoid} = require("nanoid");

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
            let fileName = undefined;
            const optimizeImage = async () => {
                if(req.file) {
                    fileName = "images/posts/" + nanoid() + ".webp";
                    sharp(req.file.buffer).resize({width:1920}).webp().toFile("public/"+fileName, (err) => {
                        if (err) return next(err);
                    })
                }
            }

            const otherStuff = async () => {
                const decoded = jwt.decode(req.headers.authorization.split(" ")[1]);
                const cleanContent = DOMPurify.sanitize(req.body.content);
                let contentType = undefined;
                let path = undefined;
                if (req.file) {
                    contentType = "image/webp";
                    path = fileName;
                }
    
                const post = new Post(
                    {
                        title: req.body.title,
                        content: cleanContent,
                        description: req.body.description,
                        author: decoded._id,
                        timestamp: Date.now(),
                        photo: {
                            contentType: contentType,
                            path: path
                        },
                        published: req.body.published
                    }
                )
    
                post.save((err) => {
                    if (err) return next(err);
                    res.status(201).json({status: 201 ,message: "The post was created successfully"})
                })
            }

            optimizeImage().then(otherStuff);
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
        res.status(200).json({post_list: thepost})
    })
}


// GET all posts from specific authorID
exports.get_posts_author = (req, res, next) => {
    /* console.log(req.headers.authorization.split(" ")[1]); */
    /* process.env.AUTH_SECRET */
    const decoded = jwt.decode(req.headers.authorization.split(" ")[1]);
    console.log(decoded._id);

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

exports.post_put = [
    body("title", "Title must be specified").trim().isLength({min:1}).escape(),
    body("content", "Content must be specified").trim().isLength({min:1}).escape(),

    (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.status(400).json({errors: errors.array()});
        } else {
            const post = new Post(
                {
                    title: req.body.title,
                    content: req.body.content,
                    author: req.body.author, // might hate to change
                    timestamp: Date.now(),
                    published: req.body.published,
                    _id: req.params.postid
                }
            )

            Post.findByIdAndUpdate(req.params.postid, post, {}, (err) => {
                if (err) return next(err);
                res.status(200).json({message: "The post was updated succesfully"});
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

        Post.findByIdAndDelete(req.params.postid, (err) => {
            if(err) return next(err);
            res.status(204).json({message: "The post was deleted successfully"})
        })
    })
}