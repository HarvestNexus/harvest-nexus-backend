const mongoose = require("mongoose");

const logisticsSchema = new mongoose.Schema({
  company_name: { type: String, required: true },
  phone_number: { type: String, unique: true },
  location: { type: String, required: true },
  transport_type: { type: String, enum: ["Truck", "Van", "Motorcycle", "Others"], default: "Truck" },
  email: { type: String, required: false },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Logistics = mongoose.model("Logistics", logisticsSchema);
module.exports = Logistics;
