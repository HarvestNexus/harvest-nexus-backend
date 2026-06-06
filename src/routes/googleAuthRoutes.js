const express = require("express");
const router = express.Router();

const { googleSignup } = require("../controllers/googleAuthController");

router.post("/google", googleSignup);

module.exports = router;