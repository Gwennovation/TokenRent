# Unified App Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge Dashboard, Browse, and List Item into a single authenticated shell (`dashboard.html`) with hash-based routing, making Browse the default landing view after login and adding a slide-in item detail panel.

**Architecture:** A new `dashboard.js` file owns a lightweight hash router (`#browse`, `#list`, `#overview`, etc.) and the two new view loaders (Browse + List Item). Existing dashboard tab content and inline functions stay in place — the router calls them by name. `browse.html` and `list-item.html` become redirect stubs. `index.html` auto-redirects logged-in users.

**Tech Stack:** Vanilla JS (no framework), CSS custom properties, `location.hash` routing, `hashchange` events, Bootstrap 5, existing `/api/items` endpoints.

**Spec:** `docs/superpowers/specs/2026-05-26-unified-app-shell-design.md`

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Append | `frontend/styles.css` | Panel slide-in CSS, app-view containers, browse grid layout |
| Modify | `frontend/dashboard.html` | Remove tr-nav, add Browse/List sidebar items, add view container divs, add item panel HTML, add `dashboard.js` script tag |
| Create | `frontend/dashboard.js` | Hash router, Browse view, item detail panel, List Item view |
| Replace | `frontend/browse.html` | Redirect stub → `dashboard.html#browse` |
| Replace | `frontend/list-item.html` | Redirect stub → `dashboard.html#list` |
| Modify | `frontend/index.html` | Auto-redirect logged-in users to `dashboard.html#browse` |

---

## Task 1: Shell + Panel CSS

**Files:**
- Modify: `frontend/styles.css` (append at end)

- [ ] **Step 1: Append shell CSS to styles.css**

Open `frontend/styles.css`. Add this entire block at the very end of the file:

```css
/* =====================================================================
   UNIFIED APP SHELL (app-view, #browseView, #listView, #itemPanel)
   ===================================================================== */

/* -- View containers (Browse + List replace tab-content for those views) -- */
.app-view {
  display: none;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
}
.app-view.active { display: flex; }

/* -- Browse layout: grid + panel side by side -- */
#appMain {
  display: flex;
  flex: 1;
  min-height: 0;
  gap: 0;
  position: relative;
}

#browseGrid {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: 20px 24px;
  transition: flex .25s ease;
}

/* -- Item detail panel -- */
#itemPanel {
  width: 0;
  overflow: hidden;
  flex-shrink: 0;
  border-left: 1px solid rgba(0,200,255,.15);
  background: var(--bg-card);
  transition: width .25s ease;
  display: flex;
  flex-direction: column;
}
#appMain.panel-open #itemPanel { width: 400px; }

.ip-photo {
  width: 100%; height: 180px;
  object-fit: cover; display: block;
  background: var(--bg-surface);
  flex-shrink: 0;
}
.ip-photo-placeholder {
  width: 100%; height: 180px;
  background: var(--bg-surface);
  display: flex; align-items: center; justify-content: center;
  color: var(--muted); font-size: .8rem; flex-shrink: 0;
}
.ip-body {
  flex: 1; overflow-y: auto;
  padding: 18px 20px;
  display: flex; flex-direction: column; gap: 14px;
}
.ip-close {
  position: absolute; top: 10px; right: 12px;
  background: rgba(0,0,0,.45); border: 1px solid rgba(255,255,255,.1);
  color: var(--muted); width: 28px; height: 28px; border-radius: 50%;
  cursor: pointer; font-size: 1rem; line-height: 1;
  display: flex; align-items: center; justify-content: center;
  transition: color .2s, border-color .2s; z-index: 2;
}
.ip-close:hover { color: var(--white); border-color: rgba(255,255,255,.3); }
.ip-photo-wrap { position: relative; flex-shrink: 0; }

.ip-title  { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1rem; }
.ip-meta   { font-size: .74rem; color: var(--muted); margin-top: 2px; }
.ip-owner  {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 12px; border-radius: var(--radius-sm);
  background: var(--bg-subtle); border: 1px solid var(--border-soft);
}
.ip-owner-av {
  width: 32px; height: 32px; border-radius: 50%;
  background: var(--cyan-10); border: 1.5px solid var(--cyan);
  display: flex; align-items: center; justify-content: center;
  font-size: .7rem; font-weight: 800; color: var(--cyan); flex-shrink: 0;
}
.ip-owner-name { font-size: .8rem; font-weight: 600; }
.ip-owner-sub  { font-size: .68rem; color: var(--muted); }

.ip-price-row {
  display: flex; justify-content: space-between; align-items: baseline;
  font-size: .82rem;
}
.ip-price-row .label { color: var(--muted); }
.ip-price-row .value { font-weight: 600; }
.ip-price-row .value.accent { color: var(--cyan); font-family: 'Syne',sans-serif; font-weight: 800; }

.ip-booking {
  border-top: 1px solid var(--border-soft);
  padding-top: 14px;
  display: flex; flex-direction: column; gap: 10px;
}
.ip-booking label { font-size: .72rem; color: var(--muted); display: block; margin-bottom: 4px; }
.ip-booking input[type=date] {
  width: 100%; background: var(--bg-subtle); border: 1px solid var(--border-mid);
  border-radius: 8px; color: var(--white); padding: 8px 12px;
  font-size: .85rem; font-family: 'DM Sans', sans-serif;
  transition: border-color .2s;
}
.ip-booking input[type=date]:focus { border-color: var(--cyan); outline: none; }
.ip-booking-total {
  display: flex; justify-content: space-between; align-items: center;
  font-size: .82rem; padding: 8px 0; border-top: 1px solid var(--border-soft);
}
.ip-booking-total .tot { font-family: 'Syne',sans-serif; font-weight: 800; font-size: .95rem; }
.ip-book-btn { width: 100%; }
.ip-book-err { color: var(--danger); font-size: .74rem; display: none; }
.ip-book-success { color: var(--success); font-size: .82rem; display: none; }

/* -- Browse search bar + filters -- */
.browse-header {
  display: flex; flex-wrap: wrap; gap: 10px; align-items: center;
  margin-bottom: 18px;
}
.browse-search {
  flex: 1; min-width: 200px;
  background: var(--bg-subtle); border: 1px solid var(--border-mid);
  border-radius: 10px; color: var(--white); padding: 9px 14px;
  font-size: .88rem; font-family: 'DM Sans', sans-serif;
  transition: border-color .2s;
}
.browse-search:focus { border-color: var(--cyan); outline: none; box-shadow: 0 0 0 3px rgba(0,200,255,.12); }
.browse-search::placeholder { color: rgba(156,163,175,.5); }
.browse-select {
  background: var(--bg-subtle); border: 1px solid var(--border-mid);
  border-radius: 10px; color: var(--muted); padding: 9px 12px;
  font-size: .82rem; font-family: 'DM Sans', sans-serif;
  cursor: pointer;
}
.browse-pills { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
.browse-pill {
  background: var(--bg-subtle); border: 1px solid var(--border-mid);
  border-radius: 99px; padding: 5px 14px; font-size: .75rem;
  cursor: pointer; color: var(--muted); transition: all .15s;
}
.browse-pill:hover { border-color: var(--cyan); color: var(--white); }
.browse-pill.active { background: var(--cyan-10); border-color: var(--cyan); color: var(--cyan); font-weight: 700; }
.browse-result-count { font-size: .74rem; color: var(--muted); margin-bottom: 12px; }

/* Item grid inside app shell */
.browse-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
}
#appMain.panel-open .browse-grid {
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
}

/* Skeleton loading */
.ic-skeleton {
  border-radius: var(--radius); overflow: hidden;
  background: var(--bg-subtle); border: 1px solid var(--border-soft);
  animation: shimmer 1.4s infinite;
}
.ic-skeleton-img  { height: 120px; background: var(--bg-surface); }
.ic-skeleton-line { height: 10px; background: var(--bg-surface); border-radius: 5px; margin: 10px 12px 6px; }
.ic-skeleton-line.short { width: 55%; }
@keyframes shimmer {
  0%,100% { opacity: 1; } 50% { opacity: .55; }
}

/* List view container */
#listView { padding: 0; }
#listFormContainer { padding: 24px; max-width: 720px; }

/* Mobile panel: full-screen overlay */
@media (max-width: 768px) {
  #appMain.panel-open #itemPanel {
    position: fixed; inset: 0; width: 100%; z-index: 900;
    border-left: none;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git -C /Users/ian/Desktop/TokenRent add frontend/styles.css
git -C /Users/ian/Desktop/TokenRent commit -m "feat: add unified shell CSS — panel slide-in, browse grid, app-view"
```

