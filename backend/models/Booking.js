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
}, { timestamps: true });

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
