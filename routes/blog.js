var express = require('express');
var router = express.Router();

const post_controller = require("../controllers/postController")
const comment_controller = require("../controllers/commentController")
const user_controller = require("../controllers/userController");


/* GET home page. */
router.get('/', function(req, res, next) {
    res.json({message: "Blog API index response"});
});


// POST ROUTES


// POST create single post
router.post("/posts", post_controller.post_post);
// GET all posts
router.get("/posts", post_controller.posts_get);
// GET single post
router.get("/posts/:postid", post_controller.post_get);
// PUT update single post
router.put("/posts/:postid", post_controller.post_put);
// DELETE delete single post
router.delete("/posts/:postid", post_controller.post_delete);


// COMMNENT ROUTES

// POST create single comment
router.post("/posts/:postid/comments", comment_controller.comment_post)
// GET all comments related to specific post
router.get("/posts/:postid/comments", comment_controller.comments_get)
// GET single comment
router.get("/posts/:postid/comments/:commentid", comment_controller.comment_get)
// PUT update single post
router.put("/posts/:postid/comments/:commentid", comment_controller.comment_put)
// DELETE delete single post
router.delete("/posts/:postid/comments/:commentid", comment_controller.comment_delete)


// USER ROUTES

// POST create single user
router.post("/users", user_controller.post_user)
// GET all users
router.get("/users", user_controller.get_users)
// GET single user
router.get("/users/:userid", user_controller.get_user)
// PUT update single user
router.put("/users/:userid", user_controller.put_user)
// DELETE delete single user
router.delete("/users/:userid", user_controller.delete_user)


module.exports = router;