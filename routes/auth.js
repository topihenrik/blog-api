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
router.get("/posts/:postid/edit", post_controller.post_get_edit);

// UPDATE
// PUT update single post
router.put("/posts", post_controller.post_put);

// DELETE
// DELETE delete single post
router.delete("/posts/:postid", post_controller.post_delete);


// COMMNENT ROUTES
// POST create single comment
router.post("/posts/:postid/comments", comment_controller.comment_post)
// PUT update single post
router.put("/posts/:postid/comments/:commentid", comment_controller.comment_put)
// DELETE delete single post
router.delete("/posts/:postid/comments/:commentid", comment_controller.comment_delete)


// USER ROUTES
// PUT update single user
router.put("/users/:userid", user_controller.put_user)
// DELETE delete single user
router.delete("/users/:userid", user_controller.delete_user)



module.exports = router;