---

## Task 2: Dashboard HTML — Sidebar + View Containers

**Files:**
- Modify: `frontend/dashboard.html`

This task has three edits: (A) remove `tr-nav`, (B) update sidebar, (C) add view container divs + panel HTML + script tag.

- [ ] **Step 1: Remove the tr-nav top bar**

Read `frontend/dashboard.html`. Find the entire `<nav class="tr-nav">` block (starts with `<nav class="tr-nav"` and ends with the matching `</nav>`). Delete it entirely — it's the full-page top navigation bar that we don't need inside the authenticated shell.

- [ ] **Step 2: Add Browse and List Item to the sidebar**

Find the sidebar section that contains the nav buttons. It looks roughly like:

```html
<div class="dash-nav-section">Overview</div>
<button class="d-nav active" onclick="showTab('overview', this)" ...>
```

Replace the entire sidebar nav contents (from the first `<div class="dash-nav-section">` through the last `</button>` in the nav, keeping the user card above it intact) with:

```html
<button class="d-nav" data-view="browse" onclick="navigate('#browse')">
  <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
  Browse
</button>
<button class="d-nav" data-view="list" onclick="navigate('#list')">
  <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
  List an Item
</button>

<div class="dash-nav-section">My Activity</div>
<button class="d-nav" data-view="overview" onclick="navigate('#overview')">
  <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
  Overview
</button>
<button class="d-nav" data-view="rentals" onclick="navigate('#rentals')">
  <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
  My Rentals
</button>
<button class="d-nav" data-view="requests" onclick="navigate('#pending')">
  <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  Pending
  <span class="badge-count" id="navBadgeRequests" style="display:none">0</span>
</button>
<button class="d-nav" data-view="items" onclick="navigate('#items')">
  <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
  My Items
</button>

<div class="dash-nav-section" style="margin-top:8px"></div>
<button class="d-nav" data-view="messages" onclick="navigate('#messages')">
  <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  Messages
</button>
<button class="d-nav" data-view="settings" onclick="navigate('#settings')">
  <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  Settings
</button>
```

- [ ] **Step 3: Add view container divs and item panel HTML inside dash-main**

Find the closing `</main>` tag of `<main class="dash-main">`. Just before it, insert the following two view containers and the item panel:

