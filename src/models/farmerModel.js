const mongoose = require("mongoose");

const farmerSchema = new mongoose.Schema(
  {
    full_name: { type: String, required: true },

    email: { 
      type: String, 
      unique: true, 
      sparse: true 
    },

    phone_number: { 
      type: String, 
      unique: true, 
      sparse: true 
    },

    password: { type: String, required: true },

    location: { type: String, required: true },

    crop_type: {
      type: String,
      enum: [
        "Fruits",
        "Vegetables",
        "Legumes",
        "Cash Crops",
        "Roots & Tubers",
        "Grains & Cereals",
        "Others"
      ],
      required: true
    },

    otp: { type: String },
    otpExpires: { type: Date },

    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Farmer", farmerSchema);