const mongoose = require("mongoose");

const logisticsSchema = new mongoose.Schema({
  company_name: { type: String, required: true },

  email: { type: String },

  phone_number: { type: String },

  login_id: { type: String, required: true, unique: true },

  vehicle_type: {
    type: String,
    enum: ["Truck", "Van", "Motorcycle", "Pickup", "Others"],
    default: "Truck",
  },

  vehicle_capacity: { type: String, required: true },

  service_area: { type: String, required: true },

  password: { type: String, required: true },

  profile_image: { type: String },

  is_available: { type: Boolean, default: true },

  rating: { type: Number, default: 0 },

  total_reviews: { type: Number, default: 0 },

  isVerified: { type: Boolean, default: false },
},
{ timestamps: true });

module.exports = mongoose.model("Logistics", logisticsSchema);
