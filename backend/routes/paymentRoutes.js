const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { protect } = require('../middleware/authMiddleware');
const Event = require('../models/Event');

// Setup (5 min):
//   1. Go to https://dashboard.razorpay.com → sign up free
//   2. Switch to TEST MODE (toggle top-left) — no real money moves in test mode
//   3. Settings → API Keys → Generate Test Key
//   4. On Render, set: RAZORPAY_KEY_ID=rzp_test_xxxxx and RAZORPAY_KEY_SECRET=xxxxx
//   5. On Vercel, set: VITE_RAZORPAY_KEY_ID=rzp_test_xxxxx (same key ID, safe to expose —
//      only the secret must stay server-side)
//
// Test card for checkout: 4111 1111 1111 1111, any future expiry, any CVV, any OTP.

const getRazorpay = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret || keyId === 'your_razorpay_key_id_here') return null;
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

// Create a Razorpay order for a given amount (in rupees) before booking.
// The actual Booking document is only created AFTER payment is verified
// (see bookingRoutes.js POST / which now requires paymentId+orderId+signature
// for paid events, skipping straight through for free events).
router.post('/create-order', protect, async (req, res) => {
  try {
    const razorpay = getRazorpay();
    if (!razorpay) {
      return res.status(503).json({ message: 'Payment gateway not configured on this server yet.' });
    }
    const { amount, eventId } = req.body; // amount in rupees
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Razorpay expects paise (smallest unit)
      currency: 'INR',
      receipt: `evt_${eventId}_${Date.now()}`,
      notes: { eventId, eventTitle: event.title, userId: req.user._id.toString() },
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID, // safe to send to frontend, it's public
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create payment order: ' + err.message });
  }
});

// Verify the payment signature Razorpay's checkout returns after a successful
// payment. This is a cryptographic check — it's the only way to be sure the
// payment is genuine and wasn't tampered with by a malicious client.
function verifyPaymentSignature({ orderId, paymentId, signature }) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expected === signature;
}

module.exports = router;
module.exports.verifyPaymentSignature = verifyPaymentSignature;
module.exports.getRazorpay = getRazorpay;