```html
<!-- ── Browse View ──────────────────────────────────────────── -->
<div id="browseView" class="app-view">
  <div id="browseHeader"></div>
  <div id="appMain">
    <div id="browseGrid"></div>
    <!-- Item Detail Panel -->
    <div id="itemPanel">
      <div class="ip-photo-wrap">
        <img id="ipPhoto" class="ip-photo" src="" alt="" style="display:none"/>
        <div id="ipPhotoPlaceholder" class="ip-photo-placeholder">No photo</div>
        <button class="ip-close" onclick="closeItemPanel()" aria-label="Close">×</button>
      </div>
      <div class="ip-body">
        <div>
          <div class="ip-title" id="ipTitle"></div>
          <div class="ip-meta"  id="ipMeta"></div>
        </div>
        <div class="ip-owner" id="ipOwner"></div>
        <div id="ipPricing"></div>
        <div class="ip-booking" id="ipBooking">
          <div>
            <label for="ipStart">Start date</label>
            <input type="date" id="ipStart" onchange="ipCalcTotal()"/>
          </div>
          <div>
            <label for="ipEnd">End date</label>
            <input type="date" id="ipEnd" onchange="ipCalcTotal()"/>
          </div>
          <div class="ip-booking-total">
            <span style="color:var(--muted);font-size:.8rem">Total</span>
            <span class="tot" id="ipTotal">—</span>
          </div>
          <button class="btn btn-primary ip-book-btn" onclick="ipBook()">Book Now</button>
          <div class="ip-book-err" id="ipBookErr"></div>
          <div class="ip-book-success" id="ipBookSuccess">Booking request sent!</div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ── List an Item View ─────────────────────────────────────── -->
<div id="listView" class="app-view">
  <div id="listFormContainer"></div>
</div>
```

- [ ] **Step 4: Add dashboard.js script tag**

Find:
```html
<script src="rental-modal.js"></script>
```

Add `dashboard.js` after it:
```html
<script src="rental-modal.js"></script>
<script src="dashboard.js"></script>
```

- [ ] **Step 5: Commit**

```bash
git -C /Users/ian/Desktop/TokenRent add frontend/dashboard.html
git -C /Users/ian/Desktop/TokenRent commit -m "feat: unified shell — add browse/list views and item panel to dashboard"
```

---

## Task 3: Hash Router (dashboard.js)

**Files:**
- Create: `frontend/dashboard.js`

- [ ] **Step 1: Create dashboard.js with the router**

Create `/Users/ian/Desktop/TokenRent/frontend/dashboard.js`:

```js
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
    case 'browse':
      document.getElementById('browseView').classList.add('active');
      await loadBrowseView(params);
      break;

    case 'list':
      document.getElementById('listView').classList.add('active');
      loadListView();
      break;

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
```

- [ ] **Step 2: Verify the router loads without errors**

Start the server (requires `.env` with `MONGO_URI` and `JWT_SECRET` set). Navigate to `dashboard.html` in the browser. Open the console — there should be no errors. Clicking the sidebar nav items should change the URL hash and show/hide the right sections.

If you see `Auth is not defined`, check that `dashboard.js` is loaded **after** `auth.js` in `dashboard.html`.

- [ ] **Step 3: Commit**

```bash
git -C /Users/ian/Desktop/TokenRent add frontend/dashboard.js
git -C /Users/ian/Desktop/TokenRent commit -m "feat: hash router for unified app shell"
```

---

## Task 4: Browse View

**Files:**
- Modify: `frontend/dashboard.js` (append before `window.navigate = navigate`)

- [ ] **Step 1: Append Browse view logic to dashboard.js**

Open `frontend/dashboard.js`. Find the line `/* ── Expose globals` and insert this entire block immediately before it:

```js
/* ── Browse state ────────────────────────────────────────────── */
const _bState = { search: '', sort: 'popular', status: '', category: 'all' };
let _bTimer = null;

/* ── Browse view loader ──────────────────────────────────────── */
async function loadBrowseView(params) {
  const header = document.getElementById('browseHeader');
  const grid   = document.getElementById('browseGrid');

  // Render search bar + filters (idempotent — only build once)
  if (!header.dataset.built) {
    header.dataset.built = '1';
    header.innerHTML = `
      <div style="padding:20px 24px 0">
        <div class="browse-header">
          <input class="browse-search" id="bSearch" type="search"
                 placeholder="Search cameras, tools, vehicles…"
                 value="${_esc(_bState.search)}"
                 oninput="_bSchedule()"/>
          <select class="browse-select" id="bSort" onchange="_bSortChange(this.value)">
            <option value="popular"   ${_bState.sort==='popular'   ?'selected':''}>Popular</option>
            <option value="newest"    ${_bState.sort==='newest'    ?'selected':''}>Newest</option>
            <option value="price-low" ${_bState.sort==='price-low' ?'selected':''}>Price ↑</option>
            <option value="price-high"${_bState.sort==='price-high'?'selected':''}>Price ↓</option>
          </select>
        </div>
        <div class="browse-pills" id="bPills">
          ${['all','construction','electronics','photography','outdoor','vehicles','events','other'].map(c =>
            `<button class="browse-pill${_bState.category===c?' active':''}"
                     onclick="_bSetCat('${c}')">${c.charAt(0).toUpperCase()+c.slice(1)}</button>`
          ).join('')}
        </div>
        <div class="browse-result-count" id="bCount"></div>
      </div>`;
  }

  // Render grid area
  grid.innerHTML = `<div class="browse-grid" id="bGrid"></div>`;

  // If URL has ?item=ID, open panel after loading
  const itemId = params && params.get('item');

  await _bFetch();

  if (itemId) openItemPanel(itemId);
}

function _bSchedule() {
  clearTimeout(_bTimer);
  _bState.search = document.getElementById('bSearch')?.value || '';
  _bTimer = setTimeout(_bFetch, 300);
}

function _bSortChange(val) {
  _bState.sort = val;
  _bFetch();
}

function _bSetCat(cat) {
  _bState.category = cat;
  document.querySelectorAll('.browse-pill').forEach(p =>
    p.classList.toggle('active', p.textContent.toLowerCase() === cat ||
    (cat === 'all' && p.textContent.toLowerCase() === 'all'))
  );
  _bFetch();
}

async function _bFetch() {
  const grid = document.getElementById('bGrid');
  if (!grid) return;

  // Skeleton
  grid.innerHTML = Array(6).fill(0).map(() => `
    <div class="ic-skeleton">
      <div class="ic-skeleton-img"></div>
      <div class="ic-skeleton-line"></div>
      <div class="ic-skeleton-line short"></div>
    </div>`).join('');

  const p = new URLSearchParams();
  if (_bState.category && _bState.category !== 'all') p.set('category', _bState.category);
  if (_bState.status)  p.set('status', _bState.status);
  if (_bState.search)  p.set('q', _bState.search);
  if (_bState.sort)    p.set('sort', _bState.sort);

  try {
    const res  = await fetch('/api/items?' + p.toString(), { credentials: 'include' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load items');
    const items = data.items || data || [];
    _bRender(items);
  } catch (err) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:48px 0;color:var(--muted)">
      ${_esc(err.message)}
      <br/><br/>
      <button class="btn btn-ghost btn-sm" onclick="_bFetch()">Retry</button>
    </div>`;
  }
}

