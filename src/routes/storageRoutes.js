const express = require("express");
const router = express.Router();
const {
  registerStorage,
  verifyStorageOtp,
  loginStorage,
  forgotStoragePassword,
  verifyStorageResetOtp,
  resetStoragePassword,
} = require("../controllers/storageController");


router.post("/register", registerStorage);
router.post("/verify-otp", verifyStorageOtp);
router.post("/login", loginStorage);
router.post("/forgot-password", forgotStoragePassword);
router.post("/verify-reset-otp", verifyStorageResetOtp);
router.post("/reset-password", resetStoragePassword);

module.exports = router;
