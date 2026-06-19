const express = require("express");
const router = express.Router();

const protect = require("../middleware/protect");
const storageController = require("../controllers/storageController");
const profileController = require("../controllers/storageProfileController");

/* ── AUTH ─────────────────────────────────────── */
router.post("/register", storageController.registerStorage);
router.post("/verify-otp", storageController.verifyStorageOtp);
router.post("/login", storageController.loginStorage);
router.post("/forgot-password", storageController.forgotStoragePassword);
router.post("/verify-reset-otp", storageController.verifyStorageResetOtp);
router.post("/reset-password", storageController.resetStoragePassword);

/* ── PROFILE ──────────────────────────────────── */
router.get("/profile", protect("storage"), profileController.getProfile);
router.put("/profile", protect("storage"), profileController.updateProfile);
router.put("/change-password", protect("storage"), profileController.changePassword);
router.get("/dashboard", protect("storage"), profileController.getDashboard);

/* ── BOOKINGS ─────────────────────────────────── */
router.get("/bookings", protect("storage"), profileController.getBookings);
router.put("/bookings/:id/status", protect("storage"), profileController.updateBookingStatus);

/* ── NOTIFICATIONS ────────────────────────────── */
router.get("/notifications", protect("storage"), profileController.getNotifications);
router.put("/notifications/:id/read", protect("storage"), profileController.markNotificationRead);

module.exports = router;
