const express = require("express");
const router = express.Router();

const protect = require("../middleware/protect");
const buyerController = require("../controllers/buyerController");
const profileController = require("../controllers/buyerProfileController");
const cartController = require("../controllers/cartController");
const orderController = require("../controllers/orderController");
const paymentController = require("../controllers/paymentController");

/* ── AUTH ─────────────────────────────────────── */
router.post("/register", buyerController.registerBuyer);
router.post("/verify-otp", buyerController.verifyOtp);
router.post("/login", buyerController.loginBuyer);
router.post("/forgot-password", buyerController.forgotPassword);
router.post("/verify-reset-otp", buyerController.verifyResetOtp);
router.post("/reset-password", buyerController.resetPassword);

/* ── PROFILE ──────────────────────────────────── */
router.get("/profile", protect("buyer"), profileController.getProfile);
router.put("/profile", protect("buyer"), profileController.updateProfile);
router.put("/change-password", protect("buyer"), profileController.changePassword);

/* ── SAVED SUPPLIERS ──────────────────────────── */
router.get("/saved-suppliers", protect("buyer"), profileController.getSavedSuppliers);
router.post("/saved-suppliers/:farmerId", protect("buyer"), profileController.saveSupplier);
router.delete("/saved-suppliers/:farmerId", protect("buyer"), profileController.removeSupplier);

/* ── SAVED CARDS ──────────────────────────────── */
router.get("/saved-cards", protect("buyer"), profileController.getSavedCards);
router.post("/saved-cards", protect("buyer"), profileController.saveCard);
router.delete("/saved-cards/:cardId", protect("buyer"), profileController.removeCard);

/* ── NOTIFICATIONS ────────────────────────────── */
router.get("/notifications", protect("buyer"), profileController.getNotifications);
router.put("/notifications/read-all", protect("buyer"), profileController.markAllNotificationsRead);
router.put("/notifications/:id/read", protect("buyer"), profileController.markNotificationRead);

/* ── CART ─────────────────────────────────────── */
router.get("/cart", protect("buyer"), cartController.getCart);
router.post("/cart", protect("buyer"), cartController.addToCart);
router.put("/cart/:itemId", protect("buyer"), cartController.updateCartItem);
router.delete("/cart/:itemId", protect("buyer"), cartController.removeCartItem);
router.delete("/cart", protect("buyer"), cartController.clearCart);

/* ── ORDERS ───────────────────────────────────── */
router.post("/orders", protect("buyer"), orderController.createOrder);
router.get("/orders", protect("buyer"), orderController.getMyOrders);
router.get("/orders/:id", protect("buyer"), orderController.getOrder);
router.put("/orders/:id/cancel", protect("buyer"), orderController.cancelOrder);

/* ── PAYMENTS ─────────────────────────────────── */
router.get("/payments/bank-details", protect("buyer"), paymentController.getBankDetails);
router.post("/payments/bank-transfer", protect("buyer"), paymentController.confirmBankTransfer);
router.post("/payments/card", protect("buyer"), paymentController.payWithCard);
router.get("/payments", protect("buyer"), paymentController.getPaymentHistory);

module.exports = router;
