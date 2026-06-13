const mongoose = require('mongoose');

const tierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, default: 0 },
  seats: { type: Number, required: true },
  bookedSeats: { type: Number, default: 0 },
  color: { type: String, default: '#00F2FE' },
});

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['Tech', 'Music', 'Sports', 'Food', 'Art', 'Business', 'Other'], default: 'Other' },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  venue: { type: String, required: true },
  city: { type: String, required: true },
  image: { type: String, default: '' },
  tiers: [tierSchema],
  totalSeats: { type: Number, required: true },
  bookedSeats: { type: Number, default: 0 },
  isFree: { type: Boolean, default: false },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  tags: [String],
  isHighlighted: { type: Boolean, default: false },
}, { timestamps: true });

eventSchema.index({ title: 'text', description: 'text', city: 'text' });

module.exports = mongoose.model('Event', eventSchema);
