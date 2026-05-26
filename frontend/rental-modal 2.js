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

/* ── Contract tab ────────────────────────────────────────────── */
async function _rdmRenderContract() {
  if (!_rdmRental) return;
  const r  = _rdmRental;
  const it = r.item || {};
  const el = _$('rdmContractContent');

  // Generate deterministic SHA-256 hash from rental key fields
  const raw = `${r._id}|${(it._id || '')}|${r.startDate}|${r.endDate}|${r.total}`;
  const buf  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  const hex  = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  // Display as 0x + groups of 16 for readability
  const displayHash = '0x' + hex.match(/.{1,16}/g).join(' ');
  const fullHash    = '0x' + hex;

  const ownerName  = r.owner  ? (r.owner.handcashHandle  || r.owner.name  || 'Owner')  : '—';
  const renterName = r.renter ? (r.renter.handcashHandle || r.renter.name || 'Renter') : '—';
  const ownerLoc   = r.owner  && r.owner.location  ? ` · ${r.owner.location}`  : '';
  const renterLoc  = r.renter && r.renter.location ? ` · ${r.renter.location}` : '';
  // Contract total = subtotal + deposit (no platform fee on the blockchain view)
  const contractTotal = (r.subtotal || 0) + (r.securityDeposit || 0);

  el.innerHTML = `
    <div class="rdm-contract">
      <div class="rdm-contract-head">
        <div class="rdm-contract-title">RENTAL AGREEMENT</div>
        <div class="rdm-verified">Verified</div>
      </div>
      <div class="rdm-hash">${_esc(displayHash)}</div>
      <div class="rdm-issued">Issued: ${_fmtTime(r.createdAt)}</div>

      <div class="rdm-c-section">Parties</div>
      <div class="rdm-c-row"><span class="k">Owner</span><span class="v">${_esc(ownerName + ownerLoc)}</span></div>
      <div class="rdm-c-row"><span class="k">Renter</span><span class="v">${_esc(renterName + renterLoc)}</span></div>

      <div class="rdm-c-section">Item</div>
      <div class="rdm-c-row"><span class="k">Name</span><span class="v">${_esc(it.title || '—')}</span></div>
      <div class="rdm-c-row"><span class="k">Category</span><span class="v">${_esc(it.category || '—')}</span></div>
      <div class="rdm-c-row"><span class="k">Condition</span><span class="v">${_esc(it.condition || '—')}</span></div>

      <div class="rdm-c-section">Terms</div>
      <div class="rdm-c-row"><span class="k">Period</span><span class="v">${_fmtDate(r.startDate)} – ${_fmtDate(r.endDate)} (${r.days} days)</span></div>
      <div class="rdm-c-row"><span class="k">Daily rate</span><span class="v">${_fmt$(r.dailyRate)}</span></div>
      <div class="rdm-c-row"><span class="k">Subtotal</span><span class="v">${_fmt$(r.subtotal)}</span></div>
      <div class="rdm-c-row"><span class="k">Network fee</span><span class="v">&lt; 0.00001 BSV (micropayment)</span></div>
      <div class="rdm-c-row"><span class="k">Deposit</span><span class="v">${_fmt$(r.securityDeposit)} (refundable)</span></div>
      <div class="rdm-c-row rdm-c-total"><span class="k">Total</span><span class="v">${_fmt$(contractTotal)}</span></div>

      <div class="rdm-c-section">Network</div>
      <div class="rdm-c-row"><span class="k">Chain</span><span class="v">Bitcoin SV (BSV)</span></div>
      <div class="rdm-c-row"><span class="k">Ledger</span><span class="v">Simulated</span></div>
      <div class="rdm-c-row"><span class="k">Confirmations</span><span class="v">6 ✓</span></div>
    </div>
    <button class="rdm-copy-btn" id="rdmCopyBtn" onclick="rdmCopyHash('${_esc(fullHash)}')">
      Copy Contract ID
    </button>
  `;
}

async function rdmCopyHash(hash) {
  try {
    await navigator.clipboard.writeText(hash);
    const btn = _$('rdmCopyBtn');
    if (!btn) return;
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = 'Copy Contract ID';
      btn.classList.remove('copied');
    }, 2000);
  } catch (e) { /* clipboard not available */ }
}

/* ── Chat tab ────────────────────────────────────────────────── */
async function _rdmLoadChat() {
  if (!_rdmRental) return;
  const r  = _rdmRental;
  const it = r.item || {};
  const el = _$('rdmChatContent');

  el.innerHTML = `
    <div class="rdm-chat-ctx">${_esc(it.title || 'Item')} · ${_fmtDate(r.startDate)} – ${_fmtDate(r.endDate)}</div>
    <div class="rdm-chat-wrap">
      <div class="rdm-chat-head">
        <button class="rdm-chat-refresh" onclick="_rdmRefreshChat()">↻ Refresh</button>
      </div>
      <div class="rdm-thread" id="rdmThread"></div>
      <div class="rdm-chat-input">
        <input id="rdmMsgInput" type="text" placeholder="Type a message…" maxlength="1000"
               onkeydown="if(event.key==='Enter')rdmSendMessage()"/>
        <button class="btn btn-primary btn-sm" onclick="rdmSendMessage()">Send</button>
      </div>
      <div class="rdm-chat-err" id="rdmChatErr"></div>
    </div>
  `;
  await _rdmRefreshChat();
}

