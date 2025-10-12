const farmer = require("../models/farmer");
const buyer = require("../models/buyer");
const logisticsPartner = require("..models/logisticsPartner");
const storagePartner = require("../models/storagePartner");
const otp  = require("../models/otp");

const generateOtp = require("../utils/generateOtp");
// const sendSms = require("../utils/sendSms"); 
const sendMail = require("../utils/sendMail");
const hashedPassword = require("..utils/jhashedPassword");


exports.signUp = async (req, res) => {
    try {
        const { role, fullName, email, password, farmLocation, cropType, vehicleType, vehicleCapacity, serviceArea, storageLocation, storageType } = req.body;

        if(!role) {
            return res.status(400).json({
                success: false,
                message: "Please select a role to proceed"
            });
        }

        const otpCode = generateOtp();

        let missingFields = [];
        let userModel;

        switch (role.toLowerCase()) {
            case "farmer" : 
            missingFields = [ "fullName", "phoneNumber", "farmLocation", "cropType", "password"].filter(
                (f) => !req.body[f]
            );
            userModel = farmer;
            break;

            case "buyer":
            missingFields = ["fullName", "phoneNumber", "password"].filter(
                (f)=> !req.body[f]
            );
            userModel = buyer;
            break;

            case "logistics":
            missingFields = ["fullName", "phoneNumber", "vehicleType", "vehicleCapacity", "serviceArea", "password"].filter(
                (f)=> !req.body[f]
            );
            userModel = logisticsPartner;
            break;

            case "storage": 
            missingFields = ["fullName", "phoneNumber", "storageLocation", "storageCapacity", "password"].filter(
                (f)=> !req.body[f]
            );
            userModel = storagePartner;
            break;

            default: 
                return res.status(400).json({
                    success: false,
                    message: "Invalid role selected"
                });
        }

        if (missingFields.length > 0)
            return res.status(400).json({
                    success: false,
                    message: `mandatory fields required: ${missingFields.join(", ")}`,
        });
const existingUser = await userModel.findOne({ phoneNumber });
        if (existingUser)
            return res.status(400).json({
                success: false,
                message: "Phone number is already in use"
        });

const hashPassword = await hashedPassword(password);
        const newUser = await userModel.create({
            ...req.body,
            password : hashPassword,
        });

        //save OTP
        await otp.create({ phoneNumber, otp: otpCode });

        //send OTP
       // await sendSms (phoneNumber, otpCode);
       await sendMail(email, otpCode);

        res.status(201).json({
            success: true,
            message: "Registration successful, Please enter the OTP sent to you to activate your account",
            userId : newUser.id,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

//Lets verify OTP 
exports.verifyOtp = async (req, res) => {
    try {
        const { phoneNumber, otp, role } = req.body;
        if (!phoneNumber || !otp || !role) {
            return res.status(400).json({
                success: false,
                message: "PhoneNumber, otp , and role are required"
            });
        };

        let userModel;
        switch (role.toLowerCase()) {
            case "farmer": 
            userModel = farmer;
            break;

            case "buyer": 
            userModel = buyer;
            break;

            case "logistics": 
            userModel = logisticsPartner;
            break;

            case "storage": 
            userModel = storagePartner;
            break;

            default : 
            return res.status(400).json({
                success: false,
                message: "invalid Role"
            });
        }

        const otpData = await otp.findOne({ phoneNumber, otp });
            if(!otpData)
                return res.status(400).json({
                    success: false,
                    message: "Invalid or expired token"
            });

            //update user verification
            await userModel.findOneAndUpdate({ phoneNumber}, { isVerified: true});

            await otp.deleteMany({ phoneNumber });
                res.status(200).json({
                    success: true,
                    message: "Account successfully verified"
                });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};