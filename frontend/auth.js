/* ===================================================================
   T0kenRent — Auth client (talks to the backend).

   The server sets an HttpOnly JWT cookie on login, so we don't store
   tokens in JS. We just call GET /auth/me to learn who's signed in.
   =================================================================== */

const API = (path, opts = {}) => fetch(path, {
  credentials: 'include',
  headers: opts.body && !(opts.body instanceof FormData)
    ? { 'Content-Type': 'application/json', ...(opts.headers || {}) }
    : (opts.headers || {}),
  ...opts,
});

const Auth = {
  _user: null,
  _fetched: false,
  _readyResolvers: [],

  get: () => Auth._user,
  isAuthed: () => !!Auth._user,
  isAdmin:  () => Auth._user && Auth._user.role === 'admin',

  displayName: () => {
    const u = Auth._user;
    if (!u) return null;
    return u.handcashHandle || u.name || (u.email && u.email.split('@')[0]) || 'User';
  },

  /** Returns a promise that resolves once /auth/me has been fetched at least once. */
  ready: () => Auth._fetched ? Promise.resolve(Auth._user) : new Promise(r => Auth._readyResolvers.push(r)),

  refresh: async () => {
    try {
      const r = await API('/auth/me');
      const data = await r.json();
      Auth._user = data.user || null;
    } catch (e) {
      Auth._user = null;
    }
    Auth._fetched = true;
    Auth._readyResolvers.splice(0).forEach(fn => fn(Auth._user));
    return Auth._user;
  },

  register: async ({ email, password, name, location }) => {
    const r = await API('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, location }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Registration failed');
    Auth._user = data.user;
    return data.user;
  },

  login: async ({ email, password }) => {
    const r = await API('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Invalid credentials');
    Auth._user = data.user;
    return data.user;
  },

  signOut: async (redirect = 'index.html') => {
    try { await API('/auth/logout', { method: 'POST' }); } catch (e) {}
    Auth._user = null;
    if (redirect) window.location.href = redirect;
  },

  connectHandCash: () => {
    sessionStorage.setItem('tr_return_to', window.location.pathname);
    window.location.href = '/auth/handcash';
  },
};

window.Auth = Auth;
window.API  = API;

/* ===================================================================
   Nav updater — runs after every auth check.
   Replaces the Login CTA with a user pill when signed in.
   Also hydrates the dashboard sidebar user card if present.
   =================================================================== */
function _updateNav(user) {
  // ── Top nav: swap Login for user pill ────────────────────────────
  const cta = document.querySelector('.nav-links .nav-cta');
  if (cta && user) {
    const name     = Auth.displayName();
    const initials = name.slice(0, 2).toUpperCase();
    const isAdmin  = user.role === 'admin';

    const pill = document.createElement('div');
    pill.className = 'nav-user-pill';
    pill.innerHTML =
      `<div class="nav-av">${initials}</div>` +
      `<span class="nav-user-name">${name}</span>` +
      (isAdmin ? `<span class="nav-admin-badge">Admin</span>` : '') +
      `<button class="nav-logout-btn" onclick="Auth.signOut()">Sign Out</button>`;
    cta.replaceWith(pill);
  }

  // ── Dashboard sidebar user card ────────────────────────────────
  const sideAv   = document.getElementById('sideUserAv');
  const sideName = document.getElementById('sideUserName');
  const sideRole = document.getElementById('sideUserRole');
  if (sideAv && user) {
    const name = Auth.displayName();
    sideAv.textContent = name.slice(0, 2).toUpperCase();
    if (sideName) sideName.textContent = name;
    if (sideRole) sideRole.textContent = user.role === 'admin' ? 'Admin' : 'Owner + Renter';
  }
}

document.addEventListener('DOMContentLoaded', () => Auth.refresh().then(_updateNav));
