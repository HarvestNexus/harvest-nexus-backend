const mongoose = require("mongoose");

const savedCardSchema = new mongoose.Schema({
  card_number_last4: { type: String, required: true },
  cardholder_name: { type: String, required: true },
  expiry: { type: String, required: true },
  card_type: { type: String, default: "Visa" },
}, { _id: true });

const buyerSchema = new mongoose.Schema({
  full_name: { type: String, required: true },

  email: { type: String, unique: true, sparse: true },

  phone_number: { type: String, unique: true, sparse: true },

  password: { type: String },

  authProvider: {
    type: String,
    enum: ["local", "google", "apple"],
    default: "local",
  },

  isVerified: { type: Boolean, default: false },

  profile_image: { type: String },

  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String, default: "Nigeria" },
  },

  saved_suppliers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Farmer" }],

  saved_cards: [savedCardSchema],
},
{ timestamps: true });

module.exports = mongoose.model("Buyer", buyerSchema);
