/**
 * Messages controller — list and send messages for a rental thread.
 * Access: rental's owner or renter only (checked on every request).
 */
const Message = require('../models/Message');
const Rental  = require('../models/Rental');

/** Returns the rental if the requesting user is the owner or renter, else null. */
async function assertAccess(rentalId, userId) {
  const rental = await Rental.findById(rentalId).select('owner renter');
  if (!rental) return null;
  const uid = userId.toString();
  if (uid !== rental.owner.toString() && uid !== rental.renter.toString()) return null;
  return rental;
}

/* ---------- GET /api/rentals/:id/messages ---------- */
exports.list = async (req, res, next) => {
  try {
    const rental = await assertAccess(req.params.id, req.user._id);
    if (!rental) return res.status(403).json({ error: 'Access denied' });

    const messages = await Message.find({ rental: req.params.id })
      .populate('sender', 'name handcashHandle')
      .sort({ createdAt: 1 });

    res.json({ messages });
  } catch (err) { next(err); }
};

/* ---------- POST /api/rentals/:id/messages ---------- */
exports.send = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    const rental = await assertAccess(req.params.id, req.user._id);
    if (!rental) return res.status(403).json({ error: 'Access denied' });

    const message = await Message.create({
      rental: req.params.id,
      sender: req.user._id,
      text:   text.trim(),
    });

    await message.populate('sender', 'name handcashHandle');
    res.status(201).json({ message });
  } catch (err) { next(err); }
};
