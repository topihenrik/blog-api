const router = require("express").Router();
const user_controller = require("../controllers/users");
const passport = require("passport");

// GET single users full details
router.get("/user", passport.authenticate("jwt", { session: false }), user_controller.get_user);
// PUT update single user basic information
router.put("/user/basic", passport.authenticate("jwt", { session: false }), user_controller.put_user_basic);
// PUT update single user password
router.put("/user/password", passport.authenticate("jwt", { session: false }), user_controller.put_user_password);
// DELETE all info relating to single user.
router.delete("/user", passport.authenticate("jwt", { session: false }), user_controller.delete_user_all);

// POST create a new user
router.post("/signup", user_controller.post_signup);
// POST login user
router.post("/login", user_controller.post_login);

module.exports = router;
