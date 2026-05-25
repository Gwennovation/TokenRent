/**
 * Message model — one message in a rental's chat thread.
 * Only the rental's owner and renter may read or write.
 */
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  rental: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rental',
    required: true,
    index: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
}, { timestamps: true });

// Compound index for fast thread fetches sorted by time
MessageSchema.index({ rental: 1, createdAt: 1 });

module.exports = mongoose.model('Message', MessageSchema);
