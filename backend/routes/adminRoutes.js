const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const User = require('../models/User');
const Booking = require('../models/Booking');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Dashboard stats
router.get('/stats', protect, adminOnly, async (req, res) => {
  const [users, events, bookings, revenue] = await Promise.all([
    User.countDocuments(),
    Event.countDocuments({ status: 'approved' }),
    Booking.countDocuments({ status: 'confirmed' }),
    Booking.aggregate([{ $match: { status: 'confirmed' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
  ]);
  const pending = await Event.countDocuments({ status: 'pending' });
  res.json({ users, events, bookings, revenue: revenue[0]?.total || 0, pending });
});

// All events
router.get('/events', protect, adminOnly, async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const events = await Event.find(filter).populate('organizer', 'name email').sort({ createdAt: -1 });
  res.json(events);
});

// Approve/reject event
router.put('/events/:id/status', protect, adminOnly, async (req, res) => {
  const { status } = req.body;
  if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
  const event = await Event.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!event) return res.status(404).json({ message: 'Event not found' });
  res.json(event);
});

// All users
router.get('/users', protect, adminOnly, async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json(users);
});

// Activate/deactivate user
router.put('/users/:id/status', protect, adminOnly, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.isActive = !user.isActive;
  await user.save();
  res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}`, isActive: user.isActive });
});

// All bookings
router.get('/bookings', protect, adminOnly, async (req, res) => {
  const bookings = await Booking.find().populate('user', 'name email').populate('event', 'title date city').sort({ createdAt: -1 }).limit(100);
  res.json(bookings);
});

module.exports = router;
