const express = require('express');
const router  = express.Router();
const Event   = require('../models/Event');
const { Rating, Waitlist } = require('../models/Rating');
const { protect, organizerOnly } = require('../middleware/authMiddleware');

// Get all approved events
router.get('/', async (req, res) => {
  try {
    const { category, city, search, page = 1, limit = 20, includePast, dateFrom, dateTo } = req.query;
    const filter = { status: 'approved' };
    if (category && category !== 'all') filter.category = category;
    if (city) filter.city = new RegExp(city, 'i');

    // Past events are hidden from Browse Events by default — pass
    // includePast=true explicitly (e.g. an organizer's "past events" tab)
    // to see them. Comparing by date only (not time) so an event happening
    // later today still shows.
    const todayStart = new Date(new Date().toDateString());
    if (includePast !== 'true') filter.date = { $gte: todayStart };

    // Optional date-range filter (e.g. "events this weekend") — combines
    // with the past-event exclusion above rather than overriding it.
    if (dateFrom || dateTo) {
      filter.date = filter.date || {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) filter.date.$lte = new Date(dateTo);
    }

    // Search matches title, description, and tags — using regex (not $text)
    // so it can combine with tags in one $or clause. This means searching
    // "AI" finds events tagged #AI even if the title doesn't contain "AI".
    if (search) {
      const re = new RegExp(search, 'i');
      filter.$or = [{ title: re }, { description: re }, { tags: re }];
    }

    const events = await Event.find(filter)
      .populate('organizer', 'name email')
      .sort({ isHighlighted: -1, createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));
    const total = await Event.countDocuments(filter);
    res.json({ events, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get organizer's events
router.get('/my', protect, organizerOnly, async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user._id }).sort({ createdAt: -1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single event
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizer', 'name email');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    event.views = (event.views || 0) + 1;
    await event.save();
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
  try {
    const { title, description, category, date, time, venue, city, tiers, totalSeats, isFree, tags } = req.body;
    if (!title || !category || !date || !venue || !city)
      return res.status(400).json({ message: 'Title, category, date, venue and city are required.' });
    const event = await Event.create({
      title, description, category, date, time, venue, city,
      tiers: tiers || [], totalSeats, isFree: isFree || false,
      organizer: req.user._id, status: 'pending', tags: tags || [],
    });
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update event
router.put('/:id', protect, organizerOnly, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });
    Object.assign(event, req.body);
    const updated = await event.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete event
router.delete('/:id', protect, organizerOnly, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });
    await event.deleteOne();
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Join waitlist
router.post('/:id/waitlist', protect, async (req, res) => {
  try {
    const existing = await Waitlist.findOne({ user: req.user._id, event: req.params.id });
    if (existing) return res.status(400).json({ message: 'Already on waitlist' });
    await Waitlist.create({ user: req.user._id, event: req.params.id });
    res.json({ message: 'Added to waitlist' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get waitlist count
router.get('/:id/waitlist', async (req, res) => {
  try {
    const count = await Waitlist.countDocuments({ event: req.params.id });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Rate event
router.post('/:id/rate', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    const existing = await Rating.findOne({ user: req.user._id, event: req.params.id });
    if (existing) {
      existing.rating = rating; existing.comment = comment;
      await existing.save();
    } else {
      await Rating.create({ user: req.user._id, event: req.params.id, rating, comment });
    }
    const ratings = await Rating.find({ event: req.params.id });
    const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    await Event.findByIdAndUpdate(req.params.id, { rating: avg.toFixed(1), ratingCount: ratings.length });
    res.json({ message: 'Rating submitted', avg });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get event ratings
router.get('/:id/ratings', async (req, res) => {
  try {
    const ratings = await Rating.find({ event: req.params.id }).populate('user', 'name');
    res.json(ratings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;