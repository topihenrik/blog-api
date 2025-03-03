const router = require("express").Router();
const comment_controller = require("../controllers/comments");
const passport = require("passport");

// POST create single comment
router.post("/comments", passport.authenticate("jwt", { session: false }), comment_controller.post_comment);
// PUT update single post
router.put("/comments/:commentid", passport.authenticate("jwt", { session: false }), comment_controller.put_comment);
// DELETE delete single post
router.delete("/comments/:commentid", passport.authenticate("jwt", { session: false }), comment_controller.delete_comment);

// GET all comments related to specific post
router.get("/comments/post/:postid", comment_controller.get_comments);

module.exports = router;
