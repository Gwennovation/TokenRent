/**
 * Auth controller — register / login / logout / handcash callback / me.
 *
 * The user we identify (via JWT cookie) becomes admin automatically if their
 * email matches ADMIN_EMAIL from .env, on first login or registration.
 */
const User = require('../models/User');
const { sign, setAuthCookie, clearAuthCookie } = require('../utils/jwt');
const { getProfileFromAuthToken, authorizeUrl } = require('../utils/handcash');

function maybePromoteAdmin(user) {
  if (process.env.ADMIN_EMAIL && user.email && user.email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase()) {
    if (user.role !== 'admin') user.role = 'admin';
  }
}

function issueSession(res, user) {
  const token = sign({ uid: user._id.toString(), role: user.role });
  setAuthCookie(res, token);
}

/* ---------- Email register ---------- */
exports.register = async (req, res, next) => {
  try {
    const { email, password, name, location, role: requestedRole } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    if (password.length < 8)  return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const user = new User({ email: email.toLowerCase(), name, location });
    await user.setPassword(password);
    maybePromoteAdmin(user);
    user.lastLoginAt = new Date();
    await user.save();

    issueSession(res, user);
    res.status(201).json({ user });
  } catch (err) { next(err); }
};

/* ---------- Email login ---------- */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user || user.status !== 'active') return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await user.checkPassword(password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    maybePromoteAdmin(user);
    user.lastLoginAt = new Date();
    await user.save();

    issueSession(res, user);
    user.passwordHash = undefined; // never return the hash
    res.json({ user });
  } catch (err) { next(err); }
};

/* ---------- Logout ---------- */
exports.logout = (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
};

/* ---------- Current user ---------- */
exports.me = async (req, res) => {
  res.json({ user: req.user || null });
};

/* ---------- HandCash kickoff (frontend redirects user here) ---------- */
exports.handcashStart = (req, res) => {
  try {
    res.redirect(authorizeUrl());
  } catch (err) {
    res.status(500).send(`<h1>HandCash misconfigured</h1><p>${err.message}</p>`);
  }
};

/* ---------- HandCash OAuth callback ---------- */
exports.handcashCallback = async (req, res, next) => {
  try {
    const authToken = req.query.authToken || req.body.authToken;
    if (!authToken) return res.status(400).send('Missing authToken');

    const profile = await getProfileFromAuthToken(authToken);

    // Find or create the user by handcashId
    let user = await User.findOne({ handcashId: profile.id });
    if (!user) {
      user = new User({
        handcashId:     profile.id,
        handcashHandle: profile.handle,
        handcashAvatar: profile.avatarUrl,
        name:           profile.handle,
      });
    } else {
      user.handcashHandle = profile.handle;
      user.handcashAvatar = profile.avatarUrl;
    }
    user.lastLoginAt = new Date();
    await user.save();

    issueSession(res, user);

    // Send the user back to the frontend (dashboard if available)
    res.redirect('/dashboard.html');
  } catch (err) {
    console.error('HandCash callback error:', err.message);
    res.redirect('/login.html?error=handcash');
  }
};
