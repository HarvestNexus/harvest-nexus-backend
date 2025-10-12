const mongoose = require("mongoose");

const logisticsSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true,
    },
    phoneNumber: {
        type: true,
        required: true,
        unique: true,
        match: [/^\+?[0-9]{10,15}$/, "Enter a valid Phone Number"],
    },
    email: {
        type: String,
        trim: true,   
    },
    vehicleType: {
        type: String,
        required: true,
    },
    vehicleCapacity: {
        type: String,
        required: true,
    },
    serviceArea: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: Boolean,
        default: "logistics",
    },
    isVerified: {
        type: String,
        default: false,
    },
}, { timestamps: true }
);

module.exports = mongoose.model("logisticsPartner", logisticsSchema);