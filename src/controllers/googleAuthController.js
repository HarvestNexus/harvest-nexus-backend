require("dotenv").config();

const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");

// Your models
const Farmer = require("../models/farmerModel");
const Buyer = require("../models/buyerModel");
const Logistics = require("../models/logisticsModel");
const Storage = require("../models/storageModel");

exports.googleSignup = async (req, res) => {
  try {
    const { full_name, email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({
        success: false,
        message: "Email and role are required",
      });
    }

    let Model;

    if (role === "farmer") Model = Farmer;
    else if (role === "buyer") Model = Buyer;
    else if (role === "logistics") Model = Logistics;
    else if (role === "storage") Model = Storage;
    else {
      return res.status(400).json({
        success: false,
        message: "Invalid role selected",
      });
    }

    let user = await Model.findOne({ email });

    // NEW USER
    if (!user) {
      user = await Model.create({
        full_name,
        email,
        isVerified: true,
      });

      const emailHtml = `
        <div style="font-family:'Segoe UI',sans-serif;padding:24px;background:#f9fff9;border:1px solid #dcedc8;border-radius:10px;">
          <div style="text-align:center;">
            <h2 style="color:#2e7d32;">🌾 Harvest Nexus</h2>
          </div>

          <p>Hello <strong>${full_name}</strong>,</p>

          <p>Your Google account has been successfully connected.</p>

          <p>Your <strong>${role}</strong> account is now active and ready to use.</p>

          <p style="margin-top:20px;">Welcome to Harvest Nexus 🌿</p>
        </div>
      `;

      await sendEmail(email, "Welcome to Harvest Nexus", emailHtml);
    }

    const token = jwt.sign(
      { id: user._id, role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      message: "Google signup successful",
      token,
      data: user,
    });

  } catch (error) {
    console.error("Google Auth Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};