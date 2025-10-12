const mongoose = require("mongoose");

const farmerSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true,
    },
    phoneNumber : {
        type: String,
        required: true,
        unique: true,
        match: [/^\+?[0-9]{10,15}$]/, "Enter a valid number"],
    },
    email : {
        type: String,
        required: true,
    },
    farmLocation: {
        type: String,
        required: true,
    },
    cropType: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        default: "farmer",
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
}, { timestamps : true}
);


module.exports = mongoose.model("farmer", farmerSchema);