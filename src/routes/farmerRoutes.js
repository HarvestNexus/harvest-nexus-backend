const express = require("express");
const router = express.Router();
const farmerController = require("../controllers/farmerController");

router.post("/register", farmerController.registerFarmer);
router.post("/verify", farmerController.verifyOtp);
router.post("/login", farmerController.loginFarmer);
router.post("/forgot-password", farmerController.farmerForgotPassword);
router.post("/verify-reset-otp", farmerController.verifyResetOtp);
router.post("/reset-password", farmerController.farmerResetPassword);

module.exports = router;
