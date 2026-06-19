const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type:    { type: String, enum: ['booking', 'cancellation', 'waitlist', 'event_update', 'organizer_message', 'system'], default: 'system' },
  title:   { type: String, required: true },
  message: { type: String, required: true },
  icon:    { type: String, default: 'bi-bell' },
  color:   { type: String, default: 'var(--cyan)' },
  link:    { type: String, default: '' }, // e.g. /my-tickets or /events/:id
  read:    { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);