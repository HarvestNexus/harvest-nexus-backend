const mongoose = require("mongoose");

const deliveryRequestSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },

  logistics_id: { type: mongoose.Schema.Types.ObjectId, ref: "Logistics" },

  buyer_id: { type: mongoose.Schema.Types.ObjectId, ref: "Buyer", required: true },

  pickup_address: { type: String, required: true },

  delivery_address: { type: String, required: true },

  items_description: { type: String },

  delivery_fee: { type: Number, default: 0 },

  status: {
    type: String,
    enum: ["pending", "accepted", "picked_up", "in_transit", "delivered", "cancelled"],
    default: "pending",
  },
},
{ timestamps: true });

module.exports = mongoose.model("DeliveryRequest", deliveryRequestSchema);
