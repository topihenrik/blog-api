var express = require('express');
var router = express.Router();

const post_controller = require("../controllers/postController")
const comment_controller = require("../controllers/commentController")
const user_controller = require("../controllers/userController");


// POST ROUTES

//CREATE
// POST create single post
router.post("/posts", post_controller.post_post);

//READ
// GET single post from specific author
router.get("/posts/author", post_controller.get_posts_author);
// GET specific post with comment count
router.get("/posts/:postid", post_controller.get_post_commentcount);
// GET specific post for updating
router.get("/posts/:postid/edit", post_controller.get_post_edit);

// UPDATE
// PUT update single post
router.put("/posts", post_controller.put_post);

// DELETE
// DELETE delete single post
router.delete("/posts/:postid", post_controller.delete_post);


// COMMNENT ROUTES
// POST create single comment
router.post("/posts/:postid/comments", comment_controller.post_comment)
// PUT update single post
router.put("/posts/:postid/comments/:commentid", comment_controller.put_comment)
// DELETE delete single post
router.delete("/posts/:postid/comments/:commentid", comment_controller.delete_comment)


// USER ROUTES

// PUT update single user basic information
router.put("/user/basic", user_controller.put_user_basic);
// PUT update single user password
router.put("/user/password", user_controller.put_user_password);
// DELETE all info relating to single user.
router.delete("/user/delete/all", user_controller.delete_user_all);

// GET all users
router.get("/users", user_controller.get_users)
// GET single user with full details
router.get("/user", user_controller.get_user)
// GET single user for editing
router.get("/user/edit", user_controller.get_user_edit)


module.exports = router;