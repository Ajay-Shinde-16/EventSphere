const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { Rating } = require('../models/Rating');
const Event = require('../models/Event');

// POST /api/ratings — submit or update rating
router.post('/', protect, async (req, res) => {
  try {
    const { eventId, rating, comment } = req.body;
    if (!eventId || !rating) return res.status(400).json({ message: 'eventId and rating required' });

    const existing = await Rating.findOne({ user: req.user._id, event: eventId });
    let result;
    if (existing) {
      existing.rating = rating;
      existing.comment = comment || '';
      result = await existing.save();
    } else {
      result = await Rating.create({ user: req.user._id, event: eventId, rating, comment: comment || '' });
    }

    // Update event average
    const ratings = await Rating.find({ event: eventId });
    const avg = ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;
    await Event.findByIdAndUpdate(eventId, { 'rating.average': avg.toFixed(1), 'rating.count': ratings.length });

    res.json(result);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Already rated' });
    res.status(500).json({ message: err.message });
  }
});

// GET /api/ratings/:eventId — get all ratings for event
router.get('/:eventId', async (req, res) => {
  try {
    const ratings = await Rating.find({ event: req.params.eventId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });
    res.json(ratings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
