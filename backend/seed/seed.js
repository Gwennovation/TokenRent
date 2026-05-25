/**
 * Seed sample items so the marketplace isn't empty on first run.
 * Usage:   npm run seed
 *
 * Idempotent — won't duplicate if items already exist for the seed user.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Item = require('../models/Item');

const SAMPLE_ITEMS = [
  { title: 'Industrial Drill Press',  category: 'construction', condition: 'Excellent', dailyRate: 850,  securityDeposit: 2500, photo: '1572981779307-38b8cabb2407', description: 'Heavy-duty drill press with variable-speed motor and depth-locking handle. Includes 10 drill bits (3mm–25mm), safety guard, and work lamp.' },
  { title: 'DSLR Camera Kit',         category: 'photography',  condition: 'Like New',  dailyRate: 1200, securityDeposit: 5000, photo: '1502920917128-1aa500764cbd', description: 'Professional DSLR with two lenses (24-70mm and 70-200mm), tripod, and carrying case. Battery and 64GB SD card included.' },
  { title: 'Mountain Bike',           category: 'outdoor',      condition: 'Good',      dailyRate: 450,  securityDeposit: 3000, photo: '1485965120184-e220f721d03e', description: 'Full-suspension mountain bike, size M. Recently tuned, hydraulic disc brakes, dropper post. Helmet included.' },
  { title: '4-Person Camping Tent',   category: 'outdoor',      condition: 'Excellent', dailyRate: 300,  securityDeposit: 1500, photo: '1504280390367-361c6d9f38f4', description: 'Lightweight 4-person tent with rainfly, footprint, and stakes. Easy 5-minute setup. Used twice.' },
  { title: 'Pressure Washer',         category: 'construction', condition: 'Good',      dailyRate: 600,  securityDeposit: 2000, photo: '1581094289810-adf5d25690e3', description: 'Gas-powered pressure washer, 3000 PSI. Includes 3 nozzles and 50 ft hose. Excellent for driveways and decks.' },
  { title: 'PA Sound System',         category: 'events',       condition: 'Excellent', dailyRate: 1500, securityDeposit: 6000, photo: '1545454675-3531b543be5d', description: 'Complete PA system: two speakers, mixer, mic, all cables. Suitable for events up to 150 people.' },
  { title: 'MacBook Pro 16"',         category: 'electronics',  condition: 'Like New',  dailyRate: 2000, securityDeposit: 15000, photo: '1517336714731-489689fd1ca8', description: 'M2 Pro, 32GB RAM, 1TB SSD. Perfect for video editing, design, or development work.' },
  { title: 'Folding Banquet Tables',  category: 'events',       condition: 'Good',      dailyRate: 200,  securityDeposit: 800,  photo: '1414235077428-338989a2e8c0', description: 'Set of 4 folding banquet tables, 8 ft each. Seats up to 32 people total. Light wear from previous events.' },
  { title: 'Drone (4K)',              category: 'photography',  condition: 'Excellent', dailyRate: 1100, securityDeposit: 8000, photo: '1473968512647-3e447244af8f', description: '4K aerial drone with 30-min flight time, 3-axis gimbal, and obstacle avoidance. Includes 3 batteries and carrying case.' },
  { title: 'Power Generator',         category: 'construction', condition: 'Good',      dailyRate: 900,  securityDeposit: 3000, photo: '1620283085439-39620a1e21c4', description: '5500W portable generator. Runs on gasoline, ~8 hour runtime per tank. Quiet model — 65 dB at 25 ft.' },
];

async function run() {
  await connectDB();

  // Find or create a "demo" owner so seed items have a parent.
  let demoUser = await User.findOne({ email: 'demo@tokenrent.local' });
  if (!demoUser) {
    demoUser = new User({
      email: 'demo@tokenrent.local',
      name: 'Demo Owner',
      location: 'Makati City',
      isVerified: true,
    });
    await demoUser.setPassword('demo-password-12345');
    await demoUser.save();
    console.log('  Created demo user (login email: demo@tokenrent.local / pw: demo-password-12345)');
  }

  // Skip if items already exist
  const existing = await Item.countDocuments({ owner: demoUser._id });
  if (existing > 0) {
    console.log(`  ${existing} items already exist for demo user — skipping seed.`);
    return mongoose.connection.close();
  }

  // Insert all sample items
  const docs = SAMPLE_ITEMS.map(it => ({
    owner: demoUser._id,
    title: it.title,
    description: it.description,
    category: it.category,
    condition: it.condition,
    dailyRate: it.dailyRate,
    securityDeposit: it.securityDeposit,
    photos: [{
      url: `https://images.unsplash.com/photo-${it.photo}?auto=format&fit=crop&w=1200&q=80`,
      publicId: `seed-${it.photo}`, // not a real Cloudinary publicId; safe since seed only
    }],
    status: 'available',
  }));
  await Item.insertMany(docs);
  console.log(`  Seeded ${docs.length} items.`);
  mongoose.connection.close();
}

run().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