async function _rdmRefreshChat() {
  const thread = _$('rdmThread');
  if (!thread || !_rdmId) return;
  try {
    const res  = await fetch(`/api/rentals/${_rdmId}/messages`, { credentials: 'include' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load messages');
    _rdmRenderThread(data.messages);
  } catch (err) {
    thread.innerHTML = `<div class="rdm-thread-empty" style="color:var(--danger)">${_esc(err.message)}</div>`;
  }
}

function _rdmRenderThread(messages) {
  const thread = _$('rdmThread');
  if (!thread) return;
  if (!messages.length) {
    thread.innerHTML = '<div class="rdm-thread-empty">No messages yet. Send the first one.</div>';
    return;
  }
  const me = Auth.get();
  const myId = me ? me._id : null;
  const fmtTS = d => new Date(d).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });

  thread.innerHTML = messages.map(msg => {
    const senderId = msg.sender ? (msg.sender._id || msg.sender) : null;
    const isMine   = myId && senderId && myId === senderId;
    const name     = msg.sender ? (msg.sender.handcashHandle || msg.sender.name || 'User') : 'User';
    return `
      <div class="rdm-bw${isMine ? ' mine' : ''}">
        ${!isMine ? `<div class="rdm-b-sender">${_esc(name)}</div>` : ''}
        <div class="rdm-bubble ${isMine ? 'mine' : 'theirs'}">${_esc(msg.text)}</div>
        <div class="rdm-b-ts">${fmtTS(msg.createdAt)}</div>
      </div>`;
  }).join('');

  thread.scrollTop = thread.scrollHeight;
}

async function rdmSendMessage() {
  const input = _$('rdmMsgInput');
  const errEl = _$('rdmChatErr');
  if (!input || !_rdmId) return;
  const text = input.value.trim();
  if (!text) return;

  if (errEl) errEl.style.display = 'none';

  // Optimistic UI — append immediately
  const thread = _$('rdmThread');
  const emptyEl = thread && thread.querySelector('.rdm-thread-empty');
  if (emptyEl) emptyEl.remove();
  const fmtTS = d => new Date(d).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
  if (thread) {
    thread.insertAdjacentHTML('beforeend', `
      <div class="rdm-bw mine">
        <div class="rdm-bubble mine">${_esc(text)}</div>
        <div class="rdm-b-ts">${fmtTS(new Date())}</div>
      </div>`);
    thread.scrollTop = thread.scrollHeight;
  }
  input.value = '';

  try {
    const res = await fetch(`/api/rentals/${_rdmId}/messages`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Send failed');
    await _rdmRefreshChat(); // replace optimistic with server-confirmed version
  } catch (err) {
    if (errEl) { errEl.textContent = err.message; errEl.style.display = 'block'; }
    if (input)  input.value = text; // restore unsent text
  }
}

/* ── Action handler (accept / decline / cancel / return) ─────── */
async function rdmAction(rentalId, action) {
  const confirmMsgs = {
    decline: 'Decline this booking request?',
    cancel:  'Cancel this booking?',
    return:  'Confirm the item has been returned and release the deposit?',
  };
  if (confirmMsgs[action] && !confirm(confirmMsgs[action])) return;

  try {
    const res  = await fetch(`/api/rentals/${rentalId}/${action}`, {
      method: 'PATCH', credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Action failed');

    // Reload rental data and re-render Overview
    const res2  = await fetch(`/api/rentals/${rentalId}`, { credentials: 'include' });
    const data2 = await res2.json();
    if (res2.ok) {
      _rdmRental = data2.rental;
      _rdmRenderHeader();
      _rdmRenderOverview();
    }

    // Refresh dashboard tables so counts update
    if (typeof loadStats    === 'function') loadStats();
    if (typeof loadOverview === 'function') loadOverview();
    if (typeof loadPending  === 'function') loadPending();
    if (typeof loadMyItems  === 'function') loadMyItems();
  } catch (err) {
    alert(err.message);
  }
}

/* ── Expose globals ──────────────────────────────────────────── */
window.openRentalModal  = openRentalModal;
window.closeRentalModal = closeRentalModal;
window.rdmSwitchTab     = rdmSwitchTab;
window.rdmCopyHash      = rdmCopyHash;
window.rdmSendMessage   = rdmSendMessage;
window.rdmAction        = rdmAction;
window._rdmRefreshChat  = _rdmRefreshChat;
