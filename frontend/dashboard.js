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
  const startEl = document.getElementById('ipStart');
  const endEl   = document.getElementById('ipEnd');
  if (startEl) startEl.value = '';
  if (endEl)   endEl.value   = '';

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
  if (days <= 0 || isNaN(days)) { totalEl.textContent = 'Invalid range'; return; }
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

/* ── Expose globals ──────────────────────────────────────────── */
window.navigate    = navigate;
window._bSchedule  = _bSchedule;
window._bSortChange = _bSortChange;
window._bSetCat    = _bSetCat;
window._bFetch     = _bFetch;
window.openItemPanel  = openItemPanel;
window.closeItemPanel = closeItemPanel;
window.ipCalcTotal    = ipCalcTotal;
window.ipBook         = ipBook;
window._liRemovePhoto = _liRemovePhoto;
window._liDrop        = _liDrop;
window._liFiles       = _liFiles;
