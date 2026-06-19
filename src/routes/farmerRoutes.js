const express = require("express");
const router = express.Router();

const protect = require("../middleware/protect");
const farmerController = require("../controllers/farmerController");
const profileController = require("../controllers/farmerProfileController");
const productController = require("../controllers/productController");
const orderController = require("../controllers/orderController");
const storageBookingController = require("../controllers/storageBookingController");

/* ── AUTH ─────────────────────────────────────── */
router.post("/register", farmerController.registerFarmer);
router.post("/verify", farmerController.verifyOtp);
router.post("/login", farmerController.loginFarmer);
router.post("/forgot-password", farmerController.farmerForgotPassword);
router.post("/verify-reset-otp", farmerController.verifyResetOtp);
router.post("/reset-password", farmerController.farmerResetPassword);

/* ── PROFILE ──────────────────────────────────── */
router.get("/profile", protect("farmer"), profileController.getProfile);
router.put("/profile", protect("farmer"), profileController.updateProfile);
router.put("/change-password", protect("farmer"), profileController.changePassword);
router.get("/dashboard", protect("farmer"), profileController.getDashboard);

/* ── NOTIFICATIONS ────────────────────────────── */
router.get("/notifications", protect("farmer"), profileController.getNotifications);
router.put("/notifications/:id/read", protect("farmer"), profileController.markNotificationRead);

/* ── PRODUCTS ─────────────────────────────────── */
router.get("/products", protect("farmer"), productController.getMyProducts);
router.post("/products", protect("farmer"), productController.createProduct);
router.put("/products/:id", protect("farmer"), productController.updateProduct);
router.delete("/products/:id", protect("farmer"), productController.deleteProduct);

/* ── ORDERS ───────────────────────────────────── */
router.get("/orders", protect("farmer"), orderController.getFarmerOrders);
router.put("/orders/:id/confirm", protect("farmer"), orderController.confirmOrder);
router.put("/orders/:id/ready", protect("farmer"), orderController.markOrderReady);

/* ── STORAGE ──────────────────────────────────── */
router.get("/storage", protect("farmer"), storageBookingController.getAllStorage);
router.post("/storage/book", protect("farmer"), storageBookingController.bookStorage);
router.get("/storage/bookings", protect("farmer"), storageBookingController.getMyBookings);
router.put("/storage/bookings/:id/cancel", protect("farmer"), storageBookingController.cancelBooking);

module.exports = router;