function _bRender(items) {
  const grid  = document.getElementById('bGrid');
  const count = document.getElementById('bCount');
  if (!grid) return;
  if (count) count.textContent = items.length ? `${items.length} item${items.length!==1?'s':''} found` : '';

  if (!items.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:48px 0">
      <div style="color:var(--muted);margin-bottom:12px">No items found.</div>
      <button class="btn btn-ghost btn-sm" onclick="_bSetCat('all')">Clear filters</button>
    </div>`;
    return;
  }

  const statusCls = { available:'badge-completed', rented:'badge-rented', overdue:'badge-overdue', unavailable:'badge-overdue' };

  grid.innerHTML = items.map(it => {
    const cover = (it.photos && it.photos[0] && it.photos[0].url) ||
                  `https://picsum.photos/seed/${it.category||'item'}-${it._id}/400/300`;
    const owner = it.owner ? (it.owner.handcashHandle || it.owner.name || '') : '';
    return `
      <div class="item-card" onclick="openItemPanel('${_esc(it._id)}')" style="cursor:pointer">
        <div class="ic-img">
          <img src="${_esc(cover)}" alt="${_esc(it.title)}" loading="lazy" onerror="this.style.display='none'"/>
          <span class="ic-badge badge ${statusCls[it.status]||'badge-pending'}">${_esc(it.status)}</span>
        </div>
        <div class="ic-body">
          <div class="ic-cat">${_esc(it.category||'')}</div>
          <div class="ic-title">${_esc(it.title)}</div>
          <div class="ic-owner">${_esc(owner)}</div>
          <div class="ic-foot">
            <span class="ic-price">${fmt$(it.dailyRate)}/day</span>
            <span class="ic-rating">
              ★ ${it.stats?.rating ? it.stats.rating.toFixed(1) : '—'}
            </span>
          </div>
        </div>
      </div>`;
  }).join('');
}
```

- [ ] **Step 2: Expose new globals**

Find the exports block at the bottom of `dashboard.js`:
```js
window.navigate = navigate;
```

Add:
```js
window.navigate    = navigate;
window._bSchedule  = _bSchedule;
window._bSortChange = _bSortChange;
window._bSetCat    = _bSetCat;
window._bFetch     = _bFetch;
```

- [ ] **Step 3: Verify Browse loads**

Navigate to `dashboard.html#browse`. Should see:
- Search bar + sort dropdown + category pills
- Item cards in a grid (or "No items found" if DB is empty)
- Clicking a category pill filters the grid

- [ ] **Step 4: Commit**

```bash
git -C /Users/ian/Desktop/TokenRent add frontend/dashboard.js
git -C /Users/ian/Desktop/TokenRent commit -m "feat: browse view in unified shell"
```

---

## Task 5: Item Detail Panel

**Files:**
- Modify: `frontend/dashboard.js` (append before the `/* ── Expose globals` comment)

- [ ] **Step 1: Append item panel logic to dashboard.js**

Find `/* ── Expose globals` and insert this block immediately before it:

