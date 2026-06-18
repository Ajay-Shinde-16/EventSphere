const express = require('express');
const router  = express.Router();
const Booking = require('../models/Booking');
const Event   = require('../models/Event');
const User    = require('../models/User');
const { Rating, Waitlist } = require('../models/Rating');
const { protect, organizerOnly } = require('../middleware/authMiddleware');
const { sendEmail, bookingConfirmationEmail, waitlistNotificationEmail } = require('../utils/sendEmail');
const QRCode = require('qrcode');

// Create booking
router.post('/', protect, async (req, res) => {
  try {
    const { eventId, tier, seats, seatNumbers, tierPrice } = req.body;

    if (!eventId || !tier || !seats || seats < 1)
      return res.status(400).json({ message: 'Missing required booking fields.' });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.status !== 'approved') return res.status(400).json({ message: 'Event not approved for booking' });
    if (event.bookedSeats + seats > event.totalSeats)
      return res.status(400).json({ message: 'Not enough seats available' });

    // Validate selected seat numbers aren't already booked
    if (seatNumbers?.length) {
      const existing = await Booking.findOne({
        event: eventId,
        status: 'confirmed',
        seatNumbers: { $in: seatNumbers.map(String) },
      });
      if (existing) return res.status(400).json({ message: 'One or more selected seats are already booked. Please refresh and try again.' });
    }

    const totalAmount = (tierPrice || 0) * seats;
    const booking = new Booking({
      user: req.user._id, event: eventId, tier,
      tierPrice: tierPrice || 0, seats,
      seatNumbers: (seatNumbers || []).map(String),
      totalAmount, status: 'confirmed',
    });
    await booking.save();

    // Generate QR
    const qrPayload = JSON.stringify({ code: booking.bookingCode, event: event.title, user: req.user.name, tier, seats });
    booking.qrData = await QRCode.toDataURL(qrPayload, { errorCorrectionLevel: 'H', width: 250 });
    await booking.save();

    // Update seat count
    event.bookedSeats += seats;
    const tierIdx = event.tiers.findIndex(t => t.name === tier);
    if (tierIdx >= 0) event.tiers[tierIdx].bookedSeats = (event.tiers[tierIdx].bookedSeats || 0) + seats;
    await event.save();

    const populated = await Booking.findById(booking._id)
      .populate('event', 'title date time venue city category tiers');

    // Respond to the user IMMEDIATELY — don't make them wait for the email to send.
    res.status(201).json(populated);

    // Send confirmation email truly in the background (fire-and-forget).
    // This runs AFTER the response above, so slow SMTP/Gmail latency never
    // delays the booking itself.
    setImmediate(async () => {
      try {
        const emailOpts = bookingConfirmationEmail(req.user, event, populated);
        await sendEmail(emailOpts);
      } catch (e) {
        console.log('Email error (non-fatal):', e.message);
      }
    });
  } catch (err) {
    console.error('Booking error:', err.message);
    res.status(500).json({ message: 'Booking failed: ' + err.message });
  }
});

// Get my bookings
router.get('/my', protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('event', 'title date time venue city category tiers image')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
});

// Get bookings for an event (organizer/admin)
router.get('/event/:id', protect, organizerOnly, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });
    const bookings = await Booking.find({ event: req.params.id })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch event bookings' });
  }
});

// Check-in by booking code
router.put('/checkin/:code', protect, organizerOnly, async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingCode: req.params.code })
      .populate('event', 'title date time venue city category tiers')
      .populate('user', 'name email');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status === 'cancelled') return res.status(400).json({ message: 'Booking is cancelled' });
    if (booking.checkedIn) return res.status(400).json({ message: 'Already checked in', booking });
    booking.checkedIn = true;
    booking.checkedInAt = new Date();
    await booking.save();
    const full = await Booking.findById(booking._id)
      .populate('event', 'title date time venue city category tiers')
      .populate('user', 'name email');
    res.json({ message: 'Check-in successful!', booking: full });
  } catch (err) {
    res.status(500).json({ message: 'Check-in failed: ' + err.message });
  }
});

