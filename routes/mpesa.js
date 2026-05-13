const express = require('express');
const router = express.Router();
const { stkPush, mpesaCallback } = require('../controllers/mpesaController');

// Endpoint to initiate STK push
router.post('/stkpush', stkPush);

// Callback URL that Safaricom will hit after payment
router.post('/callback', mpesaCallback);

module.exports = router;