```js
/* ── Item detail panel ───────────────────────────────────────── */
let _ipItem     = null;  // current item data
let _ipDailyRate = 0;

async function openItemPanel(itemId) {
  // Update URL without triggering full re-render
  const newHash = '#browse?item=' + itemId;
  if (location.hash !== newHash) {
    history.replaceState(null, '', newHash);
  }

  document.getElementById('appMain').classList.add('panel-open');

  // Clear previous content
  document.getElementById('ipTitle').textContent = 'Loading…';
  document.getElementById('ipMeta').textContent  = '';
  document.getElementById('ipOwner').innerHTML   = '';
  document.getElementById('ipPricing').innerHTML = '';
  document.getElementById('ipTotal').textContent = '—';
  document.getElementById('ipBookErr').style.display    = 'none';
  document.getElementById('ipBookSuccess').style.display = 'none';

  try {
    const res  = await fetch(`/api/items/${itemId}`, { credentials: 'include' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load item');
    _ipItem      = data.item || data;
    _ipDailyRate = _ipItem.dailyRate || 0;
    _ipRender(_ipItem);
  } catch (err) {
    document.getElementById('ipTitle').textContent = err.message;
  }
}

function _ipRender(it) {
  const cover  = it.photos && it.photos[0] && it.photos[0].url;
  const photo  = document.getElementById('ipPhoto');
  const pholder = document.getElementById('ipPhotoPlaceholder');
  if (cover) {
    photo.src = cover; photo.alt = it.title || ''; photo.style.display = 'block';
    pholder.style.display = 'none';
  } else {
    photo.style.display = 'none'; pholder.style.display = 'flex';
  }

  document.getElementById('ipTitle').textContent = it.title || '—';
  document.getElementById('ipMeta').textContent  =
    [it.category, it.condition].filter(Boolean).join(' · ');

  const owner = it.owner || {};
  const ownerName = owner.handcashHandle || owner.name || 'Owner';
  const ownerInit = ownerName.slice(0, 2).toUpperCase();
  document.getElementById('ipOwner').innerHTML = `
    <div class="ip-owner-av">${_esc(ownerInit)}</div>
    <div>
      <div class="ip-owner-name">${_esc(ownerName)}</div>
      <div class="ip-owner-sub">${_esc(owner.location || '')}</div>
    </div>`;

  document.getElementById('ipPricing').innerHTML = `
    <div class="ip-price-row">
      <span class="label">Daily rate</span>
      <span class="value accent">${fmt$(_ipDailyRate)}/day</span>
    </div>
    <div class="ip-price-row">
      <span class="label">Security deposit</span>
      <span class="value">${fmt$(it.securityDeposit)}</span>
    </div>
    <div class="ip-price-row">
      <span class="label">Min / max days</span>
      <span class="value">${it.minDays||1} – ${it.maxDays||30}</span>
    </div>`;
}

function ipCalcTotal() {
  const s = document.getElementById('ipStart')?.value;
  const e = document.getElementById('ipEnd')?.value;
  const totalEl = document.getElementById('ipTotal');
  if (!s || !e) { totalEl.textContent = '—'; return; }
  const days = Math.round((new Date(e) - new Date(s)) / 86400000);
  if (days <= 0) { totalEl.textContent = 'Invalid range'; return; }
  const subtotal = days * _ipDailyRate;
  const deposit  = _ipItem ? (_ipItem.securityDeposit || 0) : 0;
  totalEl.textContent = fmt$(subtotal + deposit) + ` (${days}d + deposit)`;
}

async function ipBook() {
  if (!_ipItem) return;
  const startDate = document.getElementById('ipStart')?.value;
  const endDate   = document.getElementById('ipEnd')?.value;
  const errEl     = document.getElementById('ipBookErr');
  const okEl      = document.getElementById('ipBookSuccess');
  const btn       = document.querySelector('.ip-book-btn');

  errEl.style.display = 'none';
  okEl.style.display  = 'none';

  if (!startDate || !endDate) {
    errEl.textContent = 'Please pick start and end dates.';
    errEl.style.display = 'block'; return;
  }
  const days = Math.round((new Date(endDate) - new Date(startDate)) / 86400000);
  if (days <= 0) {
    errEl.textContent = 'End date must be after start date.';
    errEl.style.display = 'block'; return;
  }

  if (btn) { btn.disabled = true; btn.textContent = 'Booking…'; }
  try {
    const res  = await fetch('/api/rentals', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item: _ipItem._id, startDate, endDate }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Booking failed');
    okEl.style.display = 'block';
    if (btn) { btn.disabled = false; btn.textContent = 'Book Now'; }
    // Refresh pending count in sidebar
    if (typeof loadStats === 'function') loadStats();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.style.display = 'block';
    if (btn) { btn.disabled = false; btn.textContent = 'Book Now'; }
  }
}

function closeItemPanel() {
  document.getElementById('appMain').classList.remove('panel-open');
  history.replaceState(null, '', '#browse');
  _ipItem = null;
  _ipDailyRate = 0;
}

// Close on Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && document.getElementById('appMain')?.classList.contains('panel-open')) {
    closeItemPanel();
  }
});
```

- [ ] **Step 2: Expose new globals**

Update the exports block to add:
```js
window.openItemPanel  = openItemPanel;
window.closeItemPanel = closeItemPanel;
window.ipCalcTotal    = ipCalcTotal;
window.ipBook         = ipBook;
```

- [ ] **Step 3: Verify panel opens**

Navigate to `dashboard.html#browse`. Click any item card. Expected:
- Panel slides in from the right (400px)
- Photo, title, owner card, pricing visible
- Date inputs calculate a total when filled
- × button closes the panel
- Escape key closes the panel

- [ ] **Step 4: Commit**

```bash
git -C /Users/ian/Desktop/TokenRent add frontend/dashboard.js
git -C /Users/ian/Desktop/TokenRent commit -m "feat: item detail slide-in panel with booking form"
```

---

## Task 6: List an Item View

**Files:**
- Modify: `frontend/dashboard.js` (append before `/* ── Expose globals`)

- [ ] **Step 1: Append List Item view to dashboard.js**

Find `/* ── Expose globals` and insert this entire block before it:

