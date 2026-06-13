const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { Rating, Waitlist } = require('../models/Rating');
const { protect, organizerOnly } = require('../middleware/authMiddleware');

// Get all approved events
router.get('/', async (req, res) => {
  const { category, city, search, page = 1, limit = 20 } = req.query;
  const filter = { status: 'approved' };
  if (category && category !== 'all') filter.category = category;
  if (city) filter.city = new RegExp(city, 'i');
  if (search) filter.$text = { $search: search };
  const events = await Event.find(filter).populate('organizer', 'name email').sort({ isHighlighted: -1, createdAt: -1 }).limit(Number(limit)).skip((Number(page) - 1) * Number(limit));
  const total = await Event.countDocuments(filter);
  res.json({ events, total, pages: Math.ceil(total / limit) });
});

// Get organizer's events
router.get('/my', protect, organizerOnly, async (req, res) => {
  const events = await Event.find({ organizer: req.user._id }).sort({ createdAt: -1 });
  res.json(events);
});

// Get single event
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizer', 'name email');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    event.views++;
    await event.save();

    // Get all booked seat numbers for this event
    const Booking = require('../models/Booking');
    const bookings = await Booking.find({ event: req.params.id, status: 'confirmed' }, 'seatNumbers');
    const bookedSeatNumbers = bookings.flatMap(b => b.seatNumbers || []).map(Number).filter(Boolean);

    const eventObj = event.toObject();
    eventObj.bookedSeatNumbers = bookedSeatNumbers;
    res.json(eventObj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create event
router.post('/', protect, organizerOnly, async (req, res) => {
  const { title, description, category, date, time, venue, city, tiers, totalSeats, isFree, tags } = req.body;
  const event = await Event.create({ title, description, category, date, time, venue, city, tiers: tiers || [], totalSeats, isFree: isFree || false, organizer: req.user._id, status: 'pending', tags: tags || [] });
  res.status(201).json(event);
});

// Update event
router.put('/:id', protect, organizerOnly, async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });
  if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized' });
  }
  Object.assign(event, req.body);
  const updated = await event.save();
  res.json(updated);
});

// Delete event
router.delete('/:id', protect, organizerOnly, async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });
  if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized' });
  }
  await event.deleteOne();
  res.json({ message: 'Event deleted' });
});

// Join waitlist
router.post('/:id/waitlist', protect, async (req, res) => {
  const existing = await Waitlist.findOne({ user: req.user._id, event: req.params.id });
  if (existing) return res.status(400).json({ message: 'Already on waitlist' });
  await Waitlist.create({ user: req.user._id, event: req.params.id });
  res.json({ message: 'Added to waitlist' });
});

// Get waitlist count
router.get('/:id/waitlist', async (req, res) => {
  const count = await Waitlist.countDocuments({ event: req.params.id });
  res.json({ count });
});

// Rate event
router.post('/:id/rate', protect, async (req, res) => {
  const { rating, comment } = req.body;
  const existing = await Rating.findOne({ user: req.user._id, event: req.params.id });
  if (existing) {
    existing.rating = rating;
    existing.comment = comment;
    await existing.save();
  } else {
    await Rating.create({ user: req.user._id, event: req.params.id, rating, comment });
  }
  const ratings = await Rating.find({ event: req.params.id });
  const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
  await Event.findByIdAndUpdate(req.params.id, { rating: avg.toFixed(1), ratingCount: ratings.length });
  res.json({ message: 'Rating submitted', avg });
});

// Get event ratings
router.get('/:id/ratings', async (req, res) => {
  const ratings = await Rating.find({ event: req.params.id }).populate('user', 'name');
  res.json(ratings);
});

module.exports = router;