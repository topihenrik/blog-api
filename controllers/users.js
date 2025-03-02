const config = require("../utils/config");
const User = require("../models/user");
const Post = require("../models/post");
const Comment = require("../models/comment");
const { body, validationResult } = require("express-validator");
const createError = require("http-errors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const streamifier = require("streamifier");
const cloudinary = require("../utils/cloudinary");
const { DateTime } = require("luxon");

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

// signup user
exports.post_signup = [
    upload.single("avatar"),
    body("first_name", "first name has to be specified").trim().isLength({ min: 1 }).isAlpha("fi-FI").escape(),
    body("last_name", "last name has to be specified").trim().isLength({ min: 1 }).isAlpha("fi-FI").escape(),
    body("email", "email has to be specified").trim().isEmail().isLength({ min: 1 }).escape(),
    body("dob", "date of birth has to be specified").isDate().isLength({ min: 1 }).escape(),
    body("password", "password must be specified").isLength({ min: 1 })
        .custom((value, { req }) => {
            if (value !== req.body.password_confirm) {
                throw new Error("passwords don't match");
            } else {
                return value;
            }
        }),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            if(DateTime.fromISO(req.body.dob).diffNow("years").years>-18) {
                return next(createError(400, "you must be over 18 years old"));
            }

            const user = await User.findOne({ email: req.body.email });
            if (user !== null) {
                return next(createError(409, "that email is already taken"));
            }

            const hashedPassword = await bcrypt.hash(req.body.password, 10);

            if (req.file) { // new avatar photo
                const buffer = await sharp(req.file.buffer).resize(256).webp({ lossless: true }).toBuffer();
                const avatar = await uploadImage(buffer); // uploading the user avatar image file to cloudinary.

                const newUser = new User(
                    {
                        first_name: req.body.first_name,
                        last_name: req.body.last_name,
                        email: req.body.email,
                        dob: new Date(req.body.dob),
                        password: hashedPassword,
                        avatar: {
                            is_default: false,
                            public_id: avatar.public_id,
                            originalName: req.file.originalname,
                            url: avatar.secure_url
                        }
                    }
                );

                await newUser.save();
                return res.status(201).json({});
            } else { // no avatar photo, use default
                const newUser = new User(
                    {
                        first_name: req.body.first_name,
                        last_name: req.body.last_name,
                        email: req.body.email,
                        dob: new Date(req.body.dob),
                        password: hashedPassword,
                        avatar: {
                            is_default: true,
                            public_id: undefined,
                            originalName: undefined,
                            url: undefined
                        }
                    }
                );

                await newUser.save();
                return res.status(201).json({});
            }
        } catch (error) {
            return next(error);
        }
    }
];

// login user
exports.post_login = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return next(createError(401, "Incorrect creditentials"));
        }

        const isPwdCorrect = await bcrypt.compare(req.body.password, user.password);
        if (!isPwdCorrect) {
            return next(createError(401, "Incorrect creditentials"));
        }

        const token = jwt.sign({ _id: user._id, email: user.email }, process.env.AUTH_SECRET, { expiresIn: "20h" });

        const userDetails = {
            message: "Authorization succesful",
            token: token,
            user: {
                _id: user._id,
                full_name: user.first_name + " " + user.last_name,
                avatar_url: user.avatar.url
            }
        };

        return res.status(200).json(userDetails);
    } catch (error) {
        return next(error);
    }
};

// get single users full details
exports.get_user = async (req, res, next) => {
    try {
        const user = await User.findById(req.token._id, "_id first_name last_name email dob avatar creation_date");
        if (!user) {
            return next(createError(404, "No user found"));
        }

        if (user._id.toString() !== req.token._id) {
            return next(createError(401, "No authorization"));
        }

        const postCount = await Post.countDocuments({ author: req.token._id });
        const commentCount = await Comment.countDocuments({  author: req.token._id });
        return res.status(200).json({ user: user, postCount: postCount, commentCount: commentCount });
    } catch (error) {
        return next(error);
    }
};

