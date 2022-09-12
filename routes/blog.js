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
// GET all posts
router.get("/posts", post_controller.posts_get);
// GET single post
router.get("/posts/:postid", post_controller.post_get);



// COMMNENT ROUTES
// GET all comments related to specific post
router.get("/posts/:postid/comments", comment_controller.comments_get)
// GET single comment
router.get("/posts/:postid/comments/:commentid", comment_controller.comment_get)



// USER ROUTES
// POST create a new user
router.post("/signup", user_controller.post_user)
// POST login user
router.post("/login", user_controller.post_login)
// GET logout user
router.get("/logout")

// GET all users
router.get("/users", user_controller.get_users)
// GET single user
router.get("/users/:userid", user_controller.get_user)



module.exports = router;