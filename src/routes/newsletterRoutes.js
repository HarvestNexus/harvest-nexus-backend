const express = require('express');
const router = express.Router();
const { newsletter } = require('../controllers/newsletterController');

router.post('/', newsletter);

module.exports = router;
