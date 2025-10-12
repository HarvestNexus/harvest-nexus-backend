/*const twilio = require("twilio");

const sendSms = async (phoneNumber, otp) => {
    const customer = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

    try {
        await customer.messages.create({
            body: `Please enter the code to complete account registration on Harvest Nexus: ${otp}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phoneNumber,
        });
        console.log("OTP has been sent to", phoneNumber);
    } catch (error) {
        console.log("Error sending OTP, please try again", error.message);
    }
};

module.exports = sendSms; */