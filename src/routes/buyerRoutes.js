const express = require("express");
const router = express.Router();
const buyerController = require("../controllers/buyerController");

router.post("/register", buyerController.registerBuyer);
router.post("/verify-otp", buyerController.verifyOtp);
router.post("/login", buyerController.loginBuyer);
router.post("/forgot-password", buyerController.forgotPassword);
router.post("/verify-reset-otp", buyerController.verifyResetOtp);
router.post("/reset-password", buyerController.resetPassword);

module.exports = router;
