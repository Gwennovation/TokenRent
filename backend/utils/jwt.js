/**
 * JWT helpers — sign/verify tokens, set/clear HttpOnly cookies.
 */
const jwt = require('jsonwebtoken');

const COOKIE_NAME = 'tr_token';

function sign(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function verify(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

module.exports = { sign, verify, setAuthCookie, clearAuthCookie, COOKIE_NAME };
