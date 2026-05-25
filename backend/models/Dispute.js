/**
 * Dispute model — opened when renter or owner contests a rental.
 * Admin reviews evidence and decides how the deposit is split.
 */
const mongoose = require('mongoose');

const TYPES    = ['damage', 'late_return', 'no_show', 'payment', 'other'];
const STATUSES = ['open', 'reviewing', 'resolved', 'rejected'];

const DisputeSchema = new mongoose.Schema({
  rental:    { type: mongoose.Schema.Types.ObjectId, ref: 'Rental', required: true, index: true },
  openedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
  against:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },

  type:        { type: String, enum: TYPES, required: true },
  description: { type: String, required: true, minlength: 30, maxlength: 1000 },

  // Evidence — Cloudinary URLs
  evidence: [{
    url:      { type: String, required: true },
    publicId: { type: String, required: true },
  }],

  // Admin response
  status:           { type: String, enum: STATUSES, default: 'open', index: true },
  adminNotes:       { type: String, maxlength: 1000 },
  depositReleaseTo: { type: String, enum: ['owner', 'renter', 'split', 'pending'], default: 'pending' },
  depositOwnerShare:  { type: Number, default: 0, min: 0 },   // PHP amount
  depositRenterShare: { type: Number, default: 0, min: 0 },   // PHP amount
  resolvedAt:       { type: Date },
  resolvedBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

DisputeSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Dispute', DisputeSchema);
module.exports.TYPES = TYPES;
module.exports.STATUSES = STATUSES;
