const mongoose = require("mongoose");

const buyerSchema = new mongoose.Schema({
  full_name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  phone_number: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Buyer", buyerSchema);
