const mongoose = require("mongoose");

const farmerSchema = new mongoose.Schema({
  full_name: { type: String, required: true },

  email: { type: String, unique: true, sparse: true },

  phone_number: { type: String, unique: true, sparse: true },

  password: { type: String },

  location: { type: String, required: true },

  crop_type: {
    type: String,
    enum: ["Fruits", "Vegetables", "Legumes", "Cash Crops", "Roots & Tubers", "Grains & Cereals", "Others"],
    required: true,
  },

  farm_name: { type: String },

  description: { type: String },

  profile_image: { type: String },

  bank_name: { type: String },

  account_number: { type: String },

  account_name: { type: String },

  rating: { type: Number, default: 0 },

  total_reviews: { type: Number, default: 0 },

  otp: { type: String },

  otpExpires: { type: Date },

  isVerified: { type: Boolean, default: false },
},
{ timestamps: true });

module.exports = mongoose.model("Farmer", farmerSchema);
