require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

connectDB();

const app = express();

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'https://cdacb-eventsphere.vercel.app', 'https://eventsphere-wine.vercel.app'], credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
// Note: ratings are handled via /api/events/:id/rate and /:id/ratings
// inside eventRoutes.js (the version the frontend actually calls and that
// correctly matches the Event schema's flat `rating`/`ratingCount` fields).
// A separate, unused ratingRoutes.js + Rating-model-based system existed
// here previously but wrote to a mismatched nested `rating.average` shape
// that didn't match the schema — removed to avoid future confusion.
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'EventSphere API Running', time: new Date() }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 EventSphere API running on http://localhost:${PORT}`));