```js
/* ── List an Item view ───────────────────────────────────────── */
let _liPhotos = [];  // { file, preview } objects — reset each time view loads

function loadListView() {
  _liPhotos = [];
  const container = document.getElementById('listFormContainer');
  if (!container) return;

  container.innerHTML = `
    <h2 style="font-family:'Syne',sans-serif;font-weight:800;font-size:1.4rem;margin-bottom:6px">List an Item</h2>
    <p style="color:var(--muted);font-size:.85rem;margin-bottom:28px">Earn from gear you don't use every day.</p>

    <!-- Step progress -->
    <div class="step-track" style="display:flex;gap:0;margin-bottom:28px">
      <div class="step active" id="liStep1" style="flex:1;text-align:center;font-size:.72rem;padding-bottom:8px;border-bottom:2px solid var(--cyan);color:var(--cyan)">1. Details</div>
      <div class="step"       id="liStep2" style="flex:1;text-align:center;font-size:.72rem;padding-bottom:8px;border-bottom:2px solid var(--border-mid);color:var(--muted)">2. Photos</div>
      <div class="step"       id="liStep3" style="flex:1;text-align:center;font-size:.72rem;padding-bottom:8px;border-bottom:2px solid var(--border-mid);color:var(--muted)">3. Pricing</div>
    </div>

    <form id="liForm" novalidate>
      <!-- Details -->
      <div class="form-section" style="margin-bottom:24px">
        <div class="form-group" style="margin-bottom:16px">
          <label class="form-label" for="liTitle">Title <span style="color:var(--pink)">*</span></label>
          <input class="form-control" id="liTitle" maxlength="80" placeholder="e.g. Sony A7III Camera Kit" required/>
          <div style="text-align:right;font-size:.68rem;color:var(--muted);margin-top:3px"><span id="liTitleCount">0</span>/80</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px">
          <div class="form-group">
            <label class="form-label" for="liCat">Category <span style="color:var(--pink)">*</span></label>
            <select class="form-select" id="liCat" required>
              <option value="">Select…</option>
              <option value="construction">Construction</option>
              <option value="electronics">Electronics</option>
              <option value="photography">Photography</option>
              <option value="outdoor">Outdoor</option>
              <option value="vehicles">Vehicles</option>
              <option value="events">Events</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="liCond">Condition <span style="color:var(--pink)">*</span></label>
            <select class="form-select" id="liCond" required>
              <option value="">Select…</option>
              <option value="Like New">Like New</option>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="liDesc">Description <span style="color:var(--pink)">*</span></label>
          <textarea class="form-control" id="liDesc" rows="4" minlength="30" maxlength="600"
                    placeholder="Describe your item — condition, what's included, any restrictions…" required></textarea>
          <div style="text-align:right;font-size:.68rem;color:var(--muted);margin-top:3px"><span id="liDescCount">0</span>/600</div>
        </div>
      </div>

      <!-- Photos -->
      <div class="form-section" style="margin-bottom:24px">
        <label class="form-label" style="margin-bottom:8px">Photos (up to 6)</label>
        <div id="liDropzone" style="border:2px dashed var(--border-mid);border-radius:var(--radius);padding:28px;text-align:center;cursor:pointer;transition:border-color .2s;color:var(--muted);font-size:.85rem"
             onclick="document.getElementById('liFileInput').click()"
             ondragover="event.preventDefault();this.style.borderColor='var(--cyan)'"
             ondragleave="this.style.borderColor=''"
             ondrop="_liDrop(event)">
          Drag photos here or click to upload
        </div>
        <input type="file" id="liFileInput" accept="image/*" multiple style="display:none"
               onchange="_liFiles(this.files)"/>
        <div id="liPhotoGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:8px;margin-top:12px"></div>
      </div>

      <!-- Pricing -->
      <div class="form-section" style="margin-bottom:24px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px">
          <div class="form-group">
            <label class="form-label" for="liRate">Daily Rate (₱) <span style="color:var(--pink)">*</span></label>
            <input class="form-control" id="liRate" type="number" min="1" placeholder="e.g. 800" required/>
          </div>
          <div class="form-group">
            <label class="form-label" for="liDeposit">Security Deposit (₱) <span style="color:var(--pink)">*</span></label>
            <input class="form-control" id="liDeposit" type="number" min="0" placeholder="e.g. 2000" required/>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px">
          <div class="form-group">
            <label class="form-label" for="liMin">Min Days</label>
            <input class="form-control" id="liMin" type="number" min="1" value="1"/>
          </div>
          <div class="form-group">
            <label class="form-label" for="liMax">Max Days</label>
            <input class="form-control" id="liMax" type="number" min="1" value="30"/>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
          <div class="form-group">
            <label class="form-label" for="liFrom">Available From</label>
            <input class="form-control" id="liFrom" type="date"/>
          </div>
          <div class="form-group">
            <label class="form-label" for="liUntil">Available Until</label>
            <input class="form-control" id="liUntil" type="date"/>
          </div>
        </div>
      </div>

      <div class="form-group" style="margin-bottom:20px">
        <label style="display:flex;align-items:center;gap:10px;font-size:.85rem;cursor:pointer">
          <input type="checkbox" id="liTerms" required/>
          I agree to the T0kenRent rental terms and am the legal owner of this item.
        </label>
      </div>

      <div id="liErr" style="color:var(--danger);font-size:.82rem;margin-bottom:12px;display:none"></div>

      <button type="submit" class="btn btn-primary" id="liSubmit" style="width:100%">List This Item</button>
    </form>
  `;

  // Attach event listeners
  document.getElementById('liTitle').addEventListener('input', e => {
    document.getElementById('liTitleCount').textContent = e.target.value.length;
    _liUpdateSteps();
  });
  document.getElementById('liDesc').addEventListener('input', e => {
    document.getElementById('liDescCount').textContent = e.target.value.length;
    _liUpdateSteps();
  });
  ['liCat', 'liCond', 'liRate', 'liDeposit'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', _liUpdateSteps);
  });
  document.getElementById('liForm').addEventListener('submit', _liSubmit);
}

function _liUpdateSteps() {
  const title = document.getElementById('liTitle')?.value || '';
  const cat   = document.getElementById('liCat')?.value  || '';
  const cond  = document.getElementById('liCond')?.value || '';
  const desc  = document.getElementById('liDesc')?.value || '';
  const rate  = document.getElementById('liRate')?.value || '';
  const dep   = document.getElementById('liDeposit')?.value;

  const s1 = title.length >= 3 && cat && cond && desc.length >= 30;
  const s2 = _liPhotos.length > 0;
  const s3 = rate >= 1 && dep !== '';

  ['liStep1','liStep2','liStep3'].forEach((id, i) => {
    const el = document.getElementById(id);
    if (!el) return;
    const done = [s1,s2,s3][i];
    el.style.borderBottomColor = done ? 'var(--cyan)' : 'var(--border-mid)';
    el.style.color = done ? 'var(--cyan)' : 'var(--muted)';
  });
}

function _liDrop(e) {
  e.preventDefault();
  document.getElementById('liDropzone').style.borderColor = '';
  if (e.dataTransfer?.files) _liFiles(e.dataTransfer.files);
}

function _liFiles(files) {
  const MAX = 6;
  Array.from(files).forEach(file => {
    if (_liPhotos.length >= MAX) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) return; // 5MB max
    const preview = URL.createObjectURL(file);
    _liPhotos.push({ file, preview });
  });
  _liRenderPhotos();
  _liUpdateSteps();
}

function _liRenderPhotos() {
  const grid = document.getElementById('liPhotoGrid');
  if (!grid) return;
  grid.innerHTML = _liPhotos.map((p, i) => `
    <div style="position:relative;border-radius:8px;overflow:hidden;aspect-ratio:1;background:var(--bg-surface)">
      <img src="${p.preview}" style="width:100%;height:100%;object-fit:cover;display:block"/>
      <button onclick="_liRemovePhoto(${i})"
              style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,.6);border:none;
                     color:#fff;width:20px;height:20px;border-radius:50%;cursor:pointer;
                     font-size:.75rem;line-height:1;display:flex;align-items:center;justify-content:center">×</button>
    </div>`).join('');
}

function _liRemovePhoto(i) {
  URL.revokeObjectURL(_liPhotos[i].preview);
  _liPhotos.splice(i, 1);
  _liRenderPhotos();
  _liUpdateSteps();
}

async function _liSubmit(e) {
  e.preventDefault();
  const errEl  = document.getElementById('liErr');
  const btn    = document.getElementById('liSubmit');
  errEl.style.display = 'none';

  const title  = document.getElementById('liTitle').value.trim();
  const cat    = document.getElementById('liCat').value;
  const cond   = document.getElementById('liCond').value;
  const desc   = document.getElementById('liDesc').value.trim();
  const rate   = parseFloat(document.getElementById('liRate').value);
  const dep    = parseFloat(document.getElementById('liDeposit').value);
  const minD   = parseInt(document.getElementById('liMin').value) || 1;
  const maxD   = parseInt(document.getElementById('liMax').value) || 30;
  const from   = document.getElementById('liFrom').value;
  const until  = document.getElementById('liUntil').value;
  const terms  = document.getElementById('liTerms').checked;

  if (!title || title.length < 3)  { _liErr('Title must be at least 3 characters.'); return; }
  if (!cat)    { _liErr('Please select a category.'); return; }
  if (!cond)   { _liErr('Please select a condition.'); return; }
  if (desc.length < 30) { _liErr('Description must be at least 30 characters.'); return; }
  if (!rate || rate < 1){ _liErr('Daily rate must be at least ₱1.'); return; }
  if (isNaN(dep) || dep < 0) { _liErr('Deposit must be 0 or more.'); return; }
  if (!terms)  { _liErr('You must agree to the terms.'); return; }

  btn.disabled = true; btn.textContent = 'Listing…';

  const fd = new FormData();
  fd.append('title', title);
  fd.append('description', desc);
  fd.append('category', cat);
  fd.append('condition', cond);
  fd.append('dailyRate', rate);
  fd.append('securityDeposit', dep);
  fd.append('minDays', minD);
  fd.append('maxDays', maxD);
  if (from)  fd.append('availableFrom', from);
  if (until) fd.append('availableTo',   until);
  _liPhotos.forEach(p => fd.append('photos', p.file));

  try {
    const res  = await fetch('/api/items', { method: 'POST', body: fd, credentials: 'include' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create listing');
    // Navigate to My Items so user sees the new listing
    navigate('#items');
    if (typeof loadMyItems === 'function') loadMyItems();
  } catch (err) {
    _liErr(err.message);
    btn.disabled = false; btn.textContent = 'List This Item';
  }
}

function _liErr(msg) {
  const el = document.getElementById('liErr');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
}
```

