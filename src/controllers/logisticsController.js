require("dotenv").config();

const Logistics = require("../models/logisticsModel");
const OTP = require("../models/otp");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const hashedPassword = require("../utils/hashedPassword");
const sendEmail = require("../utils/sendEmail");
const generateOtp = require("../utils/generateOtp");

/* ===================================================
   VALID VEHICLE TYPES
=================================================== */
const validVehicleTypes = [
  "Truck",
  "Van",
  "Motorcycle",
  "Pickup",
  "Others"
];

/* ===================================================
   REGISTER LOGISTICS
=================================================== */
exports.registerLogistics = async (req, res) => {
  try {
    const {
      company_name,
      emailOrPhone,
      vehicle_type,
      vehicle_capacity,
      service_area,
      password
    } = req.body;

    if (
      !company_name ||
      !emailOrPhone ||
      !vehicle_type ||
      !vehicle_capacity ||
      !service_area ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters."
      });
    }

    if (!validVehicleTypes.includes(vehicle_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle type selected."
      });
    }

    const loginValue = emailOrPhone.toLowerCase().trim();

    const existing = await Logistics.findOne({
      login_id: loginValue
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Account already exists."
      });
    }

    const isEmail = loginValue.includes("@");

    const email = isEmail ? loginValue : null;
    const phone_number = !isEmail ? loginValue : null;

    await OTP.deleteMany({
      $or: [{ email }, { phone_number }],
      role: "logistics-register"
    });

    const otpCode = generateOtp(5);

    await OTP.create({
      email,
      phone_number,
      company_name,
      vehicle_type,
      vehicle_capacity,
      service_area,
      password,
      otp: otpCode,
      role: "logistics-register",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    if (email) {
      const emailHtml = `
      <div style="font-family:'Segoe UI',sans-serif;padding:24px;background:#f9fff9;border-radius:10px;border:1px solid #dcedc8;">
        <h2 style="color:#2e7d32;">🚚 Harvest Nexus</h2>

        <p>Hello <strong>${company_name}</strong>,</p>

        <p>Use the OTP below to verify your Logistics Partner account:</p>

        <div style="text-align:center;margin:20px 0;">
          <h2 style="font-size:28px;color:#1b5e20;letter-spacing:4px;">
            ${otpCode}
          </h2>
        </div>

        <p>This OTP expires in <strong>5 minutes</strong>.</p>
      </div>
      `;

      await sendEmail(
        email,
        "Verify Logistics Account - Harvest Nexus",
        emailHtml
      );
    }

    return res.status(201).json({
      success: true,
      message: "OTP sent successfully."
    });

  } catch (error) {
    console.error("Register Logistics Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* ===================================================
   VERIFY OTP
=================================================== */
exports.verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required."
      });
    }

    const record = await OTP.findOne({
      otp,
      role: "logistics-register"
    });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP."
      });
    }

    if (record.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: record._id });

      return res.status(400).json({
        success: false,
        message: "OTP expired."
      });
    }

    const hash = await hashedPassword(record.password);

    const logistics = await Logistics.create({
      company_name: record.company_name,
      email: record.email,
      phone_number: record.phone_number,
      login_id: record.email || record.phone_number,
      vehicle_type: record.vehicle_type,
      vehicle_capacity: record.vehicle_capacity,
      service_area: record.service_area,
      password: hash,
      isVerified: true
    });

    await OTP.deleteOne({ _id: record._id });

    if (record.email) {
      const welcomeEmail = `
      <div style="font-family:'Segoe UI',sans-serif;padding:24px;background:#f9fff9;border-radius:10px;border:1px solid #dcedc8;">
        <h2 style="color:#2e7d32;">🎉 Welcome to Harvest Nexus</h2>

        <p>Hello <strong>${logistics.company_name}</strong>,</p>

        <p>Your logistics account has been verified successfully.</p>
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
      message: "Logistics account created successfully.",
      data: logistics
    });

  } catch (error) {
    console.error("Verify Logistics OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* ===================================================
   LOGIN
=================================================== */
exports.loginLogistics = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
      return res.status(400).json({
        success: false,
        message: "Email/Phone and password required."
      });
    }

    const logistics = await Logistics.findOne({
      login_id: emailOrPhone.toLowerCase().trim()
    });

    if (!logistics) {
      return res.status(404).json({
        success: false,
        message: "Account not found."
      });
    }

    const isMatch = await bcrypt.compare(password, logistics.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect password."
      });
    }

    const token = jwt.sign(
      {
        id: logistics._id,
        role: "logistics"
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      data: logistics
    });

  } catch (error) {
    console.error("Login Logistics Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* ===================================================
   FORGOT PASSWORD
=================================================== */
exports.forgotPassword = async (req, res) => {
  try {
    const { emailOrPhone } = req.body;

    const loginValue = emailOrPhone.toLowerCase().trim();

    const logistics = await Logistics.findOne({
      login_id: loginValue
    });

    if (!logistics) {
      return res.status(404).json({
        success: false,
        message: "Account not found."
      });
    }

    const isEmail = loginValue.includes("@");

    const email = isEmail ? loginValue : null;
    const phone_number = !isEmail ? loginValue : null;

    await OTP.deleteMany({
      $or: [{ email }, { phone_number }],
      role: "logistics-reset"
    });

    const otpCode = generateOtp(5);

    await OTP.create({
      email,
      phone_number,
      otp: otpCode,
      role: "logistics-reset",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    if (email) {
      const resetEmail = `
      <div style="font-family:'Segoe UI',sans-serif;padding:24px;background:#f9fff9;border-radius:10px;border:1px solid #dcedc8;">
        <h2>Password Reset</h2>

        <p>Hello ${logistics.company_name},</p>

        <p>Your OTP is:</p>

        <h2 style="text-align:center;color:#2e7d32;">
          ${otpCode}
        </h2>
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
      message: "OTP sent successfully."
    });

  } catch (error) {
    console.error("Forgot Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* ===================================================
   VERIFY RESET OTP
=================================================== */
exports.verifyResetOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    const record = await OTP.findOne({
      otp,
      role: "logistics-reset"
    });

    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP."
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP verified.",
      otpId: record._id
    });

  } catch (error) {
    console.error("Verify Reset OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* ===================================================
   RESET PASSWORD
=================================================== */
exports.resetPassword = async (req, res) => {
  try {
    const { otpId, newPassword, confirmPassword } = req.body;

    if (!otpId || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields required."
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match."
      });
    }

    const record = await OTP.findById(otpId);

    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired."
      });
    }

    const loginValue = record.email || record.phone_number;

    const logistics = await Logistics.findOne({
      login_id: loginValue
    });

    logistics.password = await hashedPassword(newPassword);
    await logistics.save();

    await OTP.deleteOne({ _id: otpId });

    return res.status(200).json({
      success: true,
      message: "Password reset successful."
    });

  } catch (error) {
    console.error("Reset Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};