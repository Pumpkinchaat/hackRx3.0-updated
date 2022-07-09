const express = require("express");
const router = express.Router();
const { login, logoutUser } = require("../controllers/auth");
const { createUser } = require("../controllers/user/index");

router.route("/signup").post(createUser);

router.route("/login").post(login);

router.route("/logout").post(logoutUser);

module.exports = router;
