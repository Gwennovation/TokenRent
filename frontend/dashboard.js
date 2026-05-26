/* ==============================================================
   T0kenRent — App Shell Router
   Handles hash-based navigation for the unified dashboard shell.
   Calls existing inline dashboard functions for existing views.
   ============================================================== */

'use strict';

/* ── Utilities ───────────────────────────────────────────────── */
const _esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const fmt$ = n => '₱' + (n || 0).toLocaleString('en-PH');
const fmtDate = d => new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

/* ── Hash parsing ────────────────────────────────────────────── */
function parseHash() {
  const raw = (location.hash || '#browse').slice(1); // strip '#'
  const [view, queryStr] = raw.split('?');
  const params = new URLSearchParams(queryStr || '');
  return { view: view || 'browse', params };
}

/* ── Navigate (update hash → triggers hashchange) ───────────── */
function navigate(hash) {
  location.hash = hash;
}

/* ── Show/hide helpers ───────────────────────────────────────── */
function _hideAll() {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  const bv = document.getElementById('browseView');
  const lv = document.getElementById('listView');
  if (bv) bv.classList.remove('active');
  if (lv) lv.classList.remove('active');
}

function _setActiveNav(viewName) {
  document.querySelectorAll('.d-nav').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });
}

function _showTab(name) {
  const el = document.getElementById('tab-' + name);
  if (el) el.classList.add('active');
}

/* ── Main router ─────────────────────────────────────────────── */
async function loadView(view, params) {
  _hideAll();
  _setActiveNav(view);

  switch (view) {
    case 'browse': {
      const bv = document.getElementById('browseView');
      if (bv) bv.classList.add('active');
      if (typeof loadBrowseView === 'function') await loadBrowseView(params);
      break;
    }

    case 'list': {
      const lv = document.getElementById('listView');
      if (lv) lv.classList.add('active');
      if (typeof loadListView === 'function') loadListView();
      break;
    }

    case 'overview':
      _showTab('overview');
      if (typeof loadStats    === 'function') loadStats();
      if (typeof loadOverview === 'function') loadOverview();
      break;

    case 'rentals':
      _showTab('rentals');
      if (typeof loadMyRentals === 'function') loadMyRentals();
      else if (typeof loadOverview === 'function') loadOverview();
      break;

    case 'pending':
    case 'requests':
      _showTab('requests');
      if (typeof loadPending === 'function') loadPending();
      break;

    case 'items':
      _showTab('items');
      if (typeof loadMyItems === 'function') loadMyItems();
      break;

    case 'history':
      _showTab('history');
      break;

    case 'messages':
      _showTab('messages');
      break;

    case 'settings':
      _showTab('settings');
      break;

    default:
      navigate('#browse');
  }
}

/* ── hashchange listener ─────────────────────────────────────── */
window.addEventListener('hashchange', () => {
  const { view, params } = parseHash();
  loadView(view, params);
});

/* ── Boot: wait for auth, then load initial view ─────────────── */
Auth.ready().then(() => {
  const { view, params } = parseHash();
  loadView(view, params);
});

/* ── Expose globals ──────────────────────────────────────────── */
window.navigate = navigate;
