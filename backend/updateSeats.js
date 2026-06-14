require('dotenv').config();
const mongoose = require('mongoose');

async function update() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  
  // Show all events
  const events = await db.collection('events').find({}).toArray();
  console.log(`Found ${events.length} events:`);
  events.forEach(e => {
    console.log(`  ID: ${e._id}`);
    console.log(`  Title: ${e.title}`);
    console.log(`  Tiers:`, e.tiers?.map(t=>`${t.name}:${t.seats}`).join(', '));
    console.log('');
  });

  // Update ALL events — set VIP=120, General=420
  for (const ev of events) {
    if (!ev.tiers?.length) continue;
    const newTiers = ev.tiers.map(t => {
      if (t.name?.toLowerCase().includes('vip'))     return { ...t, seats: 120 };
      if (t.name?.toLowerCase().includes('general')) return { ...t, seats: 420 };
      return t;
    });
    const newTotal = newTiers.reduce((s,t) => s + (t.seats||0), 0);
    
    await db.collection('events').updateOne(
      { _id: ev._id },
      { $set: { tiers: newTiers, totalSeats: newTotal } }
    );
    console.log(`✅ "${ev.title}" updated → Total: ${newTotal}`);
  }

  await mongoose.disconnect();
  console.log('\nAll done! Refresh the browser.');
}

update().catch(e => { console.error('ERROR:', e.message); process.exit(1); });