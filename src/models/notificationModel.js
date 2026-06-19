const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, required: true },

  user_role: {
    type: String,
    enum: ["buyer", "farmer", "logistics", "storage"],
    required: true,
  },

  title: { type: String, required: true },

  message: { type: String, required: true },

  type: {
    type: String,
    enum: ["order", "payment", "delivery", "storage", "system"],
    default: "system",
  },

  is_read: { type: Boolean, default: false },

  ref_id: { type: mongoose.Schema.Types.ObjectId },
},
{ timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);
