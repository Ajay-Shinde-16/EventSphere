require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Event = require('./models/Event');
const Booking = require('./models/Booking');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');
};

const seedData = async () => {
  await connectDB();
  await User.deleteMany({});
  await Event.deleteMany({});
  await Booking.deleteMany({});

  const admin = await User.create({ name: 'Admin EventSphere', email: 'admin@eventsphere.com', password: 'admin123', role: 'admin' });
  const organizer = await User.create({ name: 'Ajay Shinde', email: 'org@eventsphere.com', password: 'org123', role: 'organizer', city: 'Bangalore' });
  const attendee = await User.create({ name: 'Rahul Verma', email: 'user@eventsphere.com', password: 'user123', role: 'attendee', city: 'Bangalore' });

  const events = await Event.insertMany([
    {
      title: 'Tech Conference 2026', description: 'A major technology conference featuring 50+ speakers, workshops, hackathons, and networking sessions. Join the brightest minds in tech for two days of innovation.', category: 'Tech', date: new Date('2026-07-15'), time: '10:00 AM', venue: 'NIMHANS Convention Centre', city: 'Bangalore',
      tiers: [{ name: 'VIP', price: 2999, seats: 100, bookedSeats: 45, color: '#9B51E0' }, { name: 'General', price: 999, seats: 400, bookedSeats: 155, color: '#00F2FE' }],
      totalSeats: 500, bookedSeats: 200, isFree: false, organizer: organizer._id, status: 'approved', isHighlighted: true, tags: ['AI', 'Web3', 'Cloud'],
    },
    {
      title: 'Summer Music Fest 2026', description: '20+ artists across 3 stages! Food stalls, art installations, and an unforgettable night under the stars. The biggest music festival of the year.', category: 'Music', date: new Date('2026-08-05'), time: '6:00 PM', venue: 'Palace Grounds', city: 'Bangalore',
      tiers: [{ name: 'VIP', price: 4999, seats: 200, bookedSeats: 180, color: '#9B51E0' }, { name: 'General', price: 1499, seats: 2800, bookedSeats: 2620, color: '#00F2FE' }],
      totalSeats: 3000, bookedSeats: 2800, isFree: false, organizer: organizer._id, status: 'approved', tags: ['Music', 'Festival', 'Live'],
    },
    {
      title: 'City Marathon 2026', description: 'Run through the heart of Bangalore! 5K, 10K, and 21K categories. Open to all fitness levels. Professional timing, medals, and refreshments.', category: 'Sports', date: new Date('2026-09-10'), time: '5:00 AM', venue: 'Cubbon Park', city: 'Bangalore',
      tiers: [{ name: 'VIP Run', price: 1499, seats: 200, bookedSeats: 80, color: '#9B51E0' }, { name: '10K', price: 499, seats: 800, bookedSeats: 420, color: '#00F2FE' }, { name: '5K', price: 299, seats: 1000, bookedSeats: 300, color: '#05FF9B' }],
      totalSeats: 2000, bookedSeats: 800, isFree: false, organizer: organizer._id, status: 'approved', tags: ['Running', 'Fitness', 'Marathon'],
    },
    {
      title: 'Street Food Festival', description: '100+ food stalls from across India! Live cooking demos, chef masterclasses, and the best street food you have ever tasted. Free entry for everyone.', category: 'Food', date: new Date('2026-10-01'), time: '12:00 PM', venue: 'UB City Mall', city: 'Bangalore',
      tiers: [{ name: 'Free Entry', price: 0, seats: 1000, bookedSeats: 1000, color: '#05FF9B' }],
      totalSeats: 1000, bookedSeats: 1000, isFree: true, organizer: organizer._id, status: 'approved', tags: ['Food', 'Free', 'Festival'],
    },
    {
      title: 'AI & Future Summit', description: 'Explore the future of Artificial Intelligence, Machine Learning, and robotics. Featuring live demos of cutting-edge AI models and expert panels.', category: 'Tech', date: new Date('2026-11-20'), time: '9:00 AM', venue: 'IISc Campus', city: 'Bangalore',
      tiers: [{ name: 'Premium', price: 3999, seats: 50, bookedSeats: 20, color: '#9B51E0' }, { name: 'Standard', price: 1299, seats: 450, bookedSeats: 150, color: '#00F2FE' }],
      totalSeats: 500, bookedSeats: 170, isFree: false, organizer: organizer._id, status: 'approved', tags: ['AI', 'ML', 'Robotics'],
    },
  ]);

  console.log(`✅ Seeded: 1 admin, 1 organizer, 1 attendee, ${events.length} events`);
  console.log('\n🔐 Demo Credentials:');
  console.log('  Admin:     admin@eventsphere.com / admin123');
  console.log('  Organizer: org@eventsphere.com / org123');
  console.log('  Attendee:  user@eventsphere.com / user123');
  console.log('  Admin Key: ES@Admin#2026$CDAC');
  process.exit(0);
};

seedData().catch(err => { console.error(err); process.exit(1); });
