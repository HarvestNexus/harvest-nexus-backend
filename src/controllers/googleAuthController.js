require("dotenv").config();

const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");

const Buyer = require("../models/buyerModel");

exports.googleSignup = async (req, res) => {
  try {
    const { full_name, email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    let user = await Buyer.findOne({ email });

    // NEW USER
    if (!user) {
      user = await Buyer.create({
        full_name,
        email,
        isVerified: true,
        authProvider: "google",
      });

      const emailHtml = `
        <div style="font-family:'Segoe UI',sans-serif;padding:24px;background:#f9fff9;border:1px solid #dcedc8;border-radius:10px;">
          <div style="text-align:center;">
            <h2 style="color:#2e7d32;">🌾 Harvest Nexus</h2>
          </div>

          <p>Hello <strong>${full_name}</strong>,</p>

          <p>Your Google account has been successfully connected.</p>

          <p>Your <strong>Buyer</strong> account is now active and ready to use.</p>

          <p style="margin-top:20px;">Welcome to Harvest Nexus 🌿</p>
        </div>
      `;

      await sendEmail(email, "Welcome to Harvest Nexus", emailHtml);
    }

    const token = jwt.sign(
      { id: user._id, role: "buyer" },
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