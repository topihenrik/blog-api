var express = require('express');
var router = express.Router();

const post_controller = require("../controllers/postController")
const comment_controller = require("../controllers/commentController")
const user_controller = require("../controllers/userController");



/* GET home page. */
router.get('/', function(req, res, next) {
    res.status(200).json({status: 200, message: "Blog API is operational"});
});



/* POST ROUTES */
// GET all posts
router.get("/posts", post_controller.get_posts);
// GET single post
router.get("/posts/:postid", post_controller.get_post);



/* COMMNENT ROUTES */
// GET all comments related to specific post
router.get("/posts/:postid/comments", comment_controller.get_comments)
// GET single comment
router.get("/posts/:postid/comments/:commentid", comment_controller.get_comment)



/* USER ROUTES */
// POST create a new user
router.post("/signup", user_controller.post_user)
// POST login user
router.post("/login", user_controller.post_login)



module.exports = router;