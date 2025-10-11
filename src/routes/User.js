const {trimStrings} = require('../functions');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

const User = require('../models/User');
// Regex rules for validation
const rules = {
  storage_name: /^[a-zA-Z\s]{2,}$/,
  storage_email_or_phone: /^(\+?\d{10,15}|[^@\s]+@[^@\s]+\.[^@\s]+)$/,
  storage_location: /^.{2,}$/,
  storage_password: /^.{6,}$/
};

router.post('/signup', (req, res) => {

  const trimmedInput = trimStrings(req.body);

  const invalid = Object.entries(rules).filter(
    ([k, regex]) => !regex.test(trimmedInput[k] ?? '')
  );

  
  if (invalid.length > 0) {
    return res.status(400).json({
      errors: invalid.map(([k]) => `${k.replace(/_/g, ' ')} is invalid`)
    });
  }

  const {
    storage_name,
    storage_email_or_phone,
    storage_location,
    storage_type,
    storage_password
  } = trimmedInput;

  User.find({storage_email_or_phone}).then(result =>{
    if(result.length){
        res.json({
            status: "Error",
            message: "Oops! This email address or phone number already exists"
        })
    }else{
        const hashingRounds = 10;
        bcrypt.hash(storage_password, hashingRounds)
        .then(hashedPassword => {
            const newUser = new User({
                storage_name,
                storage_email_or_phone,
                storage_location,
                storage_type,
                password: hashedPassword
            })

            newUser.save()
            .then(result => {

                res.json({
                    status: "Success",
                    message: "You have successfully created a storage account"
                });
            })
            .catch(err => {
                res.json({
                status: "Error",
                message: "An error occurred while creating your storage account"
            })
            })
        }).catch(err => {
            res.json({
                status: "Error",
                message: "An error occurred while encrypting password"
            })
        })
    }
  }).catch(err => {
        console.log(err);
        res.json({
            status: "Error",
            message: "An error occurred while processing your request!"
        })
  })
});

module.exports = router;
