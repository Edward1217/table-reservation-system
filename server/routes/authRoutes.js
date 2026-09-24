const express = require("express");

const { loginAdmin } = require("../controllers/authController");

const loginRateLimiter = require("../middleware/loginRateLimiter");

const router = express.Router();

router.post("/login", loginRateLimiter, loginAdmin);

module.exports = router;
