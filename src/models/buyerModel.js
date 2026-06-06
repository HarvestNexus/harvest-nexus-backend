const mongoose = require("mongoose");

const buyerSchema = new mongoose.Schema(
{
  full_name: {
    type: String,
    required: true
  },

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

  password: {
    type: String,
    required: true
  },

  authProvider: {
    type: String,
    enum: ["local", "google", "apple"],
    default: "local"
  },

  isVerified: {
    type: Boolean,
    default: false
  }
},
{ timestamps: true }
);

module.exports = mongoose.model("Buyer", buyerSchema);