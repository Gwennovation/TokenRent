/**
 * Users controller — self profile + dispute opening.
 */
const User = require('../models/User');
const Rental = require('../models/Rental');
const Dispute = require('../models/Dispute');

/* ---------- GET /api/users/me ---------- */
exports.me = async (req, res) => res.json({ user: req.user });

/* ---------- PATCH /api/users/me ---------- */
exports.updateMe = async (req, res, next) => {
  try {
    const editable = ['name', 'location', 'bio', 'avatar'];
    for (const k of editable) if (k in req.body) req.user[k] = req.body[k];
    await req.user.save();
    res.json({ user: req.user });
  } catch (err) { next(err); }
};

/* ---------- GET /api/users/me/stats ---------- */
exports.myStats = async (req, res, next) => {
  try {
    const [asRenter, asOwner, pending, overdue, monthSpend] = await Promise.all([
      Rental.countDocuments({ renter: req.user._id, status: { $in: ['accepted','active'] } }),
      Rental.countDocuments({ owner:  req.user._id, status: { $in: ['accepted','active'] } }),
      Rental.countDocuments({ owner:  req.user._id, status: 'pending' }),
      Rental.countDocuments({ owner:  req.user._id, status: 'overdue' }),
      Rental.aggregate([
        { $match: { renter: req.user._id, createdAt: { $gte: new Date(new Date().setDate(1)) } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
    ]);
    res.json({
      activeRentals: asRenter + asOwner,
      pendingRequests: pending,
      overdue,
      monthSpend: monthSpend[0] ? monthSpend[0].total : 0,
    });
  } catch (err) { next(err); }
};

/* ---------- POST /api/users/disputes (open a dispute on a rental) ---------- */
exports.openDispute = async (req, res, next) => {
  try {
    const { rentalId, type, description } = req.body;
    if (!rentalId || !type || !description) return res.status(400).json({ error: 'rentalId, type, description required' });
    if (description.length < 30) return res.status(400).json({ error: 'Description must be at least 30 characters' });

    const rental = await Rental.findById(rentalId);
    if (!rental) return res.status(404).json({ error: 'Rental not found' });
    if (!rental.owner.equals(req.user._id) && !rental.renter.equals(req.user._id)) {
      return res.status(403).json({ error: 'Not your rental' });
    }
    const against = rental.owner.equals(req.user._id) ? rental.renter : rental.owner;

    const evidence = (req.files || []).map(f => ({ url: f.path, publicId: f.filename }));

    const dispute = await Dispute.create({
      rental:    rental._id,
      openedBy:  req.user._id,
      against,
      type, description, evidence,
    });
    rental.status = 'disputed';
    await rental.save();
    res.status(201).json({ dispute });
  } catch (err) { next(err); }
};
