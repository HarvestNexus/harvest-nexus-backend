const mongoose = require("mongoose");

const storageSchema = new mongoose.Schema({
  storage_name: { type: String, required: true },

  storage_email_or_phone: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },

  storage_location: { type: String, required: true },

  storage_type: {
    type: String,
    enum: ["Cold Storage", "Fruits", "Vegetables", "Legumes", "Cash Crops", "Roots & Tubers", "Grains & Cereals", "Others"],
    default: "Others",
  },

  password: { type: String, required: true },

  profile_image: { type: String },

  capacity: { type: Number },

  price_per_unit: { type: Number },

  is_available: { type: Boolean, default: true },

  rating: { type: Number, default: 0 },

  total_reviews: { type: Number, default: 0 },

  isVerified: { type: Boolean, default: false },
},
{ timestamps: true });

module.exports = mongoose.model("Storage", storageSchema);
