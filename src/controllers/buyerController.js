const Buyer = require("../models/buyerModel");
const OTP = require("../models/otp");
const hashedPassword = require("../utils/hashedPassword");
const sendEmail = require("../utils/sendEmail");
const generateOtp = require("../utils/generateOtp");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ===================== REGISTER BUYER =====================
exports.registerBuyer = async (req, res) => {
  try {
    const { full_name, emailOrPhone, password } = req.body;
    if (!full_name || !emailOrPhone || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields (full name, email or phone, password).",
      });
    }

    const existing = await Buyer.findOne({
      $or: [{ email: emailOrPhone }, { phone_number: emailOrPhone }],
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "This account already exists. Please login.",
      });
    }

    const isEmail = emailOrPhone.includes("@");
    const email = isEmail ? emailOrPhone : null;
    const phone_number = !isEmail ? emailOrPhone : null;

    await OTP.deleteMany({ $or: [{ email }, { phone_number }], role: "buyer-register" });

    const otpCode = generateOtp(5);

    await OTP.create({
      email,
      phone_number,
      full_name,
      password,
      otp: otpCode,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      role: "buyer-register",
      verified: false,
    });

    if (isEmail) {
      const otpEmail = `
        <div style="font-family:Arial, sans-serif; background:#f9fff9; padding:20px; border-radius:12px; border:1px solid #e0f2e9;">
          <h2 style="color:#2E8B57;">🌾 Hello ${full_name},</h2>
          <p>Welcome to Harvest Nexus! Your verification code is:</p>
          <h2 style="background:#2E8B57; color:#fff; padding:10px 20px; border-radius:8px;">${otpCode}</h2>
          <p>This code will expire in 5 minutes ⏰</p>
          <p>We’re excited to have you join our fresh produce community! 🌱</p>
        </div>
      `;
      await sendEmail(emailOrPhone, "🌾 Your Harvest Nexus Verification Code", otpEmail);
    }

    return res.status(201).json({
      success: true,
      message: "OTP sent to your email or phone. Please verify to complete registration.",
    });
  } catch (err) {
    console.error("Buyer Register Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ===================== VERIFY OTP =====================
exports.verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ success: false, message: "OTP is required" });

    const record = await OTP.findOne({ otp: otp.toString().trim(), role: "buyer-register" });

    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    const hash = await hashedPassword(record.password);

    const newBuyer = await Buyer.create({
      full_name: record.full_name,
      email: record.email || undefined,
      phone_number: record.phone_number || undefined,
      password: hash,
      isVerified: true,
    });

    await OTP.deleteOne({ _id: record._id });

    if (newBuyer.email) {
      const welcomeEmail = `
        <div style="font-family: Arial, sans-serif; background:#f9fff9; padding:20px; border-radius:12px; border:1px solid #e0f2e9;">
          <h2 style="color:#2E8B57;">🌾 Welcome, ${newBuyer.full_name}!</h2>
          <p>Your account is now active. 🎉</p>
          <p>Start exploring fresh produce directly from farmers near you! 🍅🥦🥕</p>
          <p>Thank you for joining the Harvest Nexus community! 🌱</p>
        </div>
      `;
      await sendEmail(newBuyer.email, "🌾 Welcome to Harvest Nexus!", welcomeEmail);
    }

    return res.status(201).json({
      success: true,
      message: "Buyer verified and registered successfully.",
      data: newBuyer,
    });
  } catch (err) {
    console.error("Verify Buyer OTP Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ===================== LOGIN =====================
exports.loginBuyer = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;
    if (!emailOrPhone || !password) {
      return res.status(400).json({ success: false, message: "Email/phone and password required." });
    }

    const buyer = await Buyer.findOne({ $or: [{ email: emailOrPhone }, { phone_number: emailOrPhone }] });
    if (!buyer) return res.status(404).json({ success: false, message: "No account found." });

    const isMatch = await bcrypt.compare(password, buyer.password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Incorrect password." });

    const token = jwt.sign({ id: buyer._id, role: "buyer" }, process.env.JWT_SECRET, { expiresIn: "7d" });

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      buyer: { id: buyer._id, full_name: buyer.full_name, email: buyer.email, phone_number: buyer.phone_number },
    });
  } catch (err) {
    console.error("Login Buyer Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ===================== FORGOT PASSWORD (send OTP) =====================
exports.forgotPassword = async (req, res) => {
  try {
    const { emailOrPhone } = req.body;
    if (!emailOrPhone) return res.status(400).json({ success: false, message: "Email or phone required." });

    const buyer = await Buyer.findOne({ $or: [{ email: emailOrPhone }, { phone_number: emailOrPhone }] });
    if (!buyer) return res.status(404).json({ success: false, message: "Account not found." });

    const otpCode = generateOtp(5);
    const isEmail = emailOrPhone.includes("@");
    const email = isEmail ? emailOrPhone : null;
    const phone_number = !isEmail ? emailOrPhone : null;

    await OTP.deleteMany({ $or: [{ email }, { phone_number }], role: "buyer-reset" });

    await OTP.create({
      email,
      phone_number,
      otp: otpCode,
      role: "buyer-reset",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      verified: false,
    });

    if (isEmail) {
      const resetEmail = `
        <div style="font-family: Arial, sans-serif; background:#f9fff9; padding:20px; border-radius:12px; border:1px solid #e0f2e9;">
          <h2 style="color:#2E8B57;">🌾 Password Reset Request</h2>
          <p>Use this code to reset your password:</p>
          <h2 style="background:#2E8B57; color:#fff; padding:10px 20px; border-radius:8px;">${otpCode}</h2>
          <p>This code will expire in 5 minutes ⏰</p>
          <p>Keep your account safe and secure! 🔐</p>
        </div>
      `;
      await sendEmail(emailOrPhone, "🌾 Harvest Nexus Password Reset Code", resetEmail);
    }

    return res.status(200).json({ success: true, message: "5-digit code sent.", hint: `Sent to ${emailOrPhone}` });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// ===================== VERIFY RESET OTP  =====================
exports.verifyResetOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ success: false, message: "OTP required." });

    // find OTP by code + role and not expired
    const record = await OTP.findOne({
      otp: otp.toString().trim(),
      role: "buyer-reset",
      expiresAt: { $gt: new Date() }
    });

    if (!record) return res.status(400).json({ success: false, message: "Invalid or expired OTP." });

    record.verified = true;
    record.updatedAt = new Date();
    await record.save();

    // return the identifier so frontend can optionally show it
    return res.status(200).json({
      success: true,
      message: "OTP verified successfully 🌾 You can now set a new password.",
      emailOrPhone: record.email || record.phone_number
    });
  } catch (err) {
    console.error("Verify Reset OTP Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ===================== RESET PASSWORD  =====================
exports.resetPassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;

    // validate
    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match." });
    }

    // find most recent verified OTP that has an identifier (email or phone) and is not expired
    const verifiedOtp = await OTP.findOne({
      role: "buyer-reset",
      verified: true,
      expiresAt: { $gt: new Date() },
      $or: [
        { email: { $exists: true, $ne: null } },
        { phone_number: { $exists: true, $ne: null } }
      ]
    }).sort({ updatedAt: -1, createdAt: -1 });

    if (!verifiedOtp) {
      return res.status(400).json({ success: false, message: "OTP verification required before resetting password." });
    }

    // debug logging (remove in production)
    console.log("Using verified OTP:", {
      id: verifiedOtp._id,
      email: verifiedOtp.email,
      phone_number: verifiedOtp.phone_number,
      createdAt: verifiedOtp.createdAt,
      updatedAt: verifiedOtp.updatedAt
    });

    // find buyer by email or phone as stored in OTP
    const buyerQuery = [];
    if (verifiedOtp.email) buyerQuery.push({ email: verifiedOtp.email.toLowerCase() });
    if (verifiedOtp.phone_number) buyerQuery.push({ phone_number: verifiedOtp.phone_number });

    // If no query (shouldn't happen because we filtered above) => fail
    if (buyerQuery.length === 0) {
      return res.status(400).json({ success: false, message: "Verified OTP missing identifier." });
    }

    const buyer = await Buyer.findOne({ $or: buyerQuery });
    if (!buyer) {
      // helpful debug: show what we searched for
      console.error("Buyer lookup failed for:", buyerQuery);
      return res.status(404).json({ success: false, message: "Buyer not found." });
    }

    // Hash and save new password
    buyer.password = await hashedPassword(newPassword);
    await buyer.save();

    // remove all buyer-reset OTPs for that identifier
    await OTP.deleteMany({
      $or: [
        { email: verifiedOtp.email },
        { phone_number: verifiedOtp.phone_number }
      ],
      role: "buyer-reset"
    });

    return res.status(200).json({ success: true, message: "Password reset successful 🌾 You can now login with your new password!" });
  } catch (err) {
    console.error("Reset Password Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
