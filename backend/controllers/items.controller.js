/**
 * Items controller — CRUD for equipment listings.
 */
const Item = require('../models/Item');
const cloudinary = require('../config/cloudinary');

const PAGE_SIZE = 24;

/* ---------- GET /api/items (public, paginated, filterable) ---------- */
exports.list = async (req, res, next) => {
  try {
    const { q, category, status, sort, page = 1 } = req.query;
    const filter = {};
    if (category && category !== 'all') filter.category = category;
    if (status)   filter.status = status;
    if (q)        filter.$text = { $search: q };

    const sortMap = {
      'price-low':  { dailyRate: 1 },
      'price-high': { dailyRate: -1 },
      'newest':     { createdAt: -1 },
      'popular':    { 'stats.rentalCount': -1, 'stats.rating': -1 },
    };
    const sortBy = sortMap[sort] || sortMap.popular;
    const skip = (Math.max(1, parseInt(page)) - 1) * PAGE_SIZE;

    const [items, total] = await Promise.all([
      Item.find(filter).populate('owner', 'name handcashHandle isVerified').sort(sortBy).skip(skip).limit(PAGE_SIZE).lean(),
      Item.countDocuments(filter),
    ]);
    res.json({ items, total, page: parseInt(page), pageSize: PAGE_SIZE });
  } catch (err) { next(err); }
};

/* ---------- GET /api/items/:id ---------- */
exports.getOne = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('owner', 'name handcashHandle isVerified stats createdAt');
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({ item });
  } catch (err) { next(err); }
};

/* ---------- POST /api/items ---------- */
exports.create = async (req, res, next) => {
  try {
    const { title, description, category, condition, dailyRate, securityDeposit, minDays, maxDays, availableFrom, availableTo } = req.body;

    const photos = (req.files || []).map(f => ({ url: f.path, publicId: f.filename }));

    const item = await Item.create({
      owner: req.user._id,
      title, description, category, condition,
      dailyRate, securityDeposit,
      minDays: minDays || 1,
      maxDays: maxDays || 30,
      availableFrom: availableFrom || undefined,
      availableTo:   availableTo   || undefined,
      photos,
    });
    res.status(201).json({ item });
  } catch (err) { next(err); }
};

/* ---------- PATCH /api/items/:id ---------- */
exports.update = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (!item.owner.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not your item' });
    }
    const editable = ['title','description','category','condition','dailyRate','securityDeposit','minDays','maxDays','availableFrom','availableTo','status'];
    for (const k of editable) if (k in req.body) item[k] = req.body[k];
    await item.save();
    res.json({ item });
  } catch (err) { next(err); }
};

/* ---------- DELETE /api/items/:id ---------- */
exports.remove = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (!item.owner.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not your item' });
    }
    // Best-effort Cloudinary cleanup
    for (const p of item.photos || []) {
      cloudinary.uploader.destroy(p.publicId).catch(() => {});
    }
    await item.deleteOne();
    res.json({ ok: true });
  } catch (err) { next(err); }
};

/* ---------- GET /api/items/mine (owner's own items) ---------- */
exports.mine = async (req, res, next) => {
  try {
    const items = await Item.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json({ items });
  } catch (err) { next(err); }
};
