/* ==============================================================
   T0kenRent — Rental Detail Modal
   open/close · tabs · Overview tab · Contract tab · Chat tab
   ============================================================== */

'use strict';

let _rdmId     = null;   // current rental ID
let _rdmRental = null;   // current rental data

/* ── Utilities ───────────────────────────────────────────────── */
const _$ = id => document.getElementById(id);
const _fmt$ = n => '₱' + (n || 0).toLocaleString('en-PH');
const _fmtDate = d => new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
const _fmtTime = d => new Date(d).toLocaleString('en-PH',     { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const _fmtShort = d => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) : null;
const _esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

/* ── Open ────────────────────────────────────────────────────── */
async function openRentalModal(rentalId) {
  _rdmId     = rentalId;
  _rdmRental = null;

  // Reset to Overview tab
  document.querySelectorAll('.rdm-tab').forEach((t, i)  => t.classList.toggle('active', i === 0));
  document.querySelectorAll('.rdm-pane').forEach((p, i) => p.classList.toggle('active', i === 0));

  // Clear previous content
  _$('rdmThumb').innerHTML       = '';
  _$('rdmItemName').textContent  = 'Loading…';
  _$('rdmItemMeta').textContent  = '';
  _$('rdmStatusBadge').outerHTML = '<span id="rdmStatusBadge"></span>';
  _$('rdmOverviewContent').innerHTML = '<div class="rdm-loading">Loading…</div>';
  _$('rdmContractContent').innerHTML = '<div class="rdm-loading">Loading…</div>';
  _$('rdmChatContent').innerHTML     = '<div class="rdm-loading">Loading…</div>';

  // Show overlay
  _$('rdmOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';

  // Fetch rental
  try {
    const res  = await fetch(`/api/rentals/${rentalId}`, { credentials: 'include' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load rental');
    _rdmRental = data.rental;
    _rdmRenderHeader();
    _rdmRenderOverview();
  } catch (err) {
    _$('rdmItemName').textContent = 'Error';
    _$('rdmOverviewContent').innerHTML =
      `<div class="rdm-loading" style="color:var(--danger)">
        ${_esc(err.message)}
        <br/><br/>
        <button class="btn btn-ghost btn-sm" onclick="openRentalModal('${rentalId}')">Retry</button>
      </div>`;
  }
}

/* ── Close ───────────────────────────────────────────────────── */
function closeRentalModal(evt) {
  // If called from overlay click, only close if the click target is the overlay itself
  if (evt && evt.target !== _$('rdmOverlay')) return;
  _$('rdmOverlay').classList.remove('open');
  document.body.style.overflow = '';
  _rdmId     = null;
  _rdmRental = null;
}

// Close on Escape key
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeRentalModal(); });

/* ── Tab switching ───────────────────────────────────────────── */
function rdmSwitchTab(name, btn) {
  document.querySelectorAll('.rdm-tab').forEach(t  => t.classList.remove('active'));
  document.querySelectorAll('.rdm-pane').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  _$('rdm-' + name).classList.add('active');

  if (!_rdmRental) return;
  if (name === 'contract') _rdmRenderContract();
  if (name === 'chat')     _rdmLoadChat();
}

/* ── Header ──────────────────────────────────────────────────── */
function _rdmRenderHeader() {
  const r  = _rdmRental;
  const it = r.item || {};
  const cover = (it.photos && it.photos[0] && it.photos[0].url) ||
                `https://picsum.photos/seed/${r._id}/120/120`;

  _$('rdmThumb').innerHTML = `<img src="${_esc(cover)}" alt="${_esc(it.title || '')}" onerror="this.style.display='none'"/>`;
  _$('rdmItemName').textContent = it.title || 'Item';
  _$('rdmItemMeta').textContent = [it.category, it.condition].filter(Boolean).join(' · ');

  const statusCls = {
    pending: 'badge-pending', accepted: 'badge-rented', active: 'badge-rented',
    overdue: 'badge-overdue', returned: 'badge-completed', completed: 'badge-completed',
    declined: 'badge-overdue', cancelled: 'badge-overdue', disputed: 'badge-overdue',
  };
  const badge = _$('rdmStatusBadge');
  badge.className = `badge ${statusCls[r.status] || 'badge-neutral'}`;
  badge.textContent = r.status;
}

/* ── Overview tab ────────────────────────────────────────────── */
function _rdmRenderOverview() {
  const r  = _rdmRental;
  const me = Auth.get();

  // Identify counterparty
  const myId    = me ? me._id : null;
  const isOwner = myId && r.owner  && myId === (r.owner._id  || r.owner);
  const party   = isOwner ? r.renter : r.owner;
  const role    = isOwner ? 'Renter' : 'Owner';
  const partyName = party ? (party.handcashHandle || party.name || 'User') : '—';
  const initials  = partyName.slice(0, 2).toUpperCase();
  const partySub  = party && party.location ? party.location : (party && party.handcashHandle ? party.handcashHandle : '');

  // Timeline
  const stages = ['pending', 'accepted', 'active', 'returned', 'completed'];
  const stageTs = {
    pending:   r.createdAt,
    accepted:  r.acceptedAt,
    active:    r.pickedUpAt || r.acceptedAt,
    returned:  r.returnedAt,
    completed: r.returnedAt,
  };
  const branchStatus = ['declined', 'cancelled', 'disputed'];
  const currentIdx = branchStatus.includes(r.status) ? 0 : stages.indexOf(r.status);

  const timelineHTML = stages.map((s, i) => {
    const done = i < currentIdx;
    const cur  = i === currentIdx;
    const ts   = stageTs[s] ? _fmtShort(stageTs[s]) : '';
    const lineClass = i < stages.length - 1
      ? `<div class="rdm-tl-line${done || cur ? ' done' : ''}"></div>` : '';
    return `
      <div class="rdm-tl-step">
        <div class="rdm-tl-dot${cur ? ' current' : done ? ' done' : ''}"></div>
        <div class="rdm-tl-name${done || cur ? ' done' : ''}">${s}</div>
        ${ts ? `<div class="rdm-tl-ts">${ts}</div>` : '<div class="rdm-tl-ts">&nbsp;</div>'}
      </div>${lineClass}`;
  }).join('');

  // Branch badge (declined / cancelled / disputed)
  const branchBadge = branchStatus.includes(r.status)
    ? `<div style="margin-top:10px"><span class="badge badge-overdue">${r.status}</span></div>` : '';

  // Action buttons
  const viewBtn = `<a class="btn btn-ghost btn-sm" href="item-detail.html?id=${_esc((r.item && r.item._id) || '')}" onclick="event.stopPropagation()">View Item</a>`;
  let actions = viewBtn;
  if (isOwner && r.status === 'pending') {
    actions += `<button class="btn btn-primary btn-sm" onclick="rdmAction('${r._id}','accept')">Accept</button>
                <button class="btn btn-ghost btn-sm"   onclick="rdmAction('${r._id}','decline')">Decline</button>`;
  }
  if (isOwner && ['accepted', 'active', 'overdue'].includes(r.status)) {
    actions += `<button class="btn btn-ghost btn-sm" onclick="rdmAction('${r._id}','return')">Mark Returned</button>`;
  }
  if (!isOwner && r.status === 'pending') {
    actions += `<button class="btn btn-ghost btn-sm" onclick="rdmAction('${r._id}','cancel')">Cancel Booking</button>`;
  }
  if (!isOwner && r.status === 'completed' && !r.review) {
    actions += `<button class="btn btn-purple btn-sm" onclick="alert('Review feature coming soon.')">Leave Review</button>`;
  }

  _$('rdmOverviewContent').innerHTML = `
    <div class="rdm-overview-grid">
      <div class="rdm-party-card">
        <div class="rdm-av">${_esc(initials)}</div>
        <div>
          <div class="rdm-av-label">${_esc(role)}</div>
          <div class="rdm-av-name">${_esc(partyName)}</div>
          ${partySub ? `<div class="rdm-av-sub">${_esc(partySub)}</div>` : ''}
        </div>
      </div>
      <div>
        <div style="font-size:.74rem;color:var(--muted);margin-bottom:10px">
          ${_fmtDate(r.startDate)} – ${_fmtDate(r.endDate)} &nbsp;·&nbsp; ${r.days} day${r.days !== 1 ? 's' : ''}
        </div>
        <table class="rdm-price-table">
          <tr><td>Daily rate</td>     <td>${_fmt$(r.dailyRate)}/day</td></tr>
          <tr><td>Subtotal</td>       <td>${_fmt$(r.subtotal)}</td></tr>
          <tr><td>Platform fee (5%)</td><td>${_fmt$(r.platformFee)}</td></tr>
          <tr><td>Security deposit</td><td>${_fmt$(r.securityDeposit)}</td></tr>
          <tr class="rdm-price-total"><td>Total</td><td>${_fmt$(r.total)}</td></tr>
        </table>
      </div>
    </div>
    <div class="rdm-tl-label-row">Timeline</div>
    <div class="rdm-timeline">${timelineHTML}</div>
    ${branchBadge}
    <div class="rdm-actions">${actions}</div>
  `;
}

/* ── Expose globals ──────────────────────────────────────────── */
window.openRentalModal  = openRentalModal;
window.closeRentalModal = closeRentalModal;
window.rdmSwitchTab     = rdmSwitchTab;
