require("dotenv").config();

const Buyer = require("../models/buyerModel");
const Farmer = require("../models/farmerModel");
const Notification = require("../models/notificationModel");
const bcrypt = require("bcryptjs");
const hashedPassword = require("../utils/hashedPassword");

/* ==================================================
   GET PROFILE
================================================== */
exports.getProfile = async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.user.id)
      .select("-password")
      .populate("saved_suppliers", "full_name farm_name location crop_type profile_image rating phone_number email");

    if (!buyer) return res.status(404).json({ success: false, message: "Buyer not found." });

    return res.status(200).json({ success: true, data: buyer });
  } catch (err) {
    console.error("Get Buyer Profile:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ==================================================
   UPDATE PROFILE
================================================== */
exports.updateProfile = async (req, res) => {
  try {
    const { full_name, phone_number, address, profile_image } = req.body;

    const buyer = await Buyer.findByIdAndUpdate(
      req.user.id,
      { $set: { full_name, phone_number, address, profile_image } },
      { new: true, runValidators: true }
    ).select("-password");

    return res.status(200).json({ success: true, message: "Profile updated.", data: buyer });
  } catch (err) {
    console.error("Update Buyer Profile:", err);
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

    const buyer = await Buyer.findById(req.user.id);
    const isMatch = await bcrypt.compare(currentPassword, buyer.password);

    if (!isMatch)
      return res.status(400).json({ success: false, message: "Current password is incorrect." });

    buyer.password = await hashedPassword(newPassword);
    await buyer.save();

    return res.status(200).json({ success: true, message: "Password changed successfully." });
  } catch (err) {
    console.error("Change Password:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ==================================================
   SAVED SUPPLIERS
================================================== */
exports.getSavedSuppliers = async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.user.id)
      .populate("saved_suppliers", "full_name farm_name location crop_type profile_image rating phone_number email");

    return res.status(200).json({ success: true, data: buyer.saved_suppliers });
  } catch (err) {
    console.error("Get Saved Suppliers:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

exports.saveSupplier = async (req, res) => {
  try {
    const { farmerId } = req.params;

    const farmer = await Farmer.findById(farmerId);
    if (!farmer) return res.status(404).json({ success: false, message: "Farmer not found." });

    const buyer = await Buyer.findById(req.user.id);
    if (buyer.saved_suppliers.map(id => id.toString()).includes(farmerId))
      return res.status(400).json({ success: false, message: "Supplier already saved." });

    buyer.saved_suppliers.push(farmerId);
    await buyer.save();

    return res.status(200).json({ success: true, message: "Supplier saved." });
  } catch (err) {
    console.error("Save Supplier:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

exports.removeSupplier = async (req, res) => {
  try {
    const { farmerId } = req.params;

    await Buyer.findByIdAndUpdate(req.user.id, { $pull: { saved_suppliers: farmerId } });

    return res.status(200).json({ success: true, message: "Supplier removed." });
  } catch (err) {
    console.error("Remove Supplier:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ==================================================
   SAVED CARDS
================================================== */
exports.getSavedCards = async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.user.id).select("saved_cards");
    return res.status(200).json({ success: true, data: buyer.saved_cards });
  } catch (err) {
    console.error("Get Saved Cards:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

exports.saveCard = async (req, res) => {
  try {
    const { card_number_last4, cardholder_name, expiry, card_type } = req.body;

    if (!card_number_last4 || !cardholder_name || !expiry)
      return res.status(400).json({ success: false, message: "Card number (last 4), cardholder name and expiry are required." });

    const buyer = await Buyer.findById(req.user.id);
    buyer.saved_cards.push({ card_number_last4, cardholder_name, expiry, card_type: card_type || "Visa" });
    await buyer.save();

    return res.status(201).json({ success: true, message: "Card saved.", data: buyer.saved_cards });
  } catch (err) {
    console.error("Save Card:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

exports.removeCard = async (req, res) => {
  try {
    const { cardId } = req.params;

    await Buyer.findByIdAndUpdate(req.user.id, { $pull: { saved_cards: { _id: cardId } } });

    return res.status(200).json({ success: true, message: "Card removed." });
  } catch (err) {
    console.error("Remove Card:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ==================================================
   NOTIFICATIONS
================================================== */
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user_id: req.user.id, user_role: "buyer" })
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: notifications });
  } catch (err) {
    console.error("Get Notifications:", err);
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

exports.markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user_id: req.user.id, user_role: "buyer" }, { is_read: true });
    return res.status(200).json({ success: true, message: "All notifications marked as read." });
  } catch (err) {
    console.error("Mark All Read:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};
