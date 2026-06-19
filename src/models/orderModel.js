const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  farmer_id: { type: mongoose.Schema.Types.ObjectId, ref: "Farmer" },
  name: { type: String },
  quantity: { type: Number },
  price: { type: Number },
  subtotal: { type: Number },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  buyer_id: { type: mongoose.Schema.Types.ObjectId, ref: "Buyer", required: true },

  items: [orderItemSchema],

  delivery_address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String, default: "Nigeria" },
  },

  delivery_method: {
    type: String,
    enum: ["pickup", "delivery"],
    default: "delivery",
  },

  logistics_id: { type: mongoose.Schema.Types.ObjectId, ref: "Logistics" },

  subtotal: { type: Number, required: true },

  delivery_fee: { type: Number, default: 0 },

  total_amount: { type: Number, required: true },

  payment_method: {
    type: String,
    enum: ["bank_transfer", "card"],
    required: true,
  },

  payment_status: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending",
  },

  order_status: {
    type: String,
    enum: ["pending", "confirmed", "processing", "in_transit", "delivered", "cancelled"],
    default: "pending",
  },

  reference: { type: String, unique: true },

  notes: { type: String },
},
{ timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
