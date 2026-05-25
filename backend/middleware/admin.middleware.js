/**
 * Admin gate — must run AFTER requireAuth.
 */
function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Sign in required' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access only' });
  next();
}

module.exports = { requireAdmin };
