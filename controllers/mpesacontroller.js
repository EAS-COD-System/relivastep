const axios = require('axios');
const Order = require('../models/Order');

// Get OAuth token from Safaricom
const getAccessToken = async () => {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  
  try {
    const response = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      { headers: { Authorization: `Basic ${auth}` } }
    );
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting token:', error.response?.data || error.message);
    throw error;
  }
};

// STK Push (Lipa Na M-PESA Online)
exports.stkPush = async (req, res) => {
  const { phoneNumber, amount, orderId, cartItems, totalPrice } = req.body;
  
  // Format phone number to 2547XXXXXXXX
  let formattedPhone = phoneNumber.replace(/\D/g, '');
  if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.slice(1);
  if (!formattedPhone.startsWith('254')) formattedPhone = '254' + formattedPhone;
  
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const password = Buffer.from(
    `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
  ).toString('base64');
  
  try {
    const token = await getAccessToken();
    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: formattedPhone,
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: formattedPhone,
        CallBackURL: process.env.MPESA_CALLBACK_URL,
        AccountReference: `RELIVASTEP-${orderId}`,
        TransactionDesc: 'Payment for relivastep order'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    // Save order to database with pending status
    const newOrder = new Order({
      orderId,
      phoneNumber: formattedPhone,
      amount,
      cartItems,
      totalPrice,
      mpesaReceipt: null,
      status: 'pending'
    });
    await newOrder.save();
    
    res.json({ success: true, checkoutRequestID: response.data.CheckoutRequestID });
  } catch (error) {
    console.error('STK Push error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Payment initiation failed' });
  }
};

// Callback from Safaricom after payment completes
exports.mpesaCallback = async (req, res) => {
  console.log('M-PESA Callback received:', req.body);
  const { Body } = req.body;
  if (Body && Body.stkCallback) {
    const { ResultCode, ResultDesc, CheckoutRequestID, CallbackMetadata } = Body.stkCallback;
    
    if (ResultCode === 0) {
      // Payment successful – extract M-PESA receipt number
      const mpesaReceipt = CallbackMetadata.Item.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
      // Update order status
      await Order.findOneAndUpdate(
        { mpesaCheckoutId: CheckoutRequestID },
        { status: 'completed', mpesaReceipt, paidAt: new Date() }
      );
    } else {
      // Payment failed
      await Order.findOneAndUpdate(
        { mpesaCheckoutId: CheckoutRequestID },
        { status: 'failed', failureReason: ResultDesc }
      );
    }
  }
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
};
