// models/StoragePartner.js
const mongoose = require("mongoose");

const storageSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    match: [/^\+?[0-9]{10,15}$/, "Enter a valid phone number"],
  },
  email: {
    type: String,
    trim: true,
  },
  storageLocation: {
    type: String,
    required: true,
  },
  storageType: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: "storage",
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model("storagePartner", storageSchema);
