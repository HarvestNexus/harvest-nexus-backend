const express = require("express");
const router = express.Router();
const logisticsController = require("../controllers/logisticsController");

router.post("/register", logisticsController.registerLogistics);
router.post("/verify-otp", logisticsController.verifyOtp);
router.post("/login", logisticsController.loginLogistics);
router.post("/forgot-password", logisticsController.forgotPassword);
router.post("/verify-reset-otp", logisticsController.verifyResetOtp);
router.post("/reset-password", logisticsController.resetPassword);

module.exports = router;
