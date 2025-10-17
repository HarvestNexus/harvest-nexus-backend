require("dotenv").config();
const Farmer = require("../models/farmerModel");
const OTP = require("../models/otp");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");
const hashedPassword = require("../utils/hashedPassword");
const generateOtp = require("../utils/generateOtp");

const localGenerateOtp = () => Math.floor(10000 + Math.random() * 90000).toString();
const getOtp = generateOtp || localGenerateOtp;

/* =========================
  REGISTER FARMER
========================= */
exports.registerFarmer = async (req, res) => {
  try {
    const { full_name, phone_number, location, farm_name, email, password } = req.body;

    if (!full_name || !phone_number || !location || !farm_name || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    const existing = await Farmer.findOne({ $or: [{ email }, { phone_number }] });
    if (existing) {
      return res.status(400).json({ success: false, message: "A farmer with this email or phone number already exists." });
    }

    await OTP.deleteMany({ $or: [{ email }, { phone_number }] });

    const otpCode = getOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await OTP.create({
      full_name,
      phone_number,
      location,
      farm_name,
      email,
      password,
      otp: otpCode,
      expiresAt,
      role: "farmer-register",
    });

   const emailHtml = `
  <div style="font-family:'Segoe UI',sans-serif;padding:24px;background-color:#f9fff9;border-radius:10px;border:1px solid #dcedc8;">
    <div style="text-align:center;margin-bottom:20px;">
      <h2 style="color:#2e7d32;">🌾 Harvest Nexus</h2>
    </div>
    <p style="font-size:16px;color:#333;">Hello <strong>${full_name}</strong>,</p>
    <p style="font-size:15px;color:#444;line-height:1.6;">
      Use the OTP below to verify your account:
    </p>
    <div style="text-align:center;margin:20px 0;">
      <h2 style="color:#1b5e20;font-size:28px;letter-spacing:3px;">${otpCode}</h2>
    </div>
    <p style="font-size:14px;color:#555;">
      ⏰ This OTP will expire in <strong>5 minutes</strong>.
    </p>
    <p style="font-size:13px;color:#777;margin-top:30px;text-align:center;">
      🌿 Thank you for joining Harvest Nexus — let’s grow together!
    </p>
  </div>
`;


    await sendEmail(email, "Verify Your Harvest Nexus Account", emailHtml);

    res.status(201).json({
      success: true,
      message: "OTP sent to your email. Verify to complete registration.",
    });
  } catch (err) {
    console.error("Farmer Register Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =========================
    VERIFY REGISTRATION OTP
========================= */
exports.verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ success: false, message: "OTP is required." });

    const record = await OTP.findOne({ otp, role: "farmer-register" });
    if (!record) return res.status(400).json({ success: false, message: "Invalid or expired OTP." });

    if (record.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: record._id });
      return res.status(400).json({ success: false, message: "OTP has expired." });
    }

    const exists = await Farmer.findOne({
      $or: [{ email: record.email }, { phone_number: record.phone_number }],
    });
    if (exists) {
      await OTP.deleteOne({ _id: record._id });
      return res.status(400).json({ success: false, message: "Farmer already registered." });
    }

    const hashed = await hashedPassword(record.password);
    const farmer = await Farmer.create({
      full_name: record.full_name,
      phone_number: record.phone_number,
      location: record.location,
      farm_name: record.farm_name,
      email: record.email,
      password: hashed,
      isVerified: true,
    });

    await OTP.deleteOne({ _id: record._id });

   const emailHtml = `
  <div style="font-family:'Segoe UI',sans-serif;padding:24px;background-color:#f9fff9;border-radius:10px;border:1px solid #dcedc8;">
    <div style="text-align:center;margin-bottom:20px;">
      <h2 style="color:#2e7d32;">🌾 Harvest Nexus</h2>
    </div>
    <p style="font-size:16px;color:#333;">Hi <strong>${farmer.full_name}</strong>,</p>
    <p style="font-size:15px;color:#444;line-height:1.6;">
      Your account has been successfully verified. Welcome to <strong>Harvest Nexus</strong>! 🌾
    </p>
    <p style="font-size:13px;color:#777;margin-top:30px;text-align:center;">
      🌿 We're excited to have you with us — The Harvest Nexus Team
    </p>
  </div>
`;

    await sendEmail(farmer.email, "Welcome to Harvest Nexus", emailHtml);

    res.status(201).json({
      success: true,
      message: "Farmer verified and registered successfully.",
      data: {
        id: farmer._id,
        full_name: farmer.full_name,
        email: farmer.email,
        phone_number: farmer.phone_number,
      },
    });
  } catch (err) {
    console.error("Verify Farmer OTP Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =========================
    LOGIN FARMER
========================= */
exports.loginFarmer = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
      return res.status(400).json({ success: false, message: "Email/Phone and Password are required." });
    }

    const farmer = await Farmer.findOne({
      $or: [{ email: emailOrPhone }, { phone_number: emailOrPhone }],
    });
    if (!farmer) return res.status(400).json({ success: false, message: "Invalid credentials." });

    const isMatch = await bcrypt.compare(password, farmer.password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Invalid credentials." });

    const token = jwt.sign({ id: farmer._id, role: "farmer" }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      data: {
        id: farmer._id,
        full_name: farmer.full_name,
        email: farmer.email,
        phone_number: farmer.phone_number,
      },
    });
  } catch (err) {
    console.error("Farmer Login Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =========================
   FORGOT PASSWORD
========================= */
exports.farmerForgotPassword = async (req, res) => {
  try {
    const { emailOrPhone } = req.body;
    if (!emailOrPhone) return res.status(400).json({ success: false, message: "Provide your registered email or phone number." });

    const farmer = await Farmer.findOne({
      $or: [{ email: emailOrPhone }, { phone_number: emailOrPhone }],
    });
    if (!farmer) return res.status(404).json({ success: false, message: "Account not found." });

    const otpCode = getOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await OTP.deleteMany({ phone_number: emailOrPhone, role: "farmer-reset" });

    await OTP.create({
      phone_number: emailOrPhone,
      otp: otpCode,
      role: "farmer-reset",
      expiresAt,
    });

    const emailHtml = `
  <div style="font-family:'Segoe UI',sans-serif;padding:24px;background-color:#f9fff9;border-radius:10px;border:1px solid #dcedc8;">
    <div style="text-align:center;margin-bottom:20px;">
      <h2 style="color:#2e7d32;">🌾 Harvest Nexus</h2>
    </div>
    <p style="font-size:16px;color:#333;">Hello <strong>${farmer.full_name}</strong>,</p>
    <p style="font-size:15px;color:#444;line-height:1.6;">
      Use the OTP below to reset your password:
    </p>
    <h2 style="color:#2e7d32;font-size:28px;text-align:center;letter-spacing:3px;margin:20px 0;">${otpCode}</h2>
    <p style="font-size:14px;color:#555;text-align:center;">
      This OTP will expire in <strong>5 minutes</strong>.
    </p>
    <p style="font-size:13px;color:#777;margin-top:30px;text-align:center;">
      🌾 Stay secure — Harvest Nexus Team
    </p>
  </div>
`;

    await sendEmail(farmer.email, "Harvest Nexus Password Reset", emailHtml);

    res.status(200).json({ success: true, message: "OTP sent to your registered email." });
  } catch (err) {
    console.error("Farmer Forgot Password Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =========================
   ✅ VERIFY RESET OTP
========================= */
exports.verifyResetOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ success: false, message: "OTP is required." });

    const record = await OTP.findOne({ otp, role: "farmer-reset" });
    if (!record) return res.status(400).json({ success: false, message: "Invalid or expired OTP." });

    if (record.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: record._id });
      return res.status(400).json({ success: false, message: "OTP has expired." });
    }

    res.status(200).json({ success: true, message: "OTP verified successfully. Proceed to reset your password." });
  } catch (err) {
    console.error("Farmer Verify Reset OTP Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =========================
    RESET PASSWORD
========================= */
exports.farmerResetPassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword)
      return res.status(400).json({ success: false, message: "All fields are required." });

    if (newPassword !== confirmPassword)
      return res.status(400).json({ success: false, message: "Passwords do not match." });

    // Find latest OTP entry (previously verified)
    const record = await OTP.findOne({ role: "farmer-reset" }).sort({ createdAt: -1 });
    if (!record) return res.status(400).json({ success: false, message: "OTP verification required first." });

    const farmer = await Farmer.findOne({
      $or: [{ email: record.phone_number }, { phone_number: record.phone_number }],
    });
    if (!farmer) return res.status(404).json({ success: false, message: "Farmer not found." });

    const salt = await bcrypt.genSalt(10);
    farmer.password = await bcrypt.hash(newPassword, salt);
    await farmer.save();
    await OTP.deleteOne({ _id: record._id });

    const emailHtml = `
  <div style="font-family:'Segoe UI',sans-serif;padding:24px;background-color:#f9fff9;border-radius:10px;border:1px solid #dcedc8;">
    <div style="text-align:center;margin-bottom:20px;">
      <h2 style="color:#2e7d32;">🌾 Harvest Nexus</h2>
    </div>
    <p style="font-size:16px;color:#333;">Hello <strong>${farmer.full_name}</strong>,</p>
    <p style="font-size:15px;color:#444;line-height:1.6;">
      Your password has been successfully reset. You can now log in securely using your new password.
    </p>
    <p style="font-size:14px;color:#555;margin-top:20px;">If you didn’t make this change, please contact our support immediately.</p>
    <div style="margin-top:30px;text-align:center;">
      <a href="https://harvest-nexus.com/login" style="background-color:#2e7d32;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;">Login Now</a>
    </div>
    <p style="font-size:13px;color:#777;margin-top:30px;text-align:center;">
      🌾 Thank you for growing with Harvest Nexus.
    </p>
  </div>
`;

    await sendEmail(farmer.email, "Password Reset Successful", emailHtml);

    res.status(200).json({ success: true, message: "Password reset successful." });
  } catch (err) {
    console.error("Farmer Reset Password Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
