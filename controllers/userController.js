const User = require("../models/user")
const Post = require("../models/post")
const Comment = require("../models/comment")
const { body, validationResult } = require('express-validator')
const async = require("async")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
require("dotenv").config();
const {nanoid} = require("nanoid");
const fs = require("fs");

// setup multer and sharp
const multer = require("multer");
const sharp = require("sharp")
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

// POST Signup User
exports.post_user = [
    upload.single("avatar"),
    body("first_name", "first name has to be specified").trim().isLength({min:1}).isAlphanumeric().escape(),
    body("last_name", "last name has to be specified").trim().isLength({min: 1}).isAlphanumeric().escape(),
    body("email", "email has to be specified").trim().isEmail().isLength({min:1}).escape(),
    body("dob", "date of birth has to be specified").isDate().isLength({min:1}).escape(),
    body("password", "password must be specified").isLength({min:1})
    .custom((value, {req}) => {
        if (value !== req.body.password_confirm) {
            throw new Error("passwords don't match");
        } else {
            return value;
        }
    }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({errors: errors.array()});
        } else {
            User.findOne({email: req.body.email}, (err, user) => {
                if (err) return next(err);
                if (user !== null) {
                    const error = new Error("that email is already taken");
                    error.status = 409;
                    return next(error);
                }

                if (req.file) { // New photo
                    const fileName = "images/users/" + nanoid() + ".webp";
                    sharp(req.file.buffer).resize(256).webp({lossless: true}).toFile("public/"+fileName, (err) => {
                        if (err) return next(err);

                        bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
                            if (err) return next(err);

                            const user = new User(
                                {
                                    first_name: req.body.first_name,
                                    last_name: req.body.last_name,
                                    email: req.body.email,
                                    dob: new Date(req.body.dob),
                                    password: hashedPassword,
                                    avatar: {
                                        contentType: "image/webp",
                                        originalName: req.file.originalname,
                                        path: fileName
                                    }
                                }
                            )
                
                            user.save((err) => {
                                if (err) return next(err);
                                res.status(201).json({message: "The user was created successfully", status: 201});
                            })
                        })
                    })
                } else { // No photo, use default
                    bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
                        if (err) return next(err);

                        const user = new User(
                            {
                                first_name: req.body.first_name,
                                last_name: req.body.last_name,
                                email: req.body.email,
                                dob: new Date(req.body.dob),
                                password: hashedPassword,
                                avatar: {
                                    contentType: undefined,
                                    originalName: undefined,
                                    path: undefined
                                }
                            }
                        )
            
                        user.save((err) => {
                            if (err) return next(err);
                            res.status(201).json({message: "The user was created successfully", status: 201});
                        })
                    })
                }
            })
        }
    }
]

// POST Login User
exports.post_login = (req, res1, next) => {
    User.findOne({email: req.body.email}, (err, user) => {
        if (err) return next(err);
        if (!user) {
            let error = new Error("Incorrect creditentials");
            error.status = 401;
            return next(error);
        }
        bcrypt.compare(req.body.password, user.password, (err, res) => {
            if (err) return next(err);
            if (res) {
                // Passwords match -> LOGIN
                
                const token = jwt.sign({_id: user._id, email: user.email}, process.env.AUTH_SECRET, {expiresIn: "20h"})
                res1.status(200).json(
                    {
                        message: "Authorization succesful", 
                        token: token,
                        user: {
                            _id: user._id,
                            full_name: user.first_name + " " + user.last_name, 
                        }, 
                        status: 201
                    }
                )
            } else {
                // Password don't match.
                let error = new Error("Incorrect creditentials");
                error.status = 401;
                return next(error);
            }
        })
    })
}

// GET single user data for display
exports.get_user = (req, res, next) => {
    const decoded = jwt.decode(req.headers.authorization.split(" ")[1]);
    User.findById(decoded._id, "_id first_name last_name email dob avatar creation_date").exec((err, theuser) => {
        if (err) return next(err)
        if (theuser == null) {
            var error = new Error("No user found");
            error.status = 404;
            return next(error);
        }

        if (theuser._id.toString() !== decoded._id) {
            var error = new Error("No authorization")
            error.status = 401;
            return next(error);
        }

        Post.countDocuments({author: decoded._id}, (err, postCount) => {
            if (err) return next(err);
            Comment.countDocuments({author: decoded._id}, (err, commentCount) => {
                if (err) return next(err);
                res.status(200).json({status: 200, user: theuser, postCount: postCount, commentCount: commentCount});
            })
        })
    })
}

// GET single user data for editing
exports.get_user_edit = (req, res, next) => {
    const decoded = jwt.decode(req.headers.authorization.split(" ")[1]);
    User.findById(decoded._id, "_id first_name last_name email dob avatar").exec((err, theuser) => {
        if (err) return next(err);
        if (theuser == null) {
            var error = new Error("No user found");
            error.status = 404;
            return next(error);
        }

        if (theuser._id.toString() !== decoded._id) {
            var error = new Error("No authorization")
            error.status = 401;
            return next(error);
        }

        res.status(200).json({status: 200, user: theuser});
    })
}

