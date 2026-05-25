/**
 * Auth middleware — pulls JWT from cookie or Bearer header,
 * loads the user, attaches to req.user. Two flavors:
 *   - requireAuth: 401 if not signed in
 *   - optionalAuth: just attaches req.user if present, never blocks
 */
const { verify, COOKIE_NAME } = require('../utils/jwt');
const User = require('../models/User');

function readToken(req) {
  if (req.cookies && req.cookies[COOKIE_NAME]) return req.cookies[COOKIE_NAME];
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

async function loadUser(req) {
  const token = readToken(req);
  if (!token) return null;
  try {
    const payload = verify(token);
    const user = await User.findById(payload.uid);
    if (!user || user.status !== 'active') return null;
    return user;
  } catch (e) {
    return null;
  }
}

async function requireAuth(req, res, next) {
  const user = await loadUser(req);
  if (!user) return res.status(401).json({ error: 'Sign in required' });
  req.user = user;
  next();
}

async function optionalAuth(req, res, next) {
  req.user = await loadUser(req);
  next();
}

module.exports = { requireAuth, optionalAuth };
