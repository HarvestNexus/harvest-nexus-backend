require("dotenv").config();

const Farmer = require("../models/farmerModel");
const Product = require("../models/productModel");
const Order = require("../models/orderModel");
const Notification = require("../models/notificationModel");
const bcrypt = require("bcryptjs");
const hashedPassword = require("../utils/hashedPassword");

/* ==================================================
   GET PROFILE
================================================== */
exports.getProfile = async (req, res) => {
  try {
    const farmer = await Farmer.findById(req.user.id).select("-password");
    if (!farmer) return res.status(404).json({ success: false, message: "Farmer not found." });
    return res.status(200).json({ success: true, data: farmer });
  } catch (err) {
    console.error("Get Farmer Profile:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ==================================================
   UPDATE PROFILE
================================================== */
exports.updateProfile = async (req, res) => {
  try {
    const {
      full_name, phone_number, location, crop_type,
      farm_name, description, profile_image,
      bank_name, account_number, account_name,
    } = req.body;

    const farmer = await Farmer.findByIdAndUpdate(
      req.user.id,
      { $set: { full_name, phone_number, location, crop_type, farm_name, description, profile_image, bank_name, account_number, account_name } },
      { new: true, runValidators: true }
    ).select("-password");

    return res.status(200).json({ success: true, message: "Profile updated.", data: farmer });
  } catch (err) {
    console.error("Update Farmer Profile:", err);
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

    const farmer = await Farmer.findById(req.user.id);
    const isMatch = await bcrypt.compare(currentPassword, farmer.password);

    if (!isMatch)
      return res.status(400).json({ success: false, message: "Current password is incorrect." });

    farmer.password = await hashedPassword(newPassword);
    await farmer.save();

    return res.status(200).json({ success: true, message: "Password changed successfully." });
  } catch (err) {
    console.error("Change Farmer Password:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ==================================================
   DASHBOARD STATS
================================================== */
exports.getDashboard = async (req, res) => {
  try {
    const farmerId = req.user.id;

    const totalProducts = await Product.countDocuments({ farmer_id: farmerId, status: "available" });

    const orders = await Order.find({ "items.farmer_id": farmerId });

    const totalOrders = orders.length;

    const totalRevenue = orders
      .filter(o => o.payment_status === "paid")
      .reduce((sum, o) => {
        const farmerItems = o.items.filter(i => i.farmer_id && i.farmer_id.toString() === farmerId);
        return sum + farmerItems.reduce((s, i) => s + (i.subtotal || 0), 0);
      }, 0);

    const pendingOrders = orders.filter(o => o.order_status === "pending").length;

    return res.status(200).json({
      success: true,
      data: { totalProducts, totalOrders, totalRevenue, pendingOrders },
    });
  } catch (err) {
    console.error("Farmer Dashboard:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ==================================================
   NOTIFICATIONS
================================================== */
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user_id: req.user.id, user_role: "farmer" })
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: notifications });
  } catch (err) {
    console.error("Get Farmer Notifications:", err);
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
