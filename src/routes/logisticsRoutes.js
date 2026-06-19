const express = require("express");
const router = express.Router();

const protect = require("../middleware/protect");
const logisticsController = require("../controllers/logisticsController");
const profileController = require("../controllers/logisticsProfileController");

/* ── AUTH ─────────────────────────────────────── */
router.post("/register", logisticsController.registerLogistics);
router.post("/verify-otp", logisticsController.verifyOtp);
router.post("/login", logisticsController.loginLogistics);
router.post("/forgot-password", logisticsController.forgotPassword);
router.post("/verify-reset-otp", logisticsController.verifyResetOtp);
router.post("/reset-password", logisticsController.resetPassword);

/* ── PROFILE ──────────────────────────────────── */
router.get("/profile", protect("logistics"), profileController.getProfile);
router.put("/profile", protect("logistics"), profileController.updateProfile);
router.put("/change-password", protect("logistics"), profileController.changePassword);
router.get("/dashboard", protect("logistics"), profileController.getDashboard);

/* ── DELIVERIES ───────────────────────────────── */
router.get("/deliveries", protect("logistics"), profileController.getDeliveries);
router.put("/deliveries/:id/status", protect("logistics"), profileController.updateDeliveryStatus);

/* ── NOTIFICATIONS ────────────────────────────── */
router.get("/notifications", protect("logistics"), profileController.getNotifications);
router.put("/notifications/:id/read", protect("logistics"), profileController.markNotificationRead);

module.exports = router;
