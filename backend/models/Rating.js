const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' },
}, { timestamps: true });

ratingSchema.index({ user: 1, event: 1 }, { unique: true });

const waitlistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  notified: { type: Boolean, default: false },
}, { timestamps: true });

waitlistSchema.index({ user: 1, event: 1 }, { unique: true });

module.exports = {
  Rating: mongoose.model('Rating', ratingSchema),
  Waitlist: mongoose.model('Waitlist', waitlistSchema),
};
