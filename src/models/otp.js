const mongoose = require("mongoose");


const otpSchema = new mongoose.Schema({
    phoneNumber: {
        type: String,
        required: true,
    },
    otp: {
        type: String,
        required: true,
    },
    createdAt : {
        type: Date,
        dafault: Date.now,
        expires: 180,
    },
});

module.exports = mongoose.model("otp", otpSchema);