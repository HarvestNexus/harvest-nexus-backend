const mongoose = require("mongoose");

const storageSchema = new mongoose.Schema(
{
  storage_name: { type: String, required: true },

  storage_email_or_phone: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },

  storage_location: { type: String, required: true },

  storage_type: {
    type: String,
    enum: [
      "Cold Storage",
      "Fruits",
      "Vegetables",
      "Legumes",
      "Cash Crops",
      "Roots & Tubers",
      "Grains & Cereals",
      "Others"
    ],
    default: "Others"
  },

  password: { type: String, required: true },

  isVerified: {
    type: Boolean,
    default: false
  }
},
{ timestamps: true }
);

module.exports = mongoose.model("Storage", storageSchema);