// update user basic information
exports.put_user_basic = [
    upload.single("avatar"),
    body("first_name", "first name has to be specified").trim().isLength({ min: 1 }).isAlpha("fi-FI").escape(),
    body("last_name", "last name has to be specified").trim().isLength({ min: 1 }).isAlpha("fi-FI").escape(),
    body("email", "email has to be specified").trim().isEmail().isLength({ min: 1 }).escape(),
    body("dob", "date of birth has to be specified").isDate({ format: "YYYY-MM-DD" }).isLength({ min: 1 }).escape(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            if(DateTime.fromISO(req.body.dob).diffNow("years").years>-18) {
                return next(createError(400, "you must be over 18 years old"));
            }

            const olduser = await User.findById(req.token._id);
            if (!olduser) {
                return next(createError(404, "User doesn't exist"));
            }

            const emailInUse = await User.findOne({ email: req.body.email });
            if (emailInUse !== null && emailInUse._id.toString() !== req.token._id) {
                return next(createError(409, "that email is already taken"));
            }

            if (req.file) { // new avatar photo
                const buffer = await sharp(req.file.buffer).resize(256).webp({ lossless: true }).toBuffer();
                const avatar = await uploadImage(buffer); // uploading the user avatar image file to cloudinary.

                const editUser = {
                    first_name: req.body.first_name,
                    last_name: req.body.last_name,
                    email: req.body.email,
                    dob: new Date(req.body.dob),
                    avatar: {
                        is_default: false,
                        public_id: avatar.public_id,
                        originalName: req.file.originalname,
                        url: avatar.secure_url
                    },
                    _id: req.token._id
                };

                await User.findByIdAndUpdate(req.token._id, editUser, {});

                if (!olduser.avatar.is_default) {
                    await cloudinary.uploader.destroy(olduser.avatar.public_id);
                }

                return res.status(201).json({});
            } else { // old avatar photo
                const editUser = {
                    first_name: req.body.first_name,
                    last_name: req.body.last_name,
                    email: req.body.email,
                    dob: new Date(req.body.dob),
                    avatar: {
                        is_default: olduser.avatar.is_default,
                        public_id: olduser.avatar.public_id,
                        originalName: olduser.avatar.originalName,
                        url: olduser.avatar.url
                    },
                    _id: req.token._id
                };

                await User.findByIdAndUpdate(req.token._id, editUser, {});
                return res.status(201).json({});
            }
        } catch (error) {
            return next(error);
        }
    }
];

// update user password
exports.put_user_password = [
    body("old_password", "old password must be specified").isLength({ min: 1 }),
    body("password", "password must be specified").isLength({ min: 1 })
        .custom((value, { req }) => {
            if (value !== req.body.password_confirm) {
                throw new Error("passwords don't match");
            } else {
                return value;
            }
        }),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const olduser = await User.findById(req.token._id);
            if (!olduser) {
                return next(createError(404, "User doesn't exist"));
            }

            const isPwdCorrect = await bcrypt.compare(req.body.old_password, olduser.password);
            if (!isPwdCorrect) {
                return next(createError(401, "Incorrect password"));
            }

            const hashedPassword = await bcrypt.hash(req.body.password, 10);

            const editUser = {
                password: hashedPassword,
                _id: req.token._id
            };

            await User.findByIdAndUpdate(req.token._id, editUser, {});
            return res.status(201).json({});
        } catch (error) {
            return next(error);
        }
    }
];

// deletes account's all posts and comments. all comments from accounts posts will be deleted as well. in the end account itself will also be deleted.
exports.delete_user_all = async (req, res, next) => {
    try {
        const user = await User.findById(req.token._id);
        if (!user) {
            return next(createError(404, "The user doesnt exist"));
        }

        if (user.email !== req.body.email) {
            return next(createError(401, "Incorrect creditentials"));
        }

        const isPwdCorrect = await bcrypt.compare(req.body.password, user.password);
        if (!isPwdCorrect) {
            return next(createError(401, "Incorrect creditentials"));
        }

        const posts_array = await Post.find({ author: req.token._id }); // find user's all posts

        await Promise.all(
            posts_array.map(async post => {
                const comments_array = await Comment.find({ post: post._id }); // find all comments from user's posts
                return await Promise.all(
                    comments_array.map(async comment => {
                        return await Comment.findByIdAndDelete(comment._id); // delete comments from the user's posts
                    })
                );
            })
        );

        await Promise.all(
            posts_array.filter(post => !post.photo.is_default).map(async post => {
                return await cloudinary.uploader.destroy(post.photo.public_id); // delete user's posts non-default cover photos
            })
        );

        await Promise.all(
            posts_array.map(async post => {
                return await Post.findByIdAndDelete(post._id); // delete user's posts
            })
        );

        const comments_array = await Comment.find({ author: req.token._id }); // find user's all comments
        await Promise.all(
            comments_array.map(async comment => {
                return await Comment.findByIdAndDelete(comment._id); // delete user's all comments
            })
        );

        if (!user.avatar.is_default) {
            await cloudinary.uploader.destroy(user.avatar.public_id); // delete user's non-default avatar photo
        }

        await User.findByIdAndDelete(req.token._id); // delete User

        return res.status(200).json({});
    } catch (error) {
        return next(error);
    }
};
