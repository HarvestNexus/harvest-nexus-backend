const mongoose = require("mongoose");

const buyerSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true,
    },
    phoneNumber: {
        type: true,
        required: true,
        unique: true,
        match: [/^\+?[0-9]{10,15}$/, "Enter a vild Phone Number"],
    },
    email: {
        type: String,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        default: "buyer",
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true}
);

module.exports = mongoose.model("buyer", buyerSchema);