const router = require("express").Router();

const post_controller = require("../controllers/posts");
const comment_controller = require("../controllers/comments");
const user_controller = require("../controllers/users");
const middleware = require("../utils/middleware");



/* HEAD status response */
router.head("/", function(req, res) {
    res.status(200).send();
});



/* POST ROUTES */
// GET all posts
router.get("/posts", post_controller.get_posts);
// GET single post
router.get("/posts/:postid", middleware.tokenExtract, post_controller.get_post);



/* COMMNENT ROUTES */
// GET all comments related to specific post
router.get("/comments/post/:postid", comment_controller.get_comments);



/* USER ROUTES */
// POST create a new user
router.post("/signup", user_controller.post_signup);
// POST login user
router.post("/login", user_controller.post_login);



module.exports = router;
