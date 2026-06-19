const mongoose = require("mongoose");

const storageBookingSchema = new mongoose.Schema({
  farmer_id: { type: mongoose.Schema.Types.ObjectId, ref: "Farmer", required: true },

  storage_id: { type: mongoose.Schema.Types.ObjectId, ref: "Storage", required: true },

  produce_type: { type: String, required: true },

  quantity: { type: Number, required: true },

  duration_days: { type: Number, required: true },

  start_date: { type: Date, required: true },

  end_date: { type: Date, required: true },

  total_price: { type: Number },

  status: {
    type: String,
    enum: ["pending", "accepted", "active", "completed", "rejected", "cancelled"],
    default: "pending",
  },

  notes: { type: String },
},
{ timestamps: true });

module.exports = mongoose.model("StorageBooking", storageBookingSchema);
