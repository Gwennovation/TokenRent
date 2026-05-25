/**
 * Item model — equipment listed for rent.
 */
const mongoose = require('mongoose');

const CATEGORIES = ['construction', 'electronics', 'photography', 'outdoor', 'vehicles', 'events', 'other'];
const CONDITIONS = ['Like New', 'Excellent', 'Good', 'Fair'];
const STATUSES   = ['available', 'rented', 'overdue', 'unavailable'];

const ItemSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  title:       { type: String, required: true, trim: true, maxlength: 80 },
  description: { type: String, required: true, trim: true, minlength: 30, maxlength: 600 },
  category:    { type: String, enum: CATEGORIES, required: true, index: true },
  condition:   { type: String, enum: CONDITIONS, required: true },

  // Pricing (PHP)
  dailyRate:       { type: Number, required: true, min: 1 },
  securityDeposit: { type: Number, required: true, min: 0 },

  // Rental constraints
  minDays: { type: Number, default: 1, min: 1 },
  maxDays: { type: Number, default: 30, min: 1 },

  // Availability window (optional — if blank, always available)
  availableFrom: { type: Date },
  availableTo:   { type: Date },

  // Cloudinary photo URLs (with public_id so we can delete later)
  photos: [{
    url:      { type: String, required: true },
    publicId: { type: String, required: true },
  }],

  status: { type: String, enum: STATUSES, default: 'available', index: true },

  // Aggregates
  stats: {
    rating:      { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    rentalCount: { type: Number, default: 0 },
  },
}, {
  timestamps: true,
});

// --- Indexes for search/filter ---
ItemSchema.index({ title: 'text', description: 'text' });
ItemSchema.index({ category: 1, status: 1 });
ItemSchema.index({ createdAt: -1 });

// --- Convenience: cover photo ---
ItemSchema.virtual('coverPhoto').get(function() {
  return this.photos && this.photos.length ? this.photos[0].url : null;
});

ItemSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Item', ItemSchema);
module.exports.CATEGORIES = CATEGORIES;
module.exports.CONDITIONS = CONDITIONS;
module.exports.STATUSES   = STATUSES;
