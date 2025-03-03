const router = require("express").Router();
const post_controller = require("../controllers/posts");
const { tokenExtract } = require("../utils/middleware");
const passport = require("passport");

// POST create single post
router.post("/posts", passport.authenticate("jwt", { session: false }), post_controller.post_post);
// GET all posts from specific author
router.get("/posts/author", passport.authenticate("jwt", { session: false }), post_controller.get_posts_author);
// PUT update single post
router.put("/posts/:postid", passport.authenticate("jwt", { session: false }), post_controller.put_post);
// DELETE delete single post
router.delete("/posts/:postid", passport.authenticate("jwt", { session: false }), post_controller.delete_post);

// GET all posts
router.get("/posts", post_controller.get_posts);
// GET single post
router.get("/posts/:postid", tokenExtract, post_controller.get_post);

module.exports = router;
