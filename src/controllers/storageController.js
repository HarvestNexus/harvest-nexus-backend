require("dotenv").config();
const Storage = require("../models/storageModel");
const OTP = require("../models/otp");
const hashedPassword = require("../utils/hashedPassword");
const sendEmail = require("../utils/sendEmail");
const generateOtp = require("../utils/generateOtp");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ===================== REGISTER STORAGE =====================
exports.registerStorage = async (req, res) => {
  try {
    const { storage_name, storage_email_or_phone, storage_location, storage_type, password } = req.body;

    if (!storage_name || !storage_email_or_phone || !storage_location || !password) {
      return res.status(400).json({ success: false, message: "Please fill all required fields" });
    }

    const existing = await Storage.findOne({ storage_email_or_phone });
    if (existing) return res.status(400).json({ success: false, message: "This email or phone is already registered" });

    const isEmail = storage_email_or_phone.includes("@");
    const email = isEmail ? storage_email_or_phone.toLowerCase() : null;
    const phone_number = !isEmail ? storage_email_or_phone : null;

    await OTP.deleteMany({ $or: [{ email }, { phone_number }], role: "storage-register" });

    const otpCode = generateOtp(5);

    await OTP.create({
      email,
      phone_number,
      fullName: storage_name,
      location: storage_location,
      storageType: storage_type,
      password,
      otp: otpCode,
      role: "storage-register",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    if (email) {
      const otpEmail = `
        <div style="font-family:Arial, sans-serif; background:#f9fff9; padding:20px; border-radius:12px; border:1px solid #e0f2e9;">
          <h2 style="color:#2E8B57;">🌱 Hello ${storage_name},</h2>
          <p>Your verification code is:</p>
          <h2 style="background:#2E8B57; color:#fff; padding:10px 20px; border-radius:8px;">${otpCode}</h2>
          <p>Enter this code in the app to verify your account.</p>
          <p style="color:#888;">⏰ Expires in <strong>5 minutes</strong>.</p>
        </div>
      `;
      await sendEmail(email, "🌱 Harvest Nexus Storage Partner OTP", otpEmail);
    }

    return res.status(201).json({ success: true, message: " OTP sent to your email/phone. Please verify to complete registration." });
  } catch (err) {
    console.error("Register Storage Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ===================== VERIFY STORAGE OTP =====================
exports.verifyStorageOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ success: false, message: "OTP is required" });

    const record = await OTP.findOne({ otp: otp.toString().trim(), role: "storage-register" });
    if (!record) return res.status(400).json({ success: false, message: "Invalid OTP" });
    if (record.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: record._id });
      return res.status(400).json({ success: false, message: "OTP has expired" });
    }

    const hash = await hashedPassword(record.password);

    const newStorage = await Storage.create({
      storage_name: record.fullName,
      storage_email_or_phone: (record.email || record.phone_number)?.toLowerCase(),
      storage_location: record.location,
      storage_type: record.storageType || "Others",
      password: hash,
      isVerified: true,
    });

    await OTP.deleteOne({ _id: record._id });

    if (record.email) {
      const welcomeEmail = `
        <div style="font-family:Arial, sans-serif; background:#f9fff9; padding:20px; border-radius:12px; border:1px solid #e0f2e9;">
          <h2 style="color:#2E8B57;">🎉 Welcome, ${newStorage.storage_name}!</h2>
          <p>Your Storage Partner account is now active.</p>
        </div>
      `;
      await sendEmail(record.email, "🎉 Welcome to Harvest Nexus!", welcomeEmail);
    }

    return res.status(201).json({ success: true, message: "🎉 Storage Partner verified and registered successfully.", data: newStorage });
  } catch (err) {
    console.error("Verify OTP Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ===================== LOGIN STORAGE =====================
exports.loginStorage = async (req, res) => {
  try {
    const { storage_email_or_phone, password } = req.body;
    if (!storage_email_or_phone || !password)
      return res.status(400).json({ success: false, message: "Provide email/phone and password." });

    const storage = await Storage.findOne({ storage_email_or_phone });
    if (!storage) return res.status(404).json({ success: false, message: "Account not found." });

    const isMatch = await bcrypt.compare(password, storage.password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Incorrect password." });

    const token = jwt.sign({ id: storage._id, role: "storage" }, process.env.JWT_SECRET, { expiresIn: "7d" });

    return res.status(200).json({ success: true, message: "Login successful.", token, data: storage });
  } catch (err) {
    console.error("Login Storage Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ===================== FORGOT PASSWORD =====================
exports.forgotStoragePassword = async (req, res) => {
  try {
    const { storage_email_or_phone } = req.body;
    if (!storage_email_or_phone)
      return res.status(400).json({ success: false, message: "Email or phone is required." });

    const storage = await Storage.findOne({ storage_email_or_phone });
    if (!storage) return res.status(404).json({ success: false, message: "Account not found." });

    const otpCode = generateOtp(5);
    const isEmail = storage_email_or_phone.includes("@");
    const email = isEmail ? storage_email_or_phone.toLowerCase() : null;
    const phone_number = !isEmail ? storage_email_or_phone : null;

    await OTP.deleteMany({ $or: [{ email }, { phone_number }], role: "storage-reset" });

    await OTP.create({
      email,
      phone_number,
      otp: otpCode,
      role: "storage-reset",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    if (email) {
      const resetEmail = `
        <div style="font-family:Arial, sans-serif; background:#f9fff9; padding:20px; border-radius:12px; border:1px solid #e0f2e9;">
          <h2 style="color:#2E8B57;">Password Reset Request</h2>
          <p>Your reset code is:</p>
          <h2 style="background:#2E8B57; color:#fff; padding:10px 20px; border-radius:8px;">${otpCode}</h2>
          <p>Expires in 5 minutes.</p>
        </div>
      `;
      await sendEmail(email, "Harvest Nexus Storage Password Reset", resetEmail);
    }

    return res.status(200).json({ success: true, message: "OTP sent for password reset." });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ===================== VERIFY RESET OTP =====================
exports.verifyStorageResetOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ success: false, message: "OTP is required." });

    const record = await OTP.findOne({ otp, role: "storage-reset" });
    if (!record || record.expiresAt < new Date())
      return res.status(400).json({ success: false, message: "Invalid or expired OTP." });

    // OTP verified, return its ID to allow resetting password
    return res.status(200).json({
      success: true,
      message: "OTP verified. You can now set a new password.",
      otpId: record._id
    });
  } catch (err) {
    console.error("Verify Reset OTP Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ===================== RESET PASSWORD (New Design) =====================
exports.resetStoragePassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword)
      return res.status(400).json({ success: false, message: "Provide new and confirm password." });

    if (newPassword !== confirmPassword)
      return res.status(400).json({ success: false, message: "Passwords do not match." });

    // Find the latest valid OTP for storage-reset
    const otpRecord = await OTP.findOne({ role: "storage-reset", expiresAt: { $gt: new Date() } })
      .sort({ createdAt: -1 });

    if (!otpRecord) return res.status(400).json({ success: false, message: "No valid OTP found. Please request a new one." });

    // Determine user (email or phone) from OTP
    const storage_email_or_phone = otpRecord.email || otpRecord.phone_number;

    const storage = await Storage.findOne({ storage_email_or_phone });
    if (!storage) return res.status(404).json({ success: false, message: "Account not found." });

    // Hash and save new password
    storage.password = await hashedPassword(newPassword);
    await storage.save();

    // Delete used OTP
    await OTP.deleteOne({ _id: otpRecord._id });

    return res.status(200).json({ success: true, message: "Password reset successful." });
  } catch (err) {
    console.error("Reset Password Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
