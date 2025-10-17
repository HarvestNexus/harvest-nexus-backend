const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    full_name: { type: String },
    phone_number: { type: String }, // 👈 removed "required"
    location: { type: String },
    company_name: { type: String },
    farm_name: { type: String },
    email: { type: String },
    transport_type: { type: String },
    password: { type: String },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    role: {
      type: String,
      required: true,
      enum: [
        "farmer-register",
        "buyer-register",
        "storage-register",
        "logistics-register",
        "farmer-reset",
        "buyer-reset",
        "storage-reset",
        "logistics-reset",
      ],
    },
        verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OTP", otpSchema);
