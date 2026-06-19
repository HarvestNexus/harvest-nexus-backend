require("dotenv").config();

const Payment = require("../models/paymentModel");
const Order = require("../models/orderModel");
const Notification = require("../models/notificationModel");

/* ==================================================
   GET BANK TRANSFER DETAILS
================================================== */
exports.getBankDetails = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      bank_name: process.env.BANK_NAME || "First Bank of Nigeria",
      account_name: process.env.ACCOUNT_NAME || "Harvest Nexus Limited",
      account_number: process.env.ACCOUNT_NUMBER || "0123456789",
      note: "Use your order reference number as the payment narration.",
    },
  });
};

/* ==================================================
   CONFIRM BANK TRANSFER
================================================== */
exports.confirmBankTransfer = async (req, res) => {
  try {
    const { order_id, reference } = req.body;

    if (!order_id)
      return res.status(400).json({ success: false, message: "Order ID is required." });

    const order = await Order.findOne({ _id: order_id, buyer_id: req.user.id });

    if (!order) return res.status(404).json({ success: false, message: "Order not found." });

    if (order.payment_status === "paid")
      return res.status(400).json({ success: false, message: "Order is already paid." });

    order.payment_status = "paid";
    order.order_status = "confirmed";
    await order.save();

    await Payment.findOneAndUpdate(
      { order_id },
      { status: "successful", reference: reference || order.reference },
      { new: true }
    );

    await Notification.create({
      user_id: req.user.id,
      user_role: "buyer",
      title: "Payment Confirmed",
      message: `Bank transfer for order ${order.reference} has been confirmed.`,
      type: "payment",
      ref_id: order._id,
    });

    return res.status(200).json({ success: true, message: "Bank transfer confirmed. Order is now active.", data: order });
  } catch (err) {
    console.error("Confirm Bank Transfer:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ==================================================
   PAY WITH CARD
================================================== */
exports.payWithCard = async (req, res) => {
  try {
    const { order_id, card_number, cardholder_name, expiry, cvv } = req.body;

    if (!order_id || !card_number || !cardholder_name || !expiry || !cvv)
      return res.status(400).json({ success: false, message: "All card details are required." });

    const order = await Order.findOne({ _id: order_id, buyer_id: req.user.id });

    if (!order) return res.status(404).json({ success: false, message: "Order not found." });

    if (order.payment_status === "paid")
      return res.status(400).json({ success: false, message: "Order is already paid." });

    order.payment_status = "paid";
    order.order_status = "confirmed";
    await order.save();

    await Payment.findOneAndUpdate(
      { order_id },
      {
        status: "successful",
        method: "card",
        card_last4: card_number.replace(/\s/g, "").slice(-4),
        cardholder_name,
      },
      { new: true }
    );

    await Notification.create({
      user_id: req.user.id,
      user_role: "buyer",
      title: "Payment Successful",
      message: `Card payment for order ${order.reference} was successful.`,
      type: "payment",
      ref_id: order._id,
    });

    return res.status(200).json({ success: true, message: "Card payment successful.", data: order });
  } catch (err) {
    console.error("Pay With Card:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ==================================================
   GET PAYMENT HISTORY (Buyer)
================================================== */
exports.getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Payment.countDocuments({ buyer_id: req.user.id });

    const payments = await Payment.find({ buyer_id: req.user.id })
      .populate("order_id", "reference total_amount order_status items")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      data: payments,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    console.error("Get Payment History:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};
