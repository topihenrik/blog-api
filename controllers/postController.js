const Post = require("../models/post");
const { body,validationResult } = require('express-validator');

// setup multer
const multer = require("multer");
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/images/posts/");
    },
    filename: (req, file, cb) => {
        const extArray = file.mimetype.split("/");
        const fileExtension = extArray[1];
        cb(null, (Date.now() + "." + fileExtension));
    }
});
const upload = multer({storage: storage});



exports.post_post = [
    upload.single("photo"),
    body("title", "Title must be specified").trim().isLength({min:1}).escape(),
    body("content", "Content must be specified").trim().isLength({min:1}).escape(),

    (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.status(400).json({errors: errors.array()})
        } else {
            

            let contentType = undefined;
            let path = undefined;
            if (req.file) {
                contentType = req.file.mimetype;
                path = "images/users/"+req.file.filename;
            }


            const post = new Post(
                {
                    title: req.body.title,
                    content: req.body.content,
                    author: req.body.author, // might need changes when the front is implemented
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
                res.status(201).json({message: "The post was created successfully"})
            })
        }
    }
]

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