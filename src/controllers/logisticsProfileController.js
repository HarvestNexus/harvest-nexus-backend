require("dotenv").config();

const Logistics = require("../models/logisticsModel");
const Order = require("../models/orderModel");
const DeliveryRequest = require("../models/deliveryRequestModel");
const Notification = require("../models/notificationModel");
const bcrypt = require("bcryptjs");
const hashedPassword = require("../utils/hashedPassword");

/* ==================================================
   GET PROFILE
================================================== */
exports.getProfile = async (req, res) => {
  try {
    const logistics = await Logistics.findById(req.user.id).select("-password");
    if (!logistics) return res.status(404).json({ success: false, message: "Account not found." });
    return res.status(200).json({ success: true, data: logistics });
  } catch (err) {
    console.error("Get Logistics Profile:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ==================================================
   UPDATE PROFILE
================================================== */
exports.updateProfile = async (req, res) => {
  try {
    const { company_name, vehicle_type, vehicle_capacity, service_area, profile_image, is_available } = req.body;

    const logistics = await Logistics.findByIdAndUpdate(
      req.user.id,
      { $set: { company_name, vehicle_type, vehicle_capacity, service_area, profile_image, is_available } },
      { new: true }
    ).select("-password");

    return res.status(200).json({ success: true, message: "Profile updated.", data: logistics });
  } catch (err) {
    console.error("Update Logistics Profile:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ==================================================
   CHANGE PASSWORD
================================================== */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword)
      return res.status(400).json({ success: false, message: "All fields are required." });

    if (newPassword !== confirmPassword)
      return res.status(400).json({ success: false, message: "Passwords do not match." });

    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });

    const logistics = await Logistics.findById(req.user.id);
    const isMatch = await bcrypt.compare(currentPassword, logistics.password);

    if (!isMatch)
      return res.status(400).json({ success: false, message: "Current password is incorrect." });

    logistics.password = await hashedPassword(newPassword);
    await logistics.save();

    return res.status(200).json({ success: true, message: "Password changed successfully." });
  } catch (err) {
    console.error("Change Logistics Password:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ==================================================
   GET DELIVERIES
================================================== */
exports.getDeliveries = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { logistics_id: req.user.id };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await DeliveryRequest.countDocuments(filter);

    const deliveries = await DeliveryRequest.find(filter)
      .populate("order_id", "reference total_amount items")
      .populate("buyer_id", "full_name phone_number address")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      data: deliveries,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    console.error("Get Deliveries:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ==================================================
   UPDATE DELIVERY STATUS
================================================== */
exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["accepted", "picked_up", "in_transit", "delivered"];
    if (!validStatuses.includes(status))
      return res.status(400).json({ success: false, message: "Invalid status." });

    const delivery = await DeliveryRequest.findOneAndUpdate(
      { _id: id, logistics_id: req.user.id },
      { status },
      { new: true }
    );

    if (!delivery) return res.status(404).json({ success: false, message: "Delivery not found." });

    if (status === "in_transit") {
      await Order.findByIdAndUpdate(delivery.order_id, { order_status: "in_transit" });
    }

    if (status === "delivered") {
      await Order.findByIdAndUpdate(delivery.order_id, { order_status: "delivered" });

      await Notification.create({
        user_id: delivery.buyer_id,
        user_role: "buyer",
        title: "Order Delivered",
        message: "Your order has been delivered successfully.",
        type: "delivery",
        ref_id: delivery.order_id,
      });
    }

    return res.status(200).json({ success: true, message: `Delivery marked as ${status}.`, data: delivery });
  } catch (err) {
    console.error("Update Delivery Status:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ==================================================
   DASHBOARD STATS
================================================== */
exports.getDashboard = async (req, res) => {
  try {
    const total = await DeliveryRequest.countDocuments({ logistics_id: req.user.id });
    const completed = await DeliveryRequest.countDocuments({ logistics_id: req.user.id, status: "delivered" });
    const pending = await DeliveryRequest.countDocuments({ logistics_id: req.user.id, status: "pending" });
    const active = await DeliveryRequest.countDocuments({ logistics_id: req.user.id, status: { $in: ["accepted", "picked_up", "in_transit"] } });

    return res.status(200).json({
      success: true,
      data: { total, completed, pending, active },
    });
  } catch (err) {
    console.error("Logistics Dashboard:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ==================================================
   NOTIFICATIONS
================================================== */
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user_id: req.user.id, user_role: "logistics" })
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: notifications });
  } catch (err) {
    console.error("Get Logistics Notifications:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { is_read: true });
    return res.status(200).json({ success: true, message: "Notification marked as read." });
  } catch (err) {
    console.error("Mark Notification Read:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};
