const mongoose = require("mongoose");

const farmerSchema = new mongoose.Schema(
  {
    full_name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    farm_name: { type: String, required: true },
    location: { type: String, required: true },
    phone_number: { type: String }, 
    otp: { type: String },
    otpExpires: { type: Date },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Farmer", farmerSchema);
