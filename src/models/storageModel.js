const mongoose = require("mongoose");

const storageSchema = new mongoose.Schema({
  storage_name: {
    type: String,
    required: true,
  },
  storage_email_or_phone: {
    type: String,
    required: true,
    unique: true,
  },
  storage_location: {
    type: String,
    required: true,
  },
  storage_type: {
    type: String,
    enum: ["Warehouse", "Cold Room", "Grain Silo", "Others"],
    default: "Others",
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Storage = mongoose.model("Storage", storageSchema);
module.exports = Storage;
