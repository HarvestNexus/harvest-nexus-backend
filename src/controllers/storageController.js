require("dotenv").config();

const Storage = require("../models/storageModel");
const OTP = require("../models/otp");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const hashedPassword = require("../utils/hashedPassword");
const sendEmail = require("../utils/sendEmail");
const generateOtp = require("../utils/generateOtp");

/* ==================================================
   VALID STORAGE TYPES (Updated from Figma)
================================================== */
const validStorageTypes = [
  "Cold Storage",
  "Fruits",
  "Vegetables",
  "Legumes",
  "Cash Crops",
  "Roots & Tubers",
  "Grains & Cereals",
  "Others",
];

/* ==================================================
   REGISTER STORAGE
================================================== */
exports.registerStorage = async (req, res) => {
  try {
    const {
      storage_name,
      storage_email_or_phone,
      storage_location,
      storage_type,
      password,
    } = req.body;

    /* ---------- VALIDATION ---------- */
    if (
      !storage_name ||
      !storage_email_or_phone ||
      !storage_location ||
      !storage_type ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    if (!validStorageTypes.includes(storage_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid storage type selected.",
      });
    }

    const loginValue = storage_email_or_phone.toLowerCase().trim();

    /* ---------- CHECK EXISTING USER ---------- */
    const existing = await Storage.findOne({
      storage_email_or_phone: loginValue,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "This email or phone number already exists.",
      });
    }

    /* ---------- DETERMINE EMAIL OR PHONE ---------- */
    const isEmail = loginValue.includes("@");

    const email = isEmail ? loginValue : null;
    const phone_number = !isEmail ? loginValue : null;

    /* ---------- CLEAR OLD OTP ---------- */
    await OTP.deleteMany({
      $or: [{ email }, { phone_number }],
      role: "storage-register",
    });

    /* ---------- GENERATE OTP ---------- */
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

    /* ---------- SEND EMAIL OTP ---------- */
    if (email) {
      const otpEmail = `
      <div style="font-family:'Segoe UI',sans-serif;padding:24px;background:#f9fff9;border:1px solid #dcedc8;border-radius:10px;">
        <div style="text-align:center;">
          <h2 style="color:#2e7d32;">🌾 Harvest Nexus</h2>
        </div>

        <p>Hello <strong>${storage_name}</strong>,</p>

        <p>Use the OTP below to verify your Storage Partner account:</p>

        <div style="text-align:center;margin:20px 0;">
          <h2 style="font-size:28px;letter-spacing:4px;color:#1b5e20;">
            ${otpCode}
          </h2>
        </div>

        <p>This OTP expires in <strong>5 minutes</strong>.</p>

        <p>Welcome to Harvest Nexus.</p>
      </div>
      `;

      await sendEmail(
        email,
        "Verify Your Storage Account - Harvest Nexus",
        otpEmail
      );
    }

    return res.status(201).json({
      success: true,
      message: "OTP sent successfully. Verify to complete registration.",
    });
  } catch (error) {
    console.error("Register Storage Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* ==================================================
   VERIFY STORAGE OTP
================================================== */
exports.verifyStorageOtp = async (req, res) => {
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
      role: "storage-register",
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
        message: "OTP has expired.",
      });
    }

    const existing = await Storage.findOne({
      storage_email_or_phone: record.email || record.phone_number,
    });

    if (existing) {
      await OTP.deleteOne({ _id: record._id });

      return res.status(400).json({
        success: false,
        message: "Account already exists.",
      });
    }

    const hash = await hashedPassword(record.password);

    const newStorage = await Storage.create({
      storage_name: record.fullName,
      storage_email_or_phone:
        (record.email || record.phone_number).toLowerCase(),
      storage_location: record.location,
      storage_type: record.storageType,
      password: hash,
      isVerified: true,
    });

    await OTP.deleteOne({ _id: record._id });

    /* ---------- WELCOME EMAIL ---------- */
    if (record.email) {
      const welcomeEmail = `
      <div style="font-family:'Segoe UI',sans-serif;padding:24px;background:#f9fff9;border:1px solid #dcedc8;border-radius:10px;">
        <div style="text-align:center;">
          <h2 style="color:#2e7d32;">🎉 Welcome to Harvest Nexus</h2>
        </div>

        <p>Hello <strong>${newStorage.storage_name}</strong>,</p>

        <p>Your Storage Partner account has been verified successfully.</p>

        <p>You can now receive bookings and manage storage requests.</p>
      </div>
      `;

      await sendEmail(
        record.email,
        "Welcome to Harvest Nexus",
        welcomeEmail
      );
    }

    return res.status(201).json({
      success: true,
      message: "Storage Partner registered successfully.",
      data: {
        id: newStorage._id,
        storage_name: newStorage.storage_name,
        storage_email_or_phone: newStorage.storage_email_or_phone,
        storage_location: newStorage.storage_location,
        storage_type: newStorage.storage_type,
      },
    });
  } catch (error) {
    console.error("Verify Storage OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* ==================================================
   LOGIN STORAGE
================================================== */
exports.loginStorage = async (req, res) => {
  try {
    const { storage_email_or_phone, password } = req.body;

    if (!storage_email_or_phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Email/Phone and password are required.",
      });
    }

    const loginValue = storage_email_or_phone.toLowerCase().trim();

    const storage = await Storage.findOne({
      storage_email_or_phone: loginValue,
    });

    if (!storage) {
      return res.status(404).json({
        success: false,
        message: "Account not found.",
      });
    }

    const isMatch = await bcrypt.compare(password, storage.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect password.",
      });
    }

    const token = jwt.sign(
      {
        id: storage._id,
        role: "storage",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      data: {
        id: storage._id,
        storage_name: storage.storage_name,
        storage_email_or_phone: storage.storage_email_or_phone,
        storage_location: storage.storage_location,
        storage_type: storage.storage_type,
      },
    });
  } catch (error) {
    console.error("Login Storage Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* ==================================================
   FORGOT PASSWORD
================================================== */
exports.forgotStoragePassword = async (req, res) => {
  try {
    const { storage_email_or_phone } = req.body;

    if (!storage_email_or_phone) {
      return res.status(400).json({
        success: false,
        message: "Email or phone number is required.",
      });
    }

    const loginValue = storage_email_or_phone.toLowerCase().trim();

    const storage = await Storage.findOne({
      storage_email_or_phone: loginValue,
    });

    if (!storage) {
      return res.status(404).json({
        success: false,
        message: "Account not found.",
      });
    }

    const isEmail = loginValue.includes("@");

    const email = isEmail ? loginValue : null;
    const phone_number = !isEmail ? loginValue : null;

    await OTP.deleteMany({
      $or: [{ email }, { phone_number }],
      role: "storage-reset",
    });

    const otpCode = generateOtp(5);

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
      <div style="font-family:'Segoe UI',sans-serif;padding:24px;background:#f9fff9;border:1px solid #dcedc8;border-radius:10px;">
        <h2 style="color:#2e7d32;">Password Reset</h2>

        <p>Hello ${storage.storage_name},</p>

        <p>Your reset OTP is:</p>

        <h2 style="text-align:center;color:#1b5e20;">
          ${otpCode}
        </h2>

        <p>This OTP expires in 5 minutes.</p>
      </div>
      `;

      await sendEmail(
        email,
        "Harvest Nexus Password Reset",
        resetEmail
      );
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully.",
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* ==================================================
   VERIFY RESET OTP
================================================== */
exports.verifyStorageResetOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    const record = await OTP.findOne({
      otp,
      role: "storage-reset",
    });

    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully.",
      otpId: record._id,
    });
  } catch (error) {
    console.error("Verify Reset OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* ==================================================
   RESET PASSWORD
================================================== */
exports.resetStoragePassword = async (req, res) => {
  try {
    const { otpId, newPassword, confirmPassword } = req.body;

    if (!otpId || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    const otpRecord = await OTP.findById(otpId);

    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired.",
      });
    }

    const loginValue = otpRecord.email || otpRecord.phone_number;

    const storage = await Storage.findOne({
      storage_email_or_phone: loginValue,
    });

    if (!storage) {
      return res.status(404).json({
        success: false,
        message: "Account not found.",
      });
    }

    storage.password = await hashedPassword(newPassword);
    await storage.save();

    await OTP.deleteOne({ _id: otpRecord._id });

    return res.status(200).json({
      success: true,
      message: "Password reset successful.",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};