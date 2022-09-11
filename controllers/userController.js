const User = require("../models/user")
const { body, validationResult } = require('express-validator')
const async = require("async")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
require("dotenv").config();
const {nanoid} = require("nanoid");



// setup sharp
const fileFilter = (req, file, cb) => {
    console.log(file.buffer);
}


// setup multer
const multer = require("multer");
const sharp = require("sharp")
/* const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/images/users/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now().toString());
    }
}); */
const storage = multer.memoryStorage();
const upload = multer({storage: storage});



exports.post_user = [
    upload.single("avatar"),
    body("first_name", "first name has to be specified").trim().isLength({min:1}).isAlphanumeric().escape(),
    body("last_name", "last name has to be specified").trim().isLength({min: 1}).isAlphanumeric().escape(),
    body("email", "email has to be specified").trim().isEmail().isLength({min:1}).escape(),
    body("password", "password must be specified")
    .custom((value, {req}) => {
        if (value !== req.body.password_confirm) {
            throw new Error("passwords don't match");
        } else {
            return value;
        }
    }),
    (req, res, next) => {
        let fileName = undefined;

        const optimizeImage = async () => {
            if (req.file) {
                fileName = "images/users/" + nanoid() + ".webp";
                sharp(req.file.buffer).resize(256).webp({lossless: true}).toFile("public/"+fileName, (err) => {
                    if (err) return next(err);
                })
            } 
        };

        const otherStuff = async () => {
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
    
                    bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
                        if (err) return next(err);
    
                        let contentType = undefined;
                        let path = undefined;
                        if (req.file) {
                            contentType = "image/webp";
                            path = fileName;
                        }
    
                        const user = new User(
                            {
                                first_name: req.body.first_name,
                                last_name: req.body.last_name,
                                email: req.body.email,
                                password: hashedPassword,
                                avatar: {
                                    contentType: contentType,
                                    path: path
                                }
                            }
                        )
            
                        user.save((err) => {
                            if (err) return next(err);
                            res.status(201).json({message: "The user was created successfully", status: 201});
                        })
                    })
                })
            }
        }
        optimizeImage().then(otherStuff);
    }
]

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
                    {message: "Authorization succesful", 
                    token: token,
                    user: {
                        _id: user._id,
                        full_name: user.first_name + " " + user.last_name, 
                    }, 
                    status: 201})
            } else {
                // Password don't match.
                let error = new Error("Incorrect creditentials");
                error.status = 401;
                return next(error);
            }
        })
    })
}


exports.get_users = (req, res, next) => {
    User.find({}, "_id first_name last_name email").exec((err, user_list) => {
        if (err) return next(err)
        if (user_list == null) {
            var error = new Error("No users found");
            error.status = 404;
            return next(error);
        } 
        res.json({user_list: user_list});
    })
}

exports.get_user = (req, res, next) => {
    User.findById(req.params.userid, "_id first_name last_name email").exec((err, theuser) => {
        if (err) return next(err)
        if (theuser == null) {
            var error = new Error("No user found");
            error.status = 404;
            return next(error);
        }
        res.json({user: theuser});
    })
}

exports.put_user = [
    body("first_name", "First name has to be specified").trim().isLength({min:1}).isAlphanumeric().escape(),
    body("last_name", "Last name has to be specified").trim().isLength({min: 1}).isAlphanumeric().escape(),
    body("email", "Email has to be specified").trim().isEmail().isLength({min:1}).escape(),
    body("password", "Password must be specified")
    .custom((value, {req, loc, path}) => {
        if (value !== req.body.password_confirm) {
            throw new Error("Passwords don't match");
        } else {
            return value;
        }
    }),

    (req, res, next) => {
        const errors = validationResult(req);

        const user = new User(
            {
                first_name: req.body.first_name,
                last_name: req.bodt.last_name,
                email: req.body.email,
                password: req.body.password,
                _id: req.params.userid
            }
        )

        if (errors.isEmpty()) {
            res.status(400).json({errors: errors.array()})
            return;
        } else {
            User.findByIdAndUpdate(req.params.userid, user, {}, (err, theuser) => {
                if (err) return next(err);
                res.status(200).json({message: "The user was updated successfully"});
            })
        }
    }

]

exports.delete_user = (req, res, next) => {
    async.parallel({
        user(cb) {
            User.findById(req.params.userid).exec(cb);
        },
    }, (err, results) => {
        if(err) return next(err)
        if (results.user == null) {
            res.status(404).json({message: "The user does not exist"})
        }

        User.findByIdAndDelete(req.params.userid, (err) => {
            if (err) return next(err);
            res.status(204).json({message: "The user was deleted successfully"})
        })
    })
}