- [ ] **Step 2: Expose new globals**

Add to the exports block:
```js
window._liRemovePhoto = _liRemovePhoto;
window._liDrop        = _liDrop;
```

- [ ] **Step 3: Verify List an Item view**

Click "List an Item" in the sidebar. Expected:
- Form renders with all fields (title, category, condition, description, photo upload, pricing)
- Step indicators at the top light up as fields are filled
- Photo drag-and-drop works (try dragging an image onto the dropzone)
- Form submission calls `POST /api/items` and navigates to `#items` on success

- [ ] **Step 4: Commit**

```bash
git -C /Users/ian/Desktop/TokenRent add frontend/dashboard.js
git -C /Users/ian/Desktop/TokenRent commit -m "feat: list-an-item view in unified shell"
```

---

## Task 7: Redirect Stubs

**Files:**
- Modify: `frontend/browse.html`
- Modify: `frontend/list-item.html`

- [ ] **Step 1: Replace browse.html body with redirect stub**

Read `frontend/browse.html`. Keep the entire `<head>` section intact (with meta tags, OG tags, favicon, CSS links). Replace everything from `<body>` to `</body>` (inclusive) with:

```html
<body>
  <script>
    // Browsing is now part of the authenticated shell.
    location.replace('dashboard.html#browse');
  </script>
</body>
```

