/* ===================================================================
   T0kenRent — Auth Module
   Handles HandCash Connect OAuth + email-session state in localStorage.

   ─── SETUP ─────────────────────────────────────────────────────────
   1) Register your app at https://dashboard.handcash.io
   2) Paste your App ID into HANDCASH_APP_ID below.
   3) In the HandCash dashboard, add your domain (or http://localhost:xxxx)
      to "Authorized Redirect URLs" — must match REDIRECT_URL below.

   The OAuth flow:
     [Connect HandCash clicked]
        → redirects to https://app.handcash.io/#/authorizeApp?appId={ID}
        → user approves
        → HandCash redirects back to REDIRECT_URL with #authToken=...
        → auth.js parses the token, stores it, sets session, redirects.

   To fetch the user's $handle/profile, the authToken must be exchanged
   on your backend using the HandCash Connect SDK + your App Secret.
   That step is NOT included here because App Secrets must never be in
   frontend code. For this project, we store the token and treat the
   user as authenticated.
   =================================================================== */

const HANDCASH_APP_ID = '692c5eedaecc93a4d1907d4e'; // ← Replace with your App ID
const REDIRECT_URL    = window.location.origin + window.location.pathname.replace(/[^/]*$/, '') + 'login.html';

const STORAGE_KEY = 'tr_auth';

/* ─── State helpers ────────────────────────────────────────────────── */
const Auth = {
  /** Returns the current session or null. */
  get: () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); }
    catch (e) { return null; }
  },

  /** True if any session is active (handcash OR email). */
  isAuthed: () => !!Auth.get(),

  /** Display name to show in the nav. */
  displayName: () => {
    const s = Auth.get();
    if (!s) return null;
    if (s.type === 'handcash') return s.handle || '$wallet';
    if (s.type === 'email')    return s.name || s.email || 'Account';
    return 'Account';
  },

  /** Set the current session. */
  setSession: (session) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...session, ts: Date.now() }));
  },

  /** Sign out and (optionally) bounce home. */
  signOut: (redirect = 'index.html') => {
    localStorage.removeItem(STORAGE_KEY);
    if (redirect) window.location.href = redirect;
  },

  /* ─── HandCash Connect (real OAuth redirect) ─────────────────────── */
  connectHandCash: () => {
    if (!HANDCASH_APP_ID || HANDCASH_APP_ID === 'YOUR_HANDCASH_APP_ID_HERE') {
      alert(
        'HandCash is not configured yet.\n\n' +
        '1) Register the app at https://dashboard.handcash.io\n' +
        '2) Paste your App ID into auth.js\n' +
        '3) Add this page\'s URL to your HandCash app\'s allowed redirect list:\n\n' +
        REDIRECT_URL
      );
      return;
    }
    // Save the page the user is on so we can return them after login.
    sessionStorage.setItem('tr_return_to', window.location.href);
    // Kick off the HandCash authorization screen.
    const authUrl = `https://app.handcash.io/#/authorizeApp?appId=${encodeURIComponent(HANDCASH_APP_ID)}`;
    window.location.href = authUrl;
  },

  /** Parse the HandCash callback if we landed back here with #authToken=... */
  handleHandCashCallback: () => {
    const hash = window.location.hash || '';
    const match = hash.match(/authToken=([^&]+)/);
    if (!match) return false;

    const authToken = decodeURIComponent(match[1]);
    Auth.setSession({
      type:       'handcash',
      authToken:  authToken,
      handle:     '$handcash-user',   // Real handle requires backend SDK exchange
    });

    // Remove the token from the URL so it's not visible after refresh.
    history.replaceState(null, '', window.location.pathname);

    // Return user to wherever they tried to go before logging in.
    const returnTo = sessionStorage.getItem('tr_return_to');
    sessionStorage.removeItem('tr_return_to');
    if (returnTo && returnTo !== window.location.href) window.location.href = returnTo;
    else window.location.href = 'dashboard.html';
    return true;
  },

  /* ─── Email session (no real backend — frontend demo) ────────────── */
  signInWithEmail: (email, name) => {
    Auth.setSession({ type: 'email', email, name: name || email.split('@')[0] });
  },
};

window.Auth = Auth;

/* ─── Auto-detect HandCash callback on page load ───────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.hash.includes('authToken=')) {
    Auth.handleHandCashCallback();
  }
});
