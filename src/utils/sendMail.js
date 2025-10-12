const nodemailer = require("nodemailer");

const sendMail  = async (email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail", 
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
                from:`"Harvest Nexus" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: "🎉 Please enter the code to verify your account!",
                text: `Code : ${otp}, it expires in 30 minutes.`,
        };

        await transporter.sendMail(mailOptions);
        console.log(`OTP sent successfully to ${email}`);
    } catch (error) {
        console.error("Error sending Email", error.message);
    }
};

module.exports = sendMail;