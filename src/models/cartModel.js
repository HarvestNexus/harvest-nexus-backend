const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  farmer_id: { type: mongoose.Schema.Types.ObjectId, ref: "Farmer", required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
}, { _id: true });

const cartSchema = new mongoose.Schema({
  buyer_id: { type: mongoose.Schema.Types.ObjectId, ref: "Buyer", required: true, unique: true },
  items: [cartItemSchema],
},
{ timestamps: true });

module.exports = mongoose.model("Cart", cartSchema);
