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
      <button class="btn btn-ghost btn-sm" onclick="_bSetCat('all');_bState.search='';const s=document.getElementById('bSearch');if(s)s.value='';">Clear filters</button>
    </div>`;
    return;
  }

  const statusCls = { available:'badge-completed', rented:'badge-rented', overdue:'badge-overdue', unavailable:'badge-overdue' };

  grid.innerHTML = items.map(it => {
    const cover = (it.photos && it.photos[0] && it.photos[0].url) ||
                  `https://picsum.photos/seed/${_esc(it.category||'item')}-${_esc(it._id)}/400/300`;
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

/* ── Expose globals ──────────────────────────────────────────── */
window.navigate    = navigate;
window._bSchedule  = _bSchedule;
window._bSortChange = _bSortChange;
window._bSetCat    = _bSetCat;
window._bFetch     = _bFetch;
