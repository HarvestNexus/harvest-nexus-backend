const express = require("express");
const router = express.Router();
const  Register  = require("../controllers/signupController"); // fixed import path

// POST /signup/register
router.post("/", Register);

module.exports = router;