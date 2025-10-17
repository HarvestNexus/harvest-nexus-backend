require("dotenv").config();
const Logistics = require("../models/logisticsModel");
const OTP = require("../models/otp");
const hashedPassword = require("../utils/hashedPassword");
const sendEmail = require("../utils/sendEmail");
const generateOtp = require("../utils/generateOtp");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ===================== REGISTER LOGISTICS =====================
exports.registerLogistics = async (req, res) => {
  try {
    const { company_name, emailOrPhone, password, location, transport_type } = req.body;

    if (!company_name || !emailOrPhone || !password || !location) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    const existing = await Logistics.findOne({
      $or: [{ email: emailOrPhone }, { phone_number: emailOrPhone }],
    });
    if (existing) return res.status(400).json({ success: false, message: "Account already exists." });

    const isEmail = emailOrPhone.includes("@");
    const email = isEmail ? emailOrPhone : null;
    const phone_number = !isEmail ? emailOrPhone : null;

    await OTP.deleteMany({ $or: [{ email }, { phone_number }], role: "logistics-register" });

    const otpCode = generateOtp(5); // 5-digit OTP

    await OTP.create({
      email,
      phone_number,
      company_name,
      location,
      transport_type,
      password,
      otp: otpCode,
      role: "logistics-register",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    if (email) {
      const otpEmail = `
        <div style="font-family:Arial, sans-serif; background:#f9fff9; padding:20px; border-radius:12px; border:1px solid #e0f2e9;">
          <h2 style="color:#2E8B57;">Hello ${company_name},</h2>
          <p>Your verification code is:</p>
          <h2 style="background:#2E8B57; color:#fff; padding:10px 20px; display:inline-block; border-radius:8px;">${otpCode}</h2>
          <p>This code expires in 5 minutes.</p>
        </div>
      `;
      await sendEmail(email, "Harvest Nexus Logistics Verification Code", otpEmail);
    }

    return res.status(201).json({ success: true, message: "OTP sent. Please verify to complete registration." });
  } catch (err) {
    console.error("Register Logistics Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ===================== VERIFY OTP =====================
exports.verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ success: false, message: "OTP is required." });

    const record = await OTP.findOne({ otp, role: "logistics-register" });
    if (!record || record.expiresAt < new Date()) return res.status(400).json({ success: false, message: "Invalid or expired OTP." });

    const hash = await hashedPassword(record.password);

    const logistics = await Logistics.create({
      company_name: record.company_name,
      email: record.email,
      phone_number: record.phone_number,
      location: record.location,
      transport_type: record.transport_type,
      password: hash,
    });

    await OTP.deleteOne({ _id: record._id });

    return res.status(201).json({ success: true, message: "Logistics partner verified and registered successfully.", data: logistics });
  } catch (err) {
    console.error("Verify Logistics OTP Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ===================== LOGIN =====================
exports.loginLogistics = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;
    if (!emailOrPhone || !password) return res.status(400).json({ success: false, message: "Provide email/phone and password." });

    const logistics = await Logistics.findOne({ $or: [{ email: emailOrPhone }, { phone_number: emailOrPhone }] });
    if (!logistics) return res.status(404).json({ success: false, message: "Account not found." });

    const isMatch = await bcrypt.compare(password, logistics.password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Incorrect password." });

    const token = jwt.sign({ id: logistics._id, role: "logistics" }, process.env.JWT_SECRET, { expiresIn: "7d" });

    return res.status(200).json({ success: true, message: "Login successful.", token, data: logistics });
  } catch (err) {
    console.error("Login Logistics Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ===================== FORGOT PASSWORD =====================
exports.forgotPassword = async (req, res) => {
  try {
    const { emailOrPhone } = req.body;
    if (!emailOrPhone) return res.status(400).json({ success: false, message: "Email or phone is required." });

    const logistics = await Logistics.findOne({ $or: [{ email: emailOrPhone }, { phone_number: emailOrPhone }] });
    if (!logistics) return res.status(404).json({ success: false, message: "Account not found." });

    const otpCode = generateOtp(5);
    const isEmail = emailOrPhone.includes("@");
    const email = isEmail ? emailOrPhone : null;
    const phone_number = !isEmail ? emailOrPhone : null;

    await OTP.deleteMany({ $or: [{ email }, { phone_number }], role: "logistics-reset" });

    await OTP.create({
      email,
      phone_number,
      otp: otpCode,
      role: "logistics-reset",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    if (email) {
      const resetEmail = `
        <div style="font-family:Arial, sans-serif; background:#f9fff9; padding:20px; border-radius:12px; border:1px solid #e0f2e9;">
          <h2 style="color:#2E8B57;">Password Reset Request</h2>
          <p>Your reset code is:</p>
          <h2 style="background:#2E8B57; color:#fff; padding:10px 20px; border-radius:8px;">${otpCode}</h2>
          <p>This code expires in 5 minutes.</p>
        </div>
      `;
      await sendEmail(email, "Harvest Nexus Password Reset Code", resetEmail);
    }

    return res.status(200).json({ success: true, message: "OTP sent for password reset." });
  } catch (err) {
    console.error("Forgot Password Logistics Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ===================== VERIFY RESET OTP =====================
exports.verifyResetOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ success: false, message: "OTP is required." });

    const record = await OTP.findOne({ otp, role: "logistics-reset" });
    if (!record || record.expiresAt < new Date()) return res.status(400).json({ success: false, message: "Invalid or expired OTP." });

    return res.status(200).json({ success: true, message: "OTP verified. You can now reset your password.", emailOrPhone: record.email || record.phone_number });
  } catch (err) {
    console.error("Verify Reset OTP Logistics Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ===================== RESET PASSWORD =====================
exports.resetPassword = async (req, res) => {
  try {
    const { emailOrPhone, newPassword, confirmPassword } = req.body;
    if (!newPassword || !confirmPassword) return res.status(400).json({ success: false, message: "Provide new and confirm password." });
    if (newPassword !== confirmPassword) return res.status(400).json({ success: false, message: "Passwords do not match." });

    const logistics = await Logistics.findOne({ $or: [{ email: emailOrPhone }, { phone_number: emailOrPhone }] });
    if (!logistics) return res.status(404).json({ success: false, message: "Account not found." });

    logistics.password = await hashedPassword(newPassword);
    await logistics.save();

    await OTP.deleteMany({ $or: [{ email: emailOrPhone }, { phone_number: emailOrPhone }], role: "logistics-reset" });

    return res.status(200).json({ success: true, message: "Password reset successful." });
  } catch (err) {
    console.error("Reset Password Logistics Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
