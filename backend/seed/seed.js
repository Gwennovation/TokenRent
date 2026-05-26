/**
 * Seed sample items so the marketplace isn't empty on first run.
 * Usage:   npm run seed
 *
 * Idempotent — won't duplicate if items already exist for the seed users.
 * Creates 3 demo owners spread across Metro Manila so items look organic.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Item = require('../models/Item');

/* ── Unsplash photo IDs ────────────────────────────────────────────── */
// Format: https://images.unsplash.com/photo-{id}?auto=format&fit=crop&w=1200&q=80
const photo = id =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`;

/* ── Demo users ────────────────────────────────────────────────────── */
const DEMO_USERS = [
  { email: 'carlo@tokenrent.local',   name: 'Carlo Reyes',    location: 'Makati City',    handle: '$carloreyes'    },
  { email: 'mia@tokenrent.local',     name: 'Mia Santos',     location: 'BGC, Taguig',    handle: '$miasantos'     },
  { email: 'jomari@tokenrent.local',  name: 'Jomari Dela Cruz', location: 'Quezon City',  handle: '$jomaridc'      },
];

/* ── Seed items ────────────────────────────────────────────────────── */
// owner: 0 | 1 | 2  → index into DEMO_USERS array
const SAMPLE_ITEMS = [
  /* ── PHOTOGRAPHY ── */
  {
    owner: 0, category: 'photography', condition: 'Like New',
    title: 'Sony A7 IV Full-Frame Camera Kit',
    description: 'Professional mirrorless full-frame camera. Includes 28-70mm kit lens, extra battery, 128GB SD card, and padded carry case. Perfect for events, portraits, and travel shoots.',
    dailyRate: 1800, securityDeposit: 12000,
    photo: '1502920917128-1aa500764cbd',
    rating: 4.9, rentalCount: 14,
  },
  {
    owner: 1, category: 'photography', condition: 'Excellent',
    title: 'DJI Mavic 3 Pro Drone',
    description: 'Triple-camera 4K aerial drone with 46-min flight time, 3-axis gimbal, and obstacle avoidance. Includes 3 batteries, ND filter set, and hard-shell carry case.',
    dailyRate: 2500, securityDeposit: 20000,
    photo: '1473968512647-3e447244af8f',
    rating: 4.8, rentalCount: 9,
  },
  {
    owner: 2, category: 'photography', condition: 'Good',
    title: '3-Light Studio Strobe Kit',
    description: 'Complete 3-point lighting setup: two 600W monolights, one 300W hair light, all softboxes and stands included. Ideal for portrait studios, product shoots, or home setups.',
    dailyRate: 900, securityDeposit: 5000,
    photo: '1605487903301-a8be21e7ec10',
    rating: 4.6, rentalCount: 22,
  },
  {
    owner: 0, category: 'photography', condition: 'Like New',
    title: 'GoPro Hero 12 Action Camera Bundle',
    description: 'Waterproof 5.3K action camera with dive housing, suction-cup mount, chest strap, and helmet mount. 2 batteries, dual charger, and 64GB card included.',
    dailyRate: 600, securityDeposit: 4000,
    photo: '1593508512255-86ab42a8e620',
    rating: 4.7, rentalCount: 31,
  },

  /* ── ELECTRONICS ── */
  {
    owner: 1, category: 'electronics', condition: 'Like New',
    title: 'MacBook Pro 16" M3 Pro',
    description: 'Apple M3 Pro chip, 36GB unified memory, 1TB SSD. Comes with 96W USB-C charger and sleeve. Ideal for video editing, 3D rendering, or software development.',
    dailyRate: 2200, securityDeposit: 18000,
    photo: '1517336714731-489689fd1ca8',
    rating: 5.0, rentalCount: 7,
  },
  {
    owner: 2, category: 'electronics', condition: 'Excellent',
    title: 'iPad Pro 12.9" + Apple Pencil',
    description: 'iPad Pro M2, 256GB WiFi + Cellular, 12.9-inch Liquid Retina display. Includes Apple Pencil 2nd gen, Magic Keyboard folio, and USB-C hub.',
    dailyRate: 1100, securityDeposit: 8000,
    photo: '1544244015-0df4cec50f5b',
    rating: 4.8, rentalCount: 11,
  },
  {
    owner: 0, category: 'electronics', condition: 'Good',
    title: 'Epson 4K Laser Projector',
    description: '4000-lumen laser projector, native 4K, HDMI + wireless screen mirroring. Ideal for presentations, film nights, and events. Includes 120-inch projection screen.',
    dailyRate: 1400, securityDeposit: 6000,
    photo: '1611532736597-de2d4265fba3',
    rating: 4.5, rentalCount: 18,
  },

  /* ── CONSTRUCTION ── */
  {
    owner: 2, category: 'construction', condition: 'Good',
    title: 'Honda 5500W Gasoline Generator',
    description: 'Quiet-series generator (68 dB at 7m), 5500W rated, 8-hour runtime on full tank. Includes two 30A outlets, two 15A outlets. Ideal for events, construction sites, or power outages.',
    dailyRate: 1200, securityDeposit: 5000,
    photo: '1620283085439-39620a1e21c4',
    rating: 4.4, rentalCount: 26,
  },
  {
    owner: 1, category: 'construction', condition: 'Excellent',
    title: 'Hilti Rotary Hammer Drill',
    description: 'Professional SDS-Plus rotary hammer, 1100W, 3-function (drilling, hammer drilling, chisel). Includes 8-piece SDS-plus bit set, chisel, depth gauge, and carry case.',
    dailyRate: 700, securityDeposit: 3500,
    photo: '1572981779307-38b8cabb2407',
    rating: 4.7, rentalCount: 34,
  },
  {
    owner: 0, category: 'construction', condition: 'Good',
    title: '1000 PSI Electric Pressure Washer',
    description: '2000 PSI electric pressure washer, 1800W motor, 8m high-pressure hose, 4 quick-connect nozzles. Excellent for cars, driveways, fences, and garden furniture.',
    dailyRate: 550, securityDeposit: 2000,
    photo: '1581094289810-adf5d25690e3',
    rating: 4.3, rentalCount: 19,
  },

  /* ── VEHICLES ── */
  {
    owner: 2, category: 'vehicles', condition: 'Excellent',
    title: 'Honda Click 160 Scooter',
    description: 'Well-maintained 160cc scooter. Comes with 2 helmets (full-face), phone mount, and under-seat storage. Valid ID required. Daily rate exclusive of fuel.',
    dailyRate: 800, securityDeposit: 5000,
    photo: '1558618666-fcd25c85cd64',
    rating: 4.6, rentalCount: 42,
  },
  {
    owner: 1, category: 'vehicles', condition: 'Good',
    title: 'Mountain Bike — Trek Marlin 7',
    description: '27.5" full-suspension mountain bike, medium frame. Hydraulic disc brakes, 24-speed drivetrain. Comes with helmet and basic toolkit. Great for UP Diliman, La Mesa Eco Park, and weekend trails.',
    dailyRate: 500, securityDeposit: 3000,
    photo: '1485965120184-e220f721d03e',
    rating: 4.5, rentalCount: 28,
  },

  /* ── EVENTS ── */
  {
    owner: 0, category: 'events', condition: 'Excellent',
    title: 'Complete PA System (300-Person)',
    description: 'Professional sound system: 2x JBL 15" mains, 1x 18" subwoofer, 16-channel Behringer mixer, 2 wireless mics, 3 monitor wedges, all stands and cabling. Suitable for indoor and outdoor events.',
    dailyRate: 3500, securityDeposit: 15000,
    photo: '1545454675-3531b543be5d',
    rating: 4.9, rentalCount: 16,
  },
  {
    owner: 2, category: 'events', condition: 'Good',
    title: 'Banquet Tables & Chairs Set (50 pax)',
    description: 'Event package: 10 folding banquet tables (6ft) + 50 monobloc chairs. Delivery available within Metro Manila for an additional fee. Minimum 2-day rental.',
    dailyRate: 2500, securityDeposit: 3000,
    photo: '1414235077428-338989a2e8c0',
    rating: 4.4, rentalCount: 23,
    minDays: 2,
  },
  {
    owner: 1, category: 'events', condition: 'Excellent',
    title: 'Photo Booth with Backdrop Kit',
    description: 'Selfie photo booth ring light (2m diameter), 3 interchangeable backdrops (floral, neon, neutral), remote shutter, tablet stand, and prop kit. Great for parties and corporate events.',
    dailyRate: 1500, securityDeposit: 4000,
    photo: '1492684223066-81342ee5ff30',
    rating: 4.8, rentalCount: 37,
  },

  /* ── OUTDOOR ── */
  {
    owner: 0, category: 'outdoor', condition: 'Excellent',
    title: '6-Person Glamping Tent',
    description: 'Large family/group dome tent with full rainfly, mesh windows, and gear loft. Stakes, guylines, and carrying bag included. Fits 2 queen air mattresses. Perfect for Batangas beach trips.',
    dailyRate: 850, securityDeposit: 3500,
    photo: '1504280390367-361c6d9f38f4',
    rating: 4.7, rentalCount: 21,
  },
  {
    owner: 2, category: 'outdoor', condition: 'Good',
    title: 'Kayak — 2-Person Sit-On-Top',
    description: 'Stable, beginner-friendly sit-on-top kayak. Load capacity 200kg. Two paddles, two life vests, and waterproof dry bags included. Perfect for Taal Lake, Subic, and Batangas.',
    dailyRate: 1000, securityDeposit: 4000,
    photo: '1506905925346-21bda4d32df4',
    rating: 4.6, rentalCount: 15,
  },
];

/* ── Helper ─────────────────────────────────────────────────────────── */
async function findOrCreateUser(userData) {
  let user = await User.findOne({ email: userData.email });
  if (!user) {
    user = new User({
      email:      userData.email,
      name:       userData.name,
      location:   userData.location,
      isVerified: true,
    });
    await user.setPassword('tokenrent-seed-2025');
    await user.save();
    console.log(`  Created demo user: ${userData.email}`);
  }
  return user;
}

/* ── Main ────────────────────────────────────────────────────────────── */
async function run() {
  await connectDB();

  // Create / find all demo owners
  const users = await Promise.all(DEMO_USERS.map(findOrCreateUser));

  // Count existing items owned by any demo user
  const ownerIds = users.map(u => u._id);
  const existing = await Item.countDocuments({ owner: { $in: ownerIds } });
  if (existing > 0) {
    console.log(`  ${existing} items already exist for demo users — skipping seed.`);
    console.log('  To re-seed, delete the demo items first or drop the items collection.');
    return mongoose.connection.close();
  }

  // Build and insert
  const docs = SAMPLE_ITEMS.map(it => ({
    owner:           users[it.owner]._id,
    title:           it.title,
    description:     it.description,
    category:        it.category,
    condition:       it.condition,
    dailyRate:       it.dailyRate,
    securityDeposit: it.securityDeposit,
    minDays:         it.minDays || 1,
    maxDays:         30,
    photos: [{
      url:      photo(it.photo),
      publicId: `seed-${it.photo}`,
    }],
    status: 'available',
    stats: {
      rating:      it.rating      || 0,
      reviewCount: it.rentalCount ? Math.ceil(it.rentalCount * 0.6) : 0,
      rentalCount: it.rentalCount || 0,
    },
  }));

  await Item.insertMany(docs);
  console.log(`  Seeded ${docs.length} items across ${users.length} demo owners.`);
  console.log('  Demo user logins: carlo@, mia@, jomari@ — all @tokenrent.local');
  console.log('  Password for all demo accounts: tokenrent-seed-2025');
  mongoose.connection.close();
}

run().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
