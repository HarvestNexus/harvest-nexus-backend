require("dotenv").config();

const Storage = require("../models/storageModel");
const StorageBooking = require("../models/storageBookingModel");
const Notification = require("../models/notificationModel");
const bcrypt = require("bcryptjs");
const hashedPassword = require("../utils/hashedPassword");

/* ==================================================
   GET PROFILE
================================================== */
exports.getProfile = async (req, res) => {
  try {
    const storage = await Storage.findById(req.user.id).select("-password");
    if (!storage) return res.status(404).json({ success: false, message: "Account not found." });
    return res.status(200).json({ success: true, data: storage });
  } catch (err) {
    console.error("Get Storage Profile:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ==================================================
   UPDATE PROFILE
================================================== */
exports.updateProfile = async (req, res) => {
  try {
    const { storage_name, storage_location, storage_type, profile_image, capacity, price_per_unit, is_available } = req.body;

    const storage = await Storage.findByIdAndUpdate(
      req.user.id,
      { $set: { storage_name, storage_location, storage_type, profile_image, capacity, price_per_unit, is_available } },
      { new: true }
    ).select("-password");

    return res.status(200).json({ success: true, message: "Profile updated.", data: storage });
  } catch (err) {
    console.error("Update Storage Profile:", err);
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

    const storage = await Storage.findById(req.user.id);
    const isMatch = await bcrypt.compare(currentPassword, storage.password);

    if (!isMatch)
      return res.status(400).json({ success: false, message: "Current password is incorrect." });

    storage.password = await hashedPassword(newPassword);
    await storage.save();

    return res.status(200).json({ success: true, message: "Password changed successfully." });
  } catch (err) {
    console.error("Change Storage Password:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ==================================================
   GET BOOKINGS
================================================== */
exports.getBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { storage_id: req.user.id };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await StorageBooking.countDocuments(filter);

    const bookings = await StorageBooking.find(filter)
      .populate("farmer_id", "full_name farm_name phone_number email location")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      data: bookings,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    console.error("Get Storage Bookings:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ==================================================
   UPDATE BOOKING STATUS
================================================== */
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["accepted", "rejected", "completed"];
    if (!validStatuses.includes(status))
      return res.status(400).json({ success: false, message: "Invalid status." });

    const booking = await StorageBooking.findOneAndUpdate(
      { _id: id, storage_id: req.user.id },
      { status },
      { new: true }
    );

    if (!booking) return res.status(404).json({ success: false, message: "Booking not found." });

    const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

    await Notification.create({
      user_id: booking.farmer_id,
      user_role: "farmer",
      title: `Storage Booking ${statusLabel}`,
      message: `Your storage booking for ${booking.produce_type} has been ${status}.`,
      type: "storage",
      ref_id: booking._id,
    });

    return res.status(200).json({ success: true, message: `Booking ${status}.`, data: booking });
  } catch (err) {
    console.error("Update Booking Status:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ==================================================
   DASHBOARD STATS
================================================== */
exports.getDashboard = async (req, res) => {
  try {
    const total = await StorageBooking.countDocuments({ storage_id: req.user.id });
    const pending = await StorageBooking.countDocuments({ storage_id: req.user.id, status: "pending" });
    const active = await StorageBooking.countDocuments({ storage_id: req.user.id, status: "active" });
    const completed = await StorageBooking.countDocuments({ storage_id: req.user.id, status: "completed" });

    return res.status(200).json({
      success: true,
      data: { total, pending, active, completed },
    });
  } catch (err) {
    console.error("Storage Dashboard:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ==================================================
   NOTIFICATIONS
================================================== */
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user_id: req.user.id, user_role: "storage" })
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: notifications });
  } catch (err) {
    console.error("Get Storage Notifications:", err);
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
