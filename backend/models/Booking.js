const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  bookingCode: { type: String, unique: true },
  tier: { type: String, required: true },
  tierPrice: { type: Number, default: 0 },
  seats: { type: Number, required: true, min: 1 },
  seatNumbers: [String],
  totalAmount: { type: Number, required: true },
  checkedIn: { type: Boolean, default: false },
  checkedInAt: { type: Date },
  qrData: { type: String },
  status: { type: String, enum: ['confirmed', 'cancelled', 'pending'], default: 'confirmed' },
  cancelledAt: { type: Date },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  refundId: { type: String },
}, { timestamps: true });

// Race-condition guard: the application-level "is this seat already
// booked?" check (in bookingRoutes.js POST /) has a small window between
// checking and actually saving — if two requests for the same seat arrive
// within that window, both could pass the check. This partial unique index
// is the real, database-enforced backstop: MongoDB itself will reject the
// second insert if the same (event, seatNumbers, status='confirmed')
// combination already exists, even if the application logic raced.
// Partial filter (status: 'confirmed') means cancelling a seat and letting
// someone else book it later is unaffected — only simultaneous CONFIRMED
// duplicates are blocked.
bookingSchema.index(
  { event: 1, seatNumbers: 1 },
  { unique: true, partialFilterExpression: { status: 'confirmed' } }
);

bookingSchema.pre('save', function (next) {
  if (!this.bookingCode) {
    const chars = 'ABCDEF0123456789';
    let code = 'ES-';
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    this.bookingCode = code;
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);