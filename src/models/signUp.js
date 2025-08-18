const mongoose = require("mongoose");

const signUpSchema = new mongoose.Schema({
    firtName: {
        type: String,
        required: [true, " First Name is required"],
        trim: true,
        minlenght: [2, "Fist Name must be at least 2 characters long"]
    },
    lastName: {
        type: String,
        required: [true, " last Name is required"],
        trim: true
    },
    middleName: {
        type: String,
        trim:true
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        lowercase: true,
        unique: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"]
    },
    phoneNumber: {
        type: String,
        required: true,
        true: true,
        match: [/^\+?[0-9]{10,15}$/, "Please provide a valid phone number"]
    },
    password: {
        type: String,
        required: true,
        select: false,
        minlenght: [8, "passsword must be at least 6 character long"]
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    address: {
        type: String,
        required: [true, "Address is required"],
        trim: true
    },
}, 
    {timestamps: true });

module.exports = mongoose.model("SignUp", signUpSchema);