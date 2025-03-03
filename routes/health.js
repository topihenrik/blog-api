const router = require("express").Router();

/* HEAD status response */
router.head("/", function(req, res) {
    res.status(200).send();
});

module.exports = router;
