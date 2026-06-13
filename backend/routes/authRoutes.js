const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const generateToken = require('../utils/generateToken');
const { protect }   = require('../middleware/authMiddleware');

// ── Register ──────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required.' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: 'An account with this email already exists.' });

    const allowedRoles = ['attendee', 'organizer'];
    const userRole = allowedRoles.includes(role) ? role : 'attendee';
    const user = await User.create({ name: name.trim(), email: email.toLowerCase(), password, role: userRole });

    res.status(201).json({
      _id: user._id, name: user.name, email: user.email,
      role: user.role, token: generateToken(user._id),
    });
  } catch (err) {
    console.error('Register error:', err.message);
    if (err.code === 11000)
      return res.status(400).json({ message: 'An account with this email already exists.' });
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// ── Register Admin ────────────────────────────────────────────
router.post('/register-admin', async (req, res) => {
  try {
    const { name, email, password, adminKey } = req.body;

    // Debug — print what we received vs what .env has
    console.log('=== ADMIN REGISTER DEBUG ===');
    console.log('Received key  :', JSON.stringify(adminKey));
    console.log('Expected key  :', JSON.stringify(process.env.ADMIN_SECRET_KEY));
    console.log('Match?        :', adminKey === process.env.ADMIN_SECRET_KEY);
    console.log('============================');

    if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY)
      return res.status(403).json({ message: 'Invalid admin secret key.' });
    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields are required.' });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: 'Email already registered.' });

    const user = await User.create({ name: name.trim(), email: email.toLowerCase(), password, role: 'admin' });
    res.status(201).json({
      _id: user._id, name: user.name, email: user.email,
      role: user.role, token: generateToken(user._id),
    });
  } catch (err) {
    console.error('Register-admin error:', err.message);
    if (err.code === 11000)
      return res.status(400).json({ message: 'Email already registered.' });
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// ── Login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required.' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Incorrect email or password.' });
    if (!user.isActive)
      return res.status(403).json({ message: 'Account deactivated. Contact admin.' });

    res.json({
      _id: user._id, name: user.name, email: user.email,
      role: user.role, phone: user.phone, city: user.city,
      token: generateToken(user._id),
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// ── Get profile ───────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── Update profile ────────────────────────────────────────────
router.put('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (req.body.name)     user.name  = req.body.name.trim();
    if (req.body.phone)    user.phone = req.body.phone;
    if (req.body.city)     user.city  = req.body.city;
    if (req.body.password) user.password = req.body.password;
    const updated = await user.save();
    res.json({
      _id: updated._id, name: updated.name, email: updated.email,
      role: updated.role, phone: updated.phone, city: updated.city,
    });
  } catch (err) {
    console.error('Update profile error:', err.message);
    res.status(500).json({ message: 'Failed to update profile.' });
  }
});

module.exports = router;