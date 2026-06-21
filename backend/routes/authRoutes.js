const express  = require('express');
const router   = express.Router();
const crypto   = require('crypto');
const rateLimit = require('express-rate-limit');
const User     = require('../models/User');
const generateToken = require('../utils/generateToken');
const { protect }   = require('../middleware/authMiddleware');
const { sendEmail, forgotPasswordEmail } = require('../utils/sendEmail');

// Brute-force protection: without this, anyone could script unlimited
// password guesses against any account. 8 attempts per 15 minutes per IP
// is generous enough for a real user who mistypes their password a few
// times, but stops automated guessing dead.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: { message: 'Too many login attempts. Please wait 15 minutes and try again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Looser limit for registration — mainly to stop scripted account-creation
// spam, not to annoy genuine users who rarely register more than once.
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { message: 'Too many registration attempts from this network. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Register ──────────────────────────────────────────────────
router.post('/register', registerLimiter, async (req, res) => {
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
    if (err.code === 11000)
      return res.status(400).json({ message: 'An account with this email already exists.' });
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// ── Register Admin ────────────────────────────────────────────
router.post('/register-admin', async (req, res) => {
  try {
    const { name, email, password, adminKey } = req.body;
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
    if (err.code === 11000)
      return res.status(400).json({ message: 'Email already registered.' });
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// ── Login ─────────────────────────────────────────────────────
router.post('/login', loginLimiter, async (req, res) => {
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
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// ── Get profile ───────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -resetPasswordToken -resetPasswordExpiry');
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
    res.status(500).json({ message: 'Failed to update profile.' });
  }
});

// ── Forgot Password — send reset email ────────────────────────
router.post('/forgot-password', loginLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const user = await User.findOne({ email: email.toLowerCase() });
    // Always respond success — don't reveal whether email exists
    if (!user) {
      return res.json({ message: 'If that email is registered, a reset link has been sent.' });
    }

    // Generate token and save hashed version
    const rawToken = user.generateResetToken();
    await user.save({ validateBeforeSave: false });

    // Build reset URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password/${rawToken}`;

    // Send email
    try {
      const emailOpts = forgotPasswordEmail(user, resetUrl);
      await sendEmail(emailOpts);
      console.log(`📧 Password reset email sent to ${user.email}`);
    } catch (emailErr) {
      // If email fails, clear the token so user can try again
      user.resetPasswordToken  = undefined;
      user.resetPasswordExpiry = undefined;
      await user.save({ validateBeforeSave: false });
      console.error('Reset email failed:', emailErr.message);
      return res.status(500).json({ message: 'Failed to send reset email. Check your email configuration.' });
    }

    res.json({ message: 'If that email is registered, a reset link has been sent.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// ── Reset Password — verify token and set new password ────────
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });

    // Hash the incoming token to match what's stored
    const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken:  hashed,
      resetPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: 'Reset link is invalid or has expired. Please request a new one.' });

    user.password            = password;
    user.resetPasswordToken  = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    res.json({ message: 'Password reset successful! You can now log in with your new password.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

module.exports = router;