- [ ] **Step 2: Replace list-item.html body with redirect stub**

Read `frontend/list-item.html`. Keep the entire `<head>` section intact. Replace everything from `<body>` to `</body>` (inclusive) with:

```html
<body>
  <script>
    // Listing is now part of the authenticated shell.
    location.replace('dashboard.html#list');
  </script>
</body>
```

- [ ] **Step 3: Verify redirects work**

Open `browse.html` directly in the browser. Should immediately redirect to `dashboard.html#browse`.
Open `list-item.html` directly. Should redirect to `dashboard.html#list`.

- [ ] **Step 4: Commit**

```bash
git -C /Users/ian/Desktop/TokenRent add frontend/browse.html frontend/list-item.html
git -C /Users/ian/Desktop/TokenRent commit -m "feat: browse.html and list-item.html redirect to unified shell"
```

---

## Task 8: Index.html Auto-Redirect

**Files:**
- Modify: `frontend/index.html`

- [ ] **Step 1: Add auth-check redirect to index.html**

Read `frontend/index.html`. Find the inline `<script>` block near the bottom that currently contains the `DOMContentLoaded` listener and `toggleNav` function. It looks like:

```js
document.addEventListener('DOMContentLoaded', () => {
  if (window.Auth && Auth.isAuthed()) {
    // ... updates CTA button ...
  }
});
```

Replace that `DOMContentLoaded` callback body with:

```js
document.addEventListener('DOMContentLoaded', () => {
  Auth.ready().then(user => {
    if (user) {
      // Logged-in users go straight to the app shell
      window.location.replace('dashboard.html#browse');
      return;
    }
    // Not logged in — update nav CTA as before
    const cta = document.querySelector('.nav-cta');
    if (cta) {
      // CTA stays as "Get Started" for guests
    }
  });
});
```

- [ ] **Step 2: Verify the redirect**

Log in to the app. Then navigate to `index.html` directly. Should immediately redirect to `dashboard.html#browse`.

Log out (`Auth.signOut()`). Navigate to `index.html`. Should stay on the landing page.

- [ ] **Step 3: Commit**

```bash
git -C /Users/ian/Desktop/TokenRent add frontend/index.html
git -C /Users/ian/Desktop/TokenRent commit -m "feat: auto-redirect logged-in users from index to app shell"
```

---

## Task 9: Integration Smoke Test + Push

- [ ] **Step 1: Full integration walkthrough**

With the server running, test the complete flow:

1. Visit `index.html` logged out → stays on landing page ✓
2. Log in → redirected to `dashboard.html#browse` ✓
3. Browse grid loads with item cards ✓
4. Click a category pill → grid filters ✓
5. Click an item → panel slides in from right with photo, title, owner, pricing ✓
6. Fill in dates → total updates ✓
7. Click × or press Escape → panel closes ✓
8. Click "List an Item" in sidebar → form renders ✓
9. Fill out form → "List This Item" → navigates to `#items` ✓
10. Visit `browse.html` directly → redirects to `dashboard.html#browse` ✓
11. Visit `list-item.html` directly → redirects to `dashboard.html#list` ✓
12. Browser back/forward works correctly ✓

- [ ] **Step 2: Check no console errors on any view**

Open DevTools console. Navigate through Browse, List Item, Overview, My Rentals, Pending, My Items. No uncaught errors.

- [ ] **Step 3: Push to GitHub**

```bash
git -C /Users/ian/Desktop/TokenRent push origin main
```

---

## Self-Review Notes

### Spec Coverage
- ✅ §2.1 File changes — all 6 files covered across tasks 1–8
- ✅ §3 Shell layout — sidebar updated in Task 2, tr-nav removed in Task 2
- ✅ §3.2 Nav items + badges — all entries added with `data-view` attrs
- ✅ §4 Hash router — Task 3 with `parseHash`, `navigate`, `loadView`, `hashchange`
- ✅ §4.1 All 9 routes — handled in `loadView` switch
- ✅ §5.1 Browse view — Task 4 with search, filters, grid, skeletons, empty state
- ✅ §5.2 List Item view — Task 6 with full form, photo upload, step progress, POST /api/items
- ✅ §5.3 Existing views wired to router — Task 3 calls `loadStats`, `loadOverview`, etc.
- ✅ §6 Item detail panel — Task 5 with slide-in, booking form, Escape key
- ✅ §6.3 Panel close triggers — × button, Escape, mobile overlay
- ✅ §7.1–7.3 Redirects — Task 7 (browse/list stubs) + Task 8 (index auto-redirect)
- ✅ §8 Mobile — CSS in Task 1 handles full-screen panel on ≤768px
- ✅ §9 Error handling — inline errors in browse fetch, panel fetch, form submit

### No placeholders found — all steps include complete code.

### Type/name consistency
- `navigate(hash)` — defined Task 3, called in Task 2 (sidebar onclick) ✓
- `openItemPanel(itemId)` — defined Task 5, called in Task 4 (`_bRender`) ✓
- `closeItemPanel()` — defined Task 5, referenced in Task 2 (panel HTML) ✓
- `ipCalcTotal()` — defined Task 5, referenced in Task 2 (`onchange` attrs) ✓
- `ipBook()` — defined Task 5, referenced in Task 2 (panel HTML) ✓
- `_liRemovePhoto(i)` — defined Task 6, exposed to window in Task 6 ✓
- `_liDrop(e)` — defined Task 6, exposed to window in Task 6 ✓
- `loadBrowseView(params)` — defined Task 4, called in Task 3 router ✓
- `loadListView()` — defined Task 6, called in Task 3 router ✓
