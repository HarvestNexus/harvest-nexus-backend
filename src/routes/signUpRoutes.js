const express = require("express");
const router = express.Router();
const { signUp, verifyOtp } = require("../controllers/signUpController");

router.post("/register", signUp);
router.post("/verify-otp", verifyOtp);

module.exports = router;