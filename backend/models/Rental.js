/**
 * Rental model — a booking from renter to owner. Tracks state machine:
 * pending → accepted → active → returned → completed   (happy path)
 *          → declined / cancelled / overdue / disputed (branches)
 */
const mongoose = require('mongoose');

const STATUSES = ['pending', 'accepted', 'declined', 'cancelled', 'active', 'overdue', 'returned', 'completed', 'disputed'];
const PLATFORM_FEE_PCT = 0.05;

const RentalSchema = new mongoose.Schema({
  item:   { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true, index: true },
  owner:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  renter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  // Dates
  startDate: { type: Date, required: true },
  endDate:   { type: Date, required: true },

  // Snapshot of rates at time of booking (in case the listing changes later)
  dailyRate:       { type: Number, required: true, min: 0 },
  securityDeposit: { type: Number, required: true, min: 0 },

  // Calculated totals
  days:        { type: Number, required: true, min: 1 },
  subtotal:    { type: Number, required: true, min: 0 },
  platformFee: { type: Number, required: true, min: 0 },
  total:       { type: Number, required: true, min: 0 },

  status: { type: String, enum: STATUSES, default: 'pending', index: true },

  // Renter-supplied notes
  purpose: { type: String, maxlength: 80 },
  notes:   { type: String, maxlength: 280 },

  // Lifecycle audit trail
  acceptedAt:  { type: Date },
  declinedAt:  { type: Date },
  cancelledAt: { type: Date },
  pickedUpAt:  { type: Date },
  returnedAt:  { type: Date },

  // Optional review
  review: {
    rating:    { type: Number, min: 1, max: 5 },
    comment:   { type: String, maxlength: 600 },
    createdAt: { type: Date },
  },
}, {
  timestamps: true,
});

// --- Indexes ---
RentalSchema.index({ owner: 1, status: 1 });
RentalSchema.index({ renter: 1, status: 1 });
RentalSchema.index({ item: 1, startDate: 1, endDate: 1 });

// --- Static helper: compute totals from inputs ---
RentalSchema.statics.computeTotals = function({ dailyRate, securityDeposit, startDate, endDate }) {
  const days = Math.max(1, Math.round((new Date(endDate) - new Date(startDate)) / 86400000));
  const subtotal = days * dailyRate;
  const platformFee = Math.round(subtotal * PLATFORM_FEE_PCT);
  const total = subtotal + platformFee + securityDeposit;
  return { days, subtotal, platformFee, total };
};

module.exports = mongoose.model('Rental', RentalSchema);
module.exports.STATUSES = STATUSES;
module.exports.PLATFORM_FEE_PCT = PLATFORM_FEE_PCT;
