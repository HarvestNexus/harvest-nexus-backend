// routes/logisticsRoutes.js

const express = require("express");
const router = express.Router();

const {
  registerLogistics,
  verifyOtp,
  loginLogistics,
  forgotPassword,
  verifyResetOtp,
  resetPassword
} = require("../controllers/logisticsController");

router.post("/register", registerLogistics);
router.post("/verify-otp", verifyOtp);
router.post("/login", loginLogistics);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);

module.exports = router;