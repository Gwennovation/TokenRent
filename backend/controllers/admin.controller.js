/**
 * Admin controller — only the admin role can hit these endpoints.
 * Functions: user management (suspend/verify/delete), dispute resolution, analytics.
 */
const User = require('../models/User');
const Item = require('../models/Item');
const Rental = require('../models/Rental');
const Dispute = require('../models/Dispute');

/* ===================================================================
   USER MANAGEMENT
   =================================================================== */

/* GET /api/admin/users — paginated, searchable */
exports.listUsers = async (req, res, next) => {
  try {
    const { q, status, role, page = 1 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (role)   filter.role   = role;
    if (q) {
      const rx = new RegExp(q, 'i');
      filter.$or = [{ email: rx }, { name: rx }, { handcashHandle: rx }];
    }
    const pageSize = 30;
    const skip = (Math.max(1, parseInt(page)) - 1) * pageSize;
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
      User.countDocuments(filter),
    ]);
    res.json({ users, total, page: parseInt(page), pageSize });
  } catch (err) { next(err); }
};

/* PATCH /api/admin/users/:id — status / verification / role */
exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user._id.equals(req.user._id)) return res.status(400).json({ error: "Can't modify your own admin account here" });

    const allowed = ['status', 'isVerified', 'role'];
    for (const k of allowed) if (k in req.body) user[k] = req.body[k];
    await user.save();
    res.json({ user });
  } catch (err) { next(err); }
};

/* DELETE /api/admin/users/:id (soft delete by default) */
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user._id.equals(req.user._id)) return res.status(400).json({ error: "Can't delete your own admin account" });
    user.status = 'deleted';
    await user.save();
    res.json({ ok: true });
  } catch (err) { next(err); }
};

/* ===================================================================
   DISPUTE RESOLUTION
   =================================================================== */

/* GET /api/admin/disputes */
exports.listDisputes = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const disputes = await Dispute.find(filter)
      .populate('rental')
      .populate('openedBy', 'name email handcashHandle')
      .populate('against',  'name email handcashHandle')
      .sort({ createdAt: -1 });
    res.json({ disputes });
  } catch (err) { next(err); }
};

/* PATCH /api/admin/disputes/:id/resolve */
exports.resolveDispute = async (req, res, next) => {
  try {
    const { releaseTo, ownerShare, renterShare, adminNotes } = req.body;
    if (!['owner','renter','split'].includes(releaseTo)) {
      return res.status(400).json({ error: 'releaseTo must be owner | renter | split' });
    }

    const dispute = await Dispute.findById(req.params.id).populate('rental');
    if (!dispute) return res.status(404).json({ error: 'Dispute not found' });

    const deposit = (dispute.rental && dispute.rental.securityDeposit) || 0;
    let owner = 0, renter = 0;
    if (releaseTo === 'owner')  { owner = deposit; renter = 0; }
    if (releaseTo === 'renter') { owner = 0; renter = deposit; }
    if (releaseTo === 'split')  {
      owner  = Math.max(0, Math.min(deposit, Number(ownerShare)  || 0));
      renter = Math.max(0, deposit - owner);
    }

    dispute.status = 'resolved';
    dispute.depositReleaseTo  = releaseTo;
    dispute.depositOwnerShare  = owner;
    dispute.depositRenterShare = renter;
    dispute.adminNotes = adminNotes;
    dispute.resolvedAt = new Date();
    dispute.resolvedBy = req.user._id;
    await dispute.save();

    if (dispute.rental) {
      dispute.rental.status = 'completed';
      await dispute.rental.save();
    }
    res.json({ dispute });
  } catch (err) { next(err); }
};

/* ===================================================================
   ANALYTICS
   =================================================================== */

/* GET /api/admin/analytics */
exports.analytics = async (req, res, next) => {
  try {
    const since30 = new Date(Date.now() - 30 * 86400000);

    const [
      totalUsers, activeUsers, suspended, verifiedOwners,
      totalItems, availableItems,
      totalRentals, completedRentals, activeRentals, disputed,
      revenueAgg, topItems, signupsByDay
    ] = await Promise.all([
      User.countDocuments({ status: { $ne: 'deleted' } }),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'suspended' }),
      User.countDocuments({ isVerified: true }),
      Item.countDocuments({}),
      Item.countDocuments({ status: 'available' }),
      Rental.countDocuments({}),
      Rental.countDocuments({ status: 'completed' }),
      Rental.countDocuments({ status: { $in: ['accepted','active'] } }),
      Rental.countDocuments({ status: 'disputed' }),
      Rental.aggregate([
        { $match: { status: { $in: ['completed','active','accepted'] }, createdAt: { $gte: since30 } } },
        { $group: { _id: null, gross: { $sum: '$subtotal' }, platformFees: { $sum: '$platformFee' } } },
      ]),
      Rental.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: '$item', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'items', localField: '_id', foreignField: '_id', as: 'item' } },
        { $unwind: '$item' },
        { $project: { title: '$item.title', category: '$item.category', count: 1 } },
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: since30 } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({
      users:    { total: totalUsers, active: activeUsers, suspended, verifiedOwners },
      items:    { total: totalItems, available: availableItems },
      rentals:  { total: totalRentals, completed: completedRentals, active: activeRentals, disputed },
      revenue30d: revenueAgg[0] || { gross: 0, platformFees: 0 },
      topItems,
      signupsByDay,
    });
  } catch (err) { next(err); }
};
