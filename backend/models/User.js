/**
 * User model — supports two auth methods: HandCash (handle) and email/password.
 * A single account can have either, both, or be promoted to admin.
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  // --- Identity ---
  email: {
    type: String,
    lowercase: true,
    trim: true,
    sparse: true,           // allow null but unique when present
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
  },
  passwordHash: { type: String, select: false }, // bcrypt; never returned by default

  // HandCash identity
  handcashHandle: { type: String, trim: true, sparse: true, unique: true },
  handcashId:     { type: String, sparse: true, unique: true },
  handcashAvatar: { type: String },

  // --- Profile ---
  name:     { type: String, trim: true, maxlength: 80 },
  location: { type: String, trim: true, maxlength: 80 },
  avatar:   { type: String },           // Cloudinary URL
  bio:      { type: String, maxlength: 300 },

  // --- Role / status ---
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
    index: true,
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'deleted'],
    default: 'active',
    index: true,
  },
  isVerified: { type: Boolean, default: false }, // owner verification

  // --- Aggregates (denormalized for fast reads) ---
  stats: {
    rentalsAsRenter: { type: Number, default: 0 },
    rentalsAsOwner:  { type: Number, default: 0 },
    rating:          { type: Number, default: 0 },
    reviewCount:     { type: Number, default: 0 },
  },

  lastLoginAt: { type: Date },
}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      delete ret.passwordHash;
      delete ret.__v;
      return ret;
    },
  },
});

// (Indexes for email + handcashHandle come from the `unique: true` declarations above.)

// --- Password helpers ---
UserSchema.methods.setPassword = async function(plain) {
  if (!plain || plain.length < 6) throw new Error('Password must be at least 6 characters');
  this.passwordHash = await bcrypt.hash(plain, 12);
};
UserSchema.methods.checkPassword = async function(plain) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(plain, this.passwordHash);
};

// --- Convenience getter ---
UserSchema.virtual('displayName').get(function() {
  return this.handcashHandle || this.name || (this.email && this.email.split('@')[0]) || 'User';
});

module.exports = mongoose.model('User', UserSchema);
