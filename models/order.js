const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true },
  amount: { type: Number, required: true },
  cartItems: { type: Array, required: true }, // store cart array
  totalPrice: { type: Number, required: true },
  mpesaReceipt: { type: String, default: null },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  failureReason: { type: String },
  mpesaCheckoutId: { type: String },
  createdAt: { type: Date, default: Date.now },
  paidAt: { type: Date }
});

module.exports = mongoose.model('Order', orderSchema);
