/**
 * Rentals controller — booking lifecycle.
 * State machine: pending → accepted → active → returned → completed
 * Branches: declined, cancelled, overdue, disputed
 */
const Rental = require('../models/Rental');
const Item   = require('../models/Item');

/* ---------- POST /api/rentals (renter creates booking request) ---------- */
exports.create = async (req, res, next) => {
  try {
    const { itemId, startDate, endDate, purpose, notes } = req.body;
    if (!itemId || !startDate || !endDate) return res.status(400).json({ error: 'itemId, startDate, endDate required' });

    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.owner.equals(req.user._id)) return res.status(400).json({ error: "Can't rent your own item" });
    if (item.status !== 'available') return res.status(409).json({ error: 'Item not available' });

    const s = new Date(startDate);
    const e = new Date(endDate);
    if (e <= s) return res.status(400).json({ error: 'End date must be after start date' });

    const totals = Rental.computeTotals({
      dailyRate: item.dailyRate,
      securityDeposit: item.securityDeposit,
      startDate: s, endDate: e,
    });

    const rental = await Rental.create({
      item:   item._id,
      owner:  item.owner,
      renter: req.user._id,
      startDate: s, endDate: e,
      dailyRate: item.dailyRate,
      securityDeposit: item.securityDeposit,
      ...totals,
      purpose, notes,
      status: 'pending',
    });
    res.status(201).json({ rental });
  } catch (err) { next(err); }
};

/* ---------- GET /api/rentals/mine (filterable by role) ---------- */
exports.mine = async (req, res, next) => {
  try {
    const { as = 'renter', status } = req.query; // as=renter|owner
    const filter = as === 'owner' ? { owner: req.user._id } : { renter: req.user._id };
    if (status) filter.status = status;

    const rentals = await Rental.find(filter)
      .populate('item', 'title photos category')
      .populate('owner', 'name handcashHandle')
      .populate('renter', 'name handcashHandle')
      .sort({ createdAt: -1 });
    res.json({ rentals });
  } catch (err) { next(err); }
};

/* ---------- PATCH /api/rentals/:id/accept (owner) ---------- */
exports.accept = async (req, res, next) => {
  try {
    const rental = await Rental.findById(req.params.id);
    if (!rental) return res.status(404).json({ error: 'Rental not found' });
    if (!rental.owner.equals(req.user._id)) return res.status(403).json({ error: 'Not your rental' });
    if (rental.status !== 'pending') return res.status(409).json({ error: `Cannot accept (status: ${rental.status})` });
    rental.status = 'accepted';
    rental.acceptedAt = new Date();
    await rental.save();
    await Item.findByIdAndUpdate(rental.item, { status: 'rented' });
    res.json({ rental });
  } catch (err) { next(err); }
};

/* ---------- PATCH /api/rentals/:id/decline (owner) ---------- */
exports.decline = async (req, res, next) => {
  try {
    const rental = await Rental.findById(req.params.id);
    if (!rental) return res.status(404).json({ error: 'Rental not found' });
    if (!rental.owner.equals(req.user._id)) return res.status(403).json({ error: 'Not your rental' });
    if (rental.status !== 'pending') return res.status(409).json({ error: `Cannot decline (status: ${rental.status})` });
    rental.status = 'declined';
    rental.declinedAt = new Date();
    await rental.save();
    res.json({ rental });
  } catch (err) { next(err); }
};

/* ---------- PATCH /api/rentals/:id/cancel (renter, before accepted) ---------- */
exports.cancel = async (req, res, next) => {
  try {
    const rental = await Rental.findById(req.params.id);
    if (!rental) return res.status(404).json({ error: 'Rental not found' });
    if (!rental.renter.equals(req.user._id)) return res.status(403).json({ error: 'Not your rental' });
    if (!['pending','accepted'].includes(rental.status)) return res.status(409).json({ error: `Cannot cancel (status: ${rental.status})` });
    rental.status = 'cancelled';
    rental.cancelledAt = new Date();
    await rental.save();
    res.json({ rental });
  } catch (err) { next(err); }
};

/* ---------- PATCH /api/rentals/:id/return (owner confirms return) ---------- */
exports.markReturned = async (req, res, next) => {
  try {
    const rental = await Rental.findById(req.params.id);
    if (!rental) return res.status(404).json({ error: 'Rental not found' });
    if (!rental.owner.equals(req.user._id)) return res.status(403).json({ error: 'Not your rental' });
    if (!['accepted','active','overdue'].includes(rental.status)) {
      return res.status(409).json({ error: `Cannot mark returned (status: ${rental.status})` });
    }
    rental.status = 'completed';
    rental.returnedAt = new Date();
    await rental.save();
    await Item.findByIdAndUpdate(rental.item, { status: 'available', $inc: { 'stats.rentalCount': 1 } });
    res.json({ rental });
  } catch (err) { next(err); }
};

/* ---------- POST /api/rentals/:id/review (renter, after completion) ---------- */
exports.review = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating 1-5 required' });
    const rental = await Rental.findById(req.params.id);
    if (!rental) return res.status(404).json({ error: 'Rental not found' });
    if (!rental.renter.equals(req.user._id)) return res.status(403).json({ error: 'Only the renter can review' });
    if (rental.status !== 'completed') return res.status(409).json({ error: 'Can only review completed rentals' });
    rental.review = { rating, comment, createdAt: new Date() };
    await rental.save();

    // Update item & owner aggregate ratings (simple running average).
    const Item = require('../models/Item');
    const item = await Item.findById(rental.item);
    if (item) {
      const newCount = item.stats.reviewCount + 1;
      item.stats.rating = ((item.stats.rating * item.stats.reviewCount) + rating) / newCount;
      item.stats.reviewCount = newCount;
      await item.save();
    }
    res.json({ rental });
  } catch (err) { next(err); }
};
