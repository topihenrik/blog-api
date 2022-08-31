const User = require("../models/user")
const { body,validationResult } = require('express-validator')
const async = require("async")



exports.post_user = [
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

        if (!errors.isEmpty()) {
            res.json({user: req.body, errors: errors})
        } else {
            const user = new User(
                {
                    first_name: req.body.first_name,
                    last_name: req.body.last_name,
                    email: req.body.email,
                    password: req.body.password
                }
            )

            user.save((err) => {
                if (err) return next(err);
                res.status(201).json({message: "The user was created successfully"});
            })
        }
    }
]

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
            res.json({user: user, errors: errors.array()})
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