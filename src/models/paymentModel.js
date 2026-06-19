const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },

  buyer_id: { type: mongoose.Schema.Types.ObjectId, ref: "Buyer", required: true },

  amount: { type: Number, required: true },

  method: {
    type: String,
    enum: ["bank_transfer", "card"],
    required: true,
  },

  status: {
    type: String,
    enum: ["pending", "successful", "failed"],
    default: "pending",
  },

  reference: { type: String },

  bank_name: { type: String },
  account_number: { type: String },
  account_name: { type: String },

  card_last4: { type: String },
  cardholder_name: { type: String },
},
{ timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);
