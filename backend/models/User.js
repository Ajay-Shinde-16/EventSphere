const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');

const userSchema = new mongoose.Schema({
  name:              { type: String, required: true, trim: true },
  email:             { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:          { type: String, required: true, minlength: 6 },
  role:              { type: String, enum: ['attendee', 'organizer', 'admin'], default: 'attendee' },
  phone:             { type: String, default: '' },
  city:              { type: String, default: '' },
  avatar:            { type: String, default: '' },
  isActive:          { type: Boolean, default: true },
  resetPasswordToken:  { type: String },
  resetPasswordExpiry: { type: Date },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

userSchema.methods.generateResetToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken  = crypto.createHash('sha256').update(token).digest('hex');
  this.resetPasswordExpiry = Date.now() + 30 * 60 * 1000; // 30 minutes
  return token; // raw token sent in email
};

module.exports = mongoose.model('User', userSchema);
