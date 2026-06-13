const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const User = require('../models/User');
const { protect, organizerOnly } = require('../middleware/authMiddleware');
const { sendEmail, bookingConfirmationEmail } = require('../utils/sendEmail');
const QRCode = require('qrcode');

// Create booking
router.post('/', protect, async (req, res) => {
  const { eventId, tier, seats, seatNumbers, tierPrice } = req.body;
  const event = await Event.findById(eventId);
  if (!event) return res.status(404).json({ message: 'Event not found' });
  if (event.status !== 'approved') return res.status(400).json({ message: 'Event not approved' });
  if (event.bookedSeats + seats > event.totalSeats) return res.status(400).json({ message: 'Not enough seats available' });

  const totalAmount = tierPrice * seats;
  const booking = new Booking({ user: req.user._id, event: eventId, tier, tierPrice, seats, seatNumbers: (seatNumbers || []).map(String), totalAmount, status: 'confirmed' });
  await booking.save();

  // Generate QR
  const qrPayload = JSON.stringify({ code: booking.bookingCode, event: event.title, user: req.user.name, tier, seats });
  const qrDataUrl = await QRCode.toDataURL(qrPayload, { errorCorrectionLevel: 'H', width: 250 });
  booking.qrData = qrDataUrl;
  await booking.save();

  // Update event seat count
  event.bookedSeats += seats;
  const tierIdx = event.tiers.findIndex(t => t.name === tier);
  if (tierIdx >= 0) event.tiers[tierIdx].bookedSeats += seats;
  await event.save();

  // Send confirmation email
  try {
    const emailOpts = bookingConfirmationEmail(req.user, event, booking);
    await sendEmail(emailOpts);
  } catch (e) { console.log('Email error:', e.message); }

  const populated = await Booking.findById(booking._id).populate('event', 'title date time venue city category tiers');
  res.status(201).json(populated);
});

// Get my bookings
router.get('/my', protect, async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id }).populate('event', 'title date time venue city category tiers image').sort({ createdAt: -1 });
  res.json(bookings);
});

// Get bookings for an event (organizer)
router.get('/event/:id', protect, organizerOnly, async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ message: 'Not found' });
  if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized' });
  }
  const bookings = await Booking.find({ event: req.params.id }).populate('user', 'name email').sort({ createdAt: -1 });
  res.json(bookings);
});

// Check in by booking code
router.put('/checkin/:code', protect, organizerOnly, async (req, res) => {
  const booking = await Booking.findOne({ bookingCode: req.params.code })
    .populate('event', 'title date time venue city category tiers')
    .populate('user', 'name email');
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (booking.status === 'cancelled') return res.status(400).json({ message: 'Booking is cancelled' });
  if (booking.checkedIn) return res.status(400).json({ message: 'Already checked in', booking });
  booking.checkedIn = true;
  booking.checkedInAt = new Date();
  await booking.save();
  // Re-fetch to get full data including qrData
  const full = await Booking.findById(booking._id)
    .populate('event', 'title date time venue city category tiers')
    .populate('user', 'name email');
  res.json({ message: 'Check-in successful!', booking: full });
});

// Cancel booking
router.put('/cancel/:id', protect, async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (booking.user.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
  if (booking.status === 'cancelled') return res.status(400).json({ message: 'Already cancelled' });
  booking.status = 'cancelled';
  booking.cancelledAt = new Date();
  await booking.save();

  const event = await Event.findById(booking.event);
  if (event) {
    event.bookedSeats = Math.max(0, event.bookedSeats - booking.seats);
    await event.save();
  }
  res.json({ message: 'Booking cancelled' });
});

module.exports = router;