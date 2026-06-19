const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  farmer_id: { type: mongoose.Schema.Types.ObjectId, ref: "Farmer", required: true },

  name: { type: String, required: true },

  description: { type: String },

  category: {
    type: String,
    enum: ["Fruits", "Vegetables", "Legumes", "Cash Crops", "Roots & Tubers", "Grains & Cereals", "Others"],
    required: true,
  },

  price: { type: Number, required: true },

  unit: { type: String, default: "kg" },

  quantity_available: { type: Number, required: true },

  images: [{ type: String }],

  location: { type: String },

  status: {
    type: String,
    enum: ["available", "out_of_stock", "removed"],
    default: "available",
  },
},
{ timestamps: true });

module.exports = mongoose.model("Product", productSchema);