// Email the real visual ticket as a PDF (or PNG fallback) attachment.
// The file is generated client-side via canvas + jsPDF (see
// frontend/src/utils/ticketImage.js) right after a successful booking,
// then POSTed here as base64 — because canvas/PDF rendering only works
// in the browser, not on the Node server.
router.post('/:id/email-ticket-image', protect, async (req, res) => {
  try {
    const { base64File, format } = req.body;
    if (!base64File)
      return res.status(400).json({ message: 'Missing ticket file.' });

    const booking = await Booking.findById(req.params.id)
      .populate('event', 'title date time venue city category tiers')
      .populate('user', 'name email');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.user._id.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });

    // Strip any accidental data: prefix, keep raw base64 only
    const cleanBase64 = base64File.includes(',') ? base64File.split(',')[1] : base64File;

    const isPdf = format === 'pdf';
    const ext = isPdf ? 'pdf' : 'png';
    const filename = `EventSphere-Ticket-${booking.bookingCode}.${ext}`;

    const dateStr = new Date(booking.event.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${booking.event.venue} ${booking.event.city}`)}`;
    const eventUrl = `${process.env.FRONTEND_URL || 'https://eventsphere-wine.vercel.app'}/events/${booking.event._id}`;

    // Respond immediately — don't make the user wait for the email to send.
    res.json({ message: 'Ticket file email queued.' });

    // Fire-and-forget send, same pattern as the main booking confirmation email.
    setImmediate(async () => {
      try {
        await sendEmail({
          to: booking.user.email,
          subject: `🎫 Your Real Ticket — ${booking.event.title} | EventSphere`,
          html: `
            <div style="background:#0B0F19;padding:32px;font-family:'Segoe UI',Arial,sans-serif;text-align:center;border-radius:16px;max-width:560px;margin:0 auto;">
              <h2 style="color:#38BDF8;margin-bottom:4px;letter-spacing:2px;">⬡ EVENTSPHERE</h2>
              <p style="color:#8892A4;font-size:12px;margin-bottom:24px;">Elite Event Management Platform</p>

              <div style="background:#171E2E;border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:24px;text-align:left;margin-bottom:20px;">
                <p style="color:#E2E8F0;font-size:16px;font-weight:700;margin-bottom:12px;">${booking.event.title}</p>
                <p style="color:#94A3B8;font-size:13px;margin-bottom:6px;">📅 ${dateStr} &nbsp;·&nbsp; ⏰ ${booking.event.time}</p>
                <p style="color:#94A3B8;font-size:13px;margin-bottom:14px;">
                  📍 <a href="${mapsUrl}" style="color:#38BDF8;text-decoration:none;">${booking.event.venue}, ${booking.event.city} (open in Google Maps)</a>
                </p>
                <p style="color:#94A3B8;font-size:13px;margin-bottom:6px;">🎟️ Tier: <strong style="color:#E2E8F0;">${booking.tier}</strong></p>
                <p style="color:#94A3B8;font-size:13px;margin-bottom:6px;">🪑 Seats: <strong style="color:#E2E8F0;">${booking.seats}</strong></p>
                <p style="color:#94A3B8;font-size:13px;">🔖 Booking Code: <strong style="color:#38BDF8;">${booking.bookingCode}</strong></p>
              </div>

              <p style="color:#E2E8F0;font-size:14px;font-weight:600;margin-bottom:4px;">📎 Your real ticket ${isPdf ? 'PDF' : 'image'} is attached</p>
              <p style="color:#8892A4;font-size:12px;margin-bottom:20px;">Open the attachment, then tap/click on the venue area inside it for directions, or save/print it for entry.</p>

              <a href="${eventUrl}" style="display:inline-block;padding:10px 24px;border-radius:50px;background:linear-gradient(135deg,#38BDF8,#A78BFA);color:#000;font-size:13px;font-weight:700;text-decoration:none;">
                View Event Page →
              </a>

              <p style="color:#4B5563;font-size:11px;margin-top:24px;">PGCP AC, C-DAC Bangalore 2026 · Built by Ajay Shinde</p>
            </div>`,
          attachments: [{
            filename,
            content: cleanBase64,
          }],
        });
        console.log(`📧 Ticket ${ext.toUpperCase()} emailed to ${booking.user.email} for booking ${booking.bookingCode}`);
      } catch (e) {
        console.log('Ticket file email error (non-fatal):', e.message);
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to queue ticket image email: ' + err.message });
  }
});

// Cancel booking
router.put('/cancel/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });
    if (booking.status === 'cancelled')
      return res.status(400).json({ message: 'Already cancelled' });
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    await booking.save();

    // Restore seat count
    const event = await Event.findById(booking.event);
    if (event) {
      event.bookedSeats = Math.max(0, event.bookedSeats - booking.seats);
      const tierIdx = event.tiers.findIndex(t => t.name === booking.tier);
      if (tierIdx >= 0) event.tiers[tierIdx].bookedSeats = Math.max(0, (event.tiers[tierIdx].bookedSeats||0) - booking.seats);
      await event.save();

      // ── FEATURE 3: Notify waitlisted users ──────────────────
      // Fire-and-forget: don't block the cancel response
      setImmediate(async () => {
        try {
          const waitlisted = await Waitlist.find({ event: event._id, notified: false })
            .populate('user', 'name email')
            .limit(10); // notify up to 10 at a time

          if (waitlisted.length > 0) {
            const notifyPromises = waitlisted.map(async (w) => {
              if (!w.user?.email) return;
              try {
                const emailOpts = waitlistNotificationEmail(w.user, event);
                await sendEmail(emailOpts);
                w.notified = true;
                await w.save();
                console.log(`📧 Waitlist notification sent to ${w.user.email} for "${event.title}"`);
              } catch (e) {
                console.log(`📧 Waitlist email failed for ${w.user?.email}: ${e.message}`);
              }
            });
            await Promise.allSettled(notifyPromises);
          }
        } catch (e) {
          console.log('Waitlist notification error (non-fatal):', e.message);
        }
      });
      // ────────────────────────────────────────────────────────
    }

    res.json({ message: 'Booking cancelled' });
  } catch (err) {
    res.status(500).json({ message: 'Cancel failed: ' + err.message });
  }
});

module.exports = router;