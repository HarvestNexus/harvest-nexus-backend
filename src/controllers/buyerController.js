require("dotenv").config();

const Buyer = require("../models/buyerModel");
const OTP = require("../models/otp");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const hashedPassword = require("../utils/hashedPassword");
const sendEmail = require("../utils/sendEmail");
const generateOtp = require("../utils/generateOtp");

/* ==================================================
   REGISTER BUYER
================================================== */
exports.registerBuyer = async (req, res) => {
  try {
    const { full_name, emailOrPhone, password } = req.body;

    if (!full_name || !emailOrPhone || !password) {
      return res.status(400).json({
        success: false,
        message: "Full name, email/phone and password are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailOrPhone);
    const email = isEmail ? emailOrPhone.toLowerCase() : null;
    const phone_number = !isEmail ? emailOrPhone : null;

    const existingBuyer = await Buyer.findOne({
      $or: [{ email }, { phone_number }],
    });

    if (existingBuyer) {
      return res.status(400).json({
        success: false,
        message: "Buyer account already exists.",
      });
    }

    await OTP.deleteMany({
      $or: [{ email }, { phone_number }],
      role: "buyer-register",
    });

    const otpCode = generateOtp(5);

    await OTP.create({
      full_name,
      email,
      phone_number,
      password,
      otp: otpCode,
      role: "buyer-register",
      verified: false,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    if (email) {
      const emailHtml = `
      <div style="font-family:Arial;padding:20px;background:#f9fff9;border-radius:10px">
        <h2 style="color:#2e7d32;">🌾 Harvest Nexus</h2>
        <p>Hello <strong>${full_name}</strong>,</p>
        <p>Your verification code is:</p>
        <h1 style="letter-spacing:4px;color:#2e7d32">${otpCode}</h1>
        <p>This code expires in 5 minutes.</p>
      </div>
      `;

      await sendEmail(email, "Harvest Nexus Buyer OTP", emailHtml);
    }

    return res.status(201).json({
      success: true,
      message: "OTP sent successfully.",
    });
  } catch (error) {
    console.error("Register Buyer Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

/* ==================================================
   VERIFY OTP
================================================== */
exports.verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required.",
      });
    }

    const record = await OTP.findOne({
      otp: otp.toString().trim(),
      role: "buyer-register",
    });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    if (record.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: record._id });

      return res.status(400).json({
        success: false,
        message: "OTP expired.",
      });
    }

    const hashed = await hashedPassword(record.password);

    const newBuyer = await Buyer.create({
      full_name: record.full_name,
      email: record.email || undefined,
      phone_number: record.phone_number || undefined,
      password: hashed,
      authProvider: "local",
      isVerified: true,
    });

    await OTP.deleteOne({ _id: record._id });

    if (newBuyer.email) {
      const welcomeHtml = `
      <div style="font-family:Arial;padding:20px;background:#f9fff9;border-radius:10px">
        <h2 style="color:#2e7d32;">🎉 Welcome To Harvest Nexus</h2>
        <p>Hello <strong>${newBuyer.full_name}</strong>,</p>
        <p>Your buyer account is now active.</p>
        <p>Buy fresh produce directly from farmers.</p>
      </div>
      `;

      await sendEmail(newBuyer.email, "Welcome To Harvest Nexus", welcomeHtml);
    }

    return res.status(201).json({
      success: true,
      message: "Buyer verified successfully.",
      data: newBuyer,
    });
  } catch (error) {
    console.error("Verify Buyer OTP Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

/* ==================================================
   LOGIN BUYER
================================================== */
exports.loginBuyer = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
      return res.status(400).json({
        success: false,
        message: "Email/phone and password required.",
      });
    }

    const buyer = await Buyer.findOne({
      $or: [
        { email: emailOrPhone.toLowerCase() },
        { phone_number: emailOrPhone },
      ],
    });

    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: "Account not found.",
      });
    }

    const isMatch = await bcrypt.compare(password, buyer.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    const token = jwt.sign(
      { id: buyer._id, role: "buyer" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      data: buyer,
    });
  } catch (error) {
    console.error("Login Buyer Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

/* ==================================================
   FORGOT PASSWORD
================================================== */
exports.forgotPassword = async (req, res) => {
  try {
    const { emailOrPhone } = req.body;

    if (!emailOrPhone) {
      return res.status(400).json({
        success: false,
        message: "Email or phone required.",
      });
    }

    const buyer = await Buyer.findOne({
      $or: [
        { email: emailOrPhone.toLowerCase() },
        { phone_number: emailOrPhone },
      ],
    });

    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: "Account not found.",
      });
    }

    const isEmail = emailOrPhone.includes("@");
    const email = isEmail ? emailOrPhone.toLowerCase() : null;
    const phone_number = !isEmail ? emailOrPhone : null;

    await OTP.deleteMany({
      $or: [{ email }, { phone_number }],
      role: "buyer-reset",
    });

    const otpCode = generateOtp(5);

    await OTP.create({
      email,
      phone_number,
      otp: otpCode,
      role: "buyer-reset",
      verified: false,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    if (email) {
      const emailHtml = `
      <div style="font-family:Arial;padding:20px;background:#f9fff9;border-radius:10px">
        <h2 style="color:#2e7d32;">Reset Password</h2>
        <p>Your reset OTP:</p>
        <h1 style="letter-spacing:4px">${otpCode}</h1>
      </div>
      `;

      await sendEmail(email, "Buyer Password Reset OTP", emailHtml);
    }

    return res.status(200).json({
      success: true,
      message: "Reset OTP sent.",
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

/* ==================================================
   VERIFY RESET OTP
================================================== */
exports.verifyResetOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    const record = await OTP.findOne({
      otp,
      role: "buyer-reset",
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP.",
      });
    }

    record.verified = true;
    await record.save();

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully.",
    });
  } catch (error) {
    console.error("Verify Reset OTP Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

/* ==================================================
   RESET PASSWORD
================================================== */
exports.resetPassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields required.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match.",
      });
    }

    const verifiedOtp = await OTP.findOne({
      role: "buyer-reset",
      verified: true,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!verifiedOtp) {
      return res.status(400).json({
        success: false,
        message: "OTP verification required.",
      });
    }

    const buyer = await Buyer.findOne({
      $or: [
        { email: verifiedOtp.email },
        { phone_number: verifiedOtp.phone_number },
      ],
    });

    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: "Buyer not found.",
      });
    }

    buyer.password = await hashedPassword(newPassword);
    await buyer.save();

    await OTP.deleteMany({
      $or: [
        { email: verifiedOtp.email },
        { phone_number: verifiedOtp.phone_number },
      ],
      role: "buyer-reset",
    });

    return res.status(200).json({
      success: true,
      message: "Password reset successful.",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

/* ==================================================
   GOOGLE SIGNUP
================================================== */
exports.googleSignup = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Google signup route ready.",
    });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

/* ==================================================
   APPLE SIGNUP
================================================== */
exports.appleSignup = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Apple signup route ready.",
    });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};