// Update User basic information
exports.put_user_basic = [
    upload.single("avatar"),
    body("first_name", "first name has to be specified").trim().isLength({min:1}).isAlphanumeric().escape(),
    body("last_name", "last name has to be specified").trim().isLength({min: 1}).isAlphanumeric().escape(),
    body("email", "email has to be specified").trim().isEmail().isLength({min:1}).escape(),
    body("dob", "date of birth has to be specified").isDate().isLength({min:1}).escape(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({errors: errors.array()});
        } else {
            const decoded = jwt.decode(req.headers.authorization.split(" ")[1]);

            User.findById(decoded._id).exec((err, olduser) => {
                if (err) return next(err);

                if (olduser == null || olduser == "") {
                    const error = new Error("User doesn't exist");
                    error.status = 404;
                    return next(error);
                }


                if (req.file) { // New avatar
                    const fileName = "images/users/" + nanoid() + ".webp";
                    sharp(req.file.buffer).resize(256).webp({lossless: true}).toFile("public/"+fileName, (err) => {
                        if (err) return next(err);
                        const user = new User(
                            {
                                first_name: req.body.first_name,
                                last_name: req.body.last_name,
                                email: req.body.email,
                                dob: new Date(req.body.dob),
                                avatar: {
                                    contentType: "image/webp",
                                    originalName: req.file.originalname,
                                    path: fileName
                                },
                                _id: decoded._id
                            }
                        )

                        
                        User.findByIdAndUpdate(decoded._id, user, {}, (err) => {
                            if (err) return next(err);

                            // If previous image is not a default avatar -> Delete it
                            if (!olduser.avatar.path.includes("default")) {
                                try {
                                    fs.unlinkSync(process.cwd()+"/public/"+olduser.avatar.path);
                                } catch (err) {
                                    if (err) return next(err);
                                }
                            }

                            res.status(201).json({status: 201, message: "The user was updated succesfully"});
                        })


                    })
                } else { // No new avatar
                    const user = new User(
                        {
                            first_name: req.body.first_name,
                            last_name: req.body.last_name,
                            email: req.body.email,
                            dob: new Date(req.body.dob),
                            avatar: {
                                contentType: olduser.avatar.contentType,
                                originalName: olduser.avatar.originalName,
                                path: olduser.avatar.path
                            },
                            _id: decoded._id
                        }
                    )

                    User.findByIdAndUpdate(decoded._id, user, {}, (err) => {
                        if (err) return next(err);
                        res.status(201).json({status: 201, message: "The user was updated succesfully"});
                    })
                }






            })
        }
    }
]

// Update User password
exports.put_user_password = [
    body("old_password", "old password must be specified").isLength({min:1}),
    body("password", "password must be specified").isLength({min:1})
    .custom((value, {req}) => {
        if (value !== req.body.password_confirm) {
            throw new Error("passwords don't match");
        } else {
            return value;
        }
    }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({errors: errors.array()});
        } else {
            const decoded = jwt.decode(req.headers.authorization.split(" ")[1]);
            User.findById(decoded._id).exec((err, olduser) => {
                if(err) return next(err);

                if (olduser == null || olduser == "") {
                    const error = new Error("User doesn't exist");
                    error.status = 404;
                    return next(error);
                }

                bcrypt.compare(req.body.old_password, olduser.password, (err, result) => {
                    if (err) return next(err);
                    if (result) {
                        // Old Password matches -> Allow to change password
                        bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
                            if (err) return next(err);

                            const user = new User(
                                {
                                    password: hashedPassword,
                                    _id: decoded._id
                                }
                            )

                            User.findByIdAndUpdate(decoded._id, user, {}, (err) => {
                                if (err) return next(err);
                                res.status(201).json({status: 201, message: "The user password was updated successfully"});
                            })
                        })
                    } else {
                        // Old Password doesn't match.
                        const error = new Error("Incorrect creditentials");
                        error.status = 401;
                        return next(error);
                    }
                })
            })
        }
    }
]

// Deletes users all posts and comments. All comments from users posts will be deleted aswell. User itself will also be deleted.
exports.delete_user_all = (req, res, next) => {
    const decoded = jwt.decode(req.headers.authorization.split(" ")[1]);
    User.findById(decoded._id).exec((err, theuser) => {
        if (err) return next(err);
        if (theuser === null) {
            const error = new Error("The user doesnt exist");
            error.status = 404;
            return next(error);
        }
        bcrypt.compare(req.body.password, theuser.password, (err, result) => {
            if (err) return next(err);
            if (result) { // Passwords match
                // Find Users all Posts
                Post.find({author: decoded._id}).exec((err, posts_list) => {
                    if (err) return next(err);
                    posts_list.forEach((post) => {
                        // Find all Comments from Users Posts
                        Comment.find({post: post._id}).exec((err, comments_list) => {
                            if (err) return next(err);
                            comments_list.forEach((comment) => {
                                // Delete single Comment from the Users Post
                                Comment.findByIdAndDelete(comment._id, (err) => {
                                    if (err) return next(err);
                                })
                            })
                        })
                        // Delete Post db data and server photo file
                        Post.findByIdAndDelete(post._id, (err) => {
                            if (err) return next(err);
                            if (!post.photo.path.includes("default-")) {
                                try {
                                    fs.unlinkSync(process.cwd()+"/public/"+post.photo.path);
                                } catch(err) {
                                    if (err) return next(err);
                                }
                            }
                        })
                    })
                    // Find Users all Comments
                    Comment.find({author: decoded._id}).exec((err, comments_list) => {
                        if (err) return next(err);
                        comments_list.forEach((comment) => {
                            Comment.findByIdAndDelete(comment._id, (err) => {
                                if (err) return next(err);
                            })
                        })

                        // Delete User db data and server avatar file
                        User.findByIdAndDelete(decoded._id, (err) => {
                            if (err) return next(err);
                            if (!theuser.avatar.path.includes("default")) {
                                try {
                                    fs.unlinkSync(process.cwd()+"/public/"+theuser.avatar.path);
                                } catch(err) {
                                    if (err) return next(err);
                                }
                            }
                            res.status(200).json({status: 200, message: "The user information was deleted successfully"});
                        })
                    })
                })
            } else { // Passwords dont match
                const error = new Error("Incorrect creditentials");
                error.status = 401;
                return next(error);
            }
        })
    })
}