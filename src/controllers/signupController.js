const bcrypt = require("bcryptjs");
const signUp = require("../models/signUp");
const transporter = require("../config/gmail");

const Register = async (req, res)=> {
    const {firstName, lastName, email, phoneNumber, address,  password} = req.body;
    try{
        //cjhecking if an email is alredy in use
         const emailExist = await signUp.findOne({ email });
        
         if (emailExist){ 
            return res.status(400).json({
            status: false,
            message: "Email already in Use"
        });
    }
        const hashedPassword = await bcrypt.hash(password, 8); //password hashed before storing in database
        //register a new User
        const newUser = await signUp.create ({ 
             firstName,
             lastName, 
             email,
             address, 
             password: hashedPassword,
             phoneNumber,
             });
        //Send a message to new Users
        await transporter.sendMail ({
            from: `"Harvest Nexus" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Welcome to Harvest Nexus",
            html : `
                    <p>Hi ${FirstName} ${LastName},</p><h2>Welcome to Harvest Nexus!</h2>
                    <p>We are excited to have you on board, our team will be in touch</p>
                    <p>From now on, you will receive updates, tips, and exclusive offers directly to your inbox.</p>
                    
                    `
        });
        //removing password before sending response
       const userObj = newUser.toObject();
       delete userObj.password;

        return res.status(201).json({
            status: true,
            message: "Account succesfully created!, *Is there need for veification*",
            data: userObj,
        });

    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "SignUp failed, please try again",
            error: error.message,
        });
    }
};

module.exports = Register;