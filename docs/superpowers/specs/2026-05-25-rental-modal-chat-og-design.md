# Design Spec: Rental Detail Modal, Mock Contract, Chat, OG + Favicon

**Date:** 2026-05-25
**Status:** Approved
**Scope:** Dashboard rental detail modal (tabbed), mock smart contract, message thread, OG image + favicon

---

## 1. Overview

Four features delivered as a cohesive unit:

1. **Rental Detail Modal** — click any rental row → tabbed modal with Overview, Contract, Chat
2. **Mock Smart Contract** — deterministic SHA-256 hash from rental data, displayed as a BSV contract
3. **Chat Thread** — message thread per rental, stored in MongoDB, manual refresh (no real-time)
4. **OG Image + Favicon** — social share card and browser icon across all pages

---

## 2. Architecture

### New files
| File | Purpose |
|---|---|
| `backend/models/Message.js` | Chat message model |
| `backend/controllers/messages.controller.js` | Fetch + send message handlers |
| `backend/routes/messages.routes.js` | Route definitions |
| `frontend/rental-modal.js` | All modal logic: tabs, contract hash, chat UI |
| `frontend/favicon.svg` | SVG favicon — T0 logomark in cyan |
| `frontend/og-image.png` | 1200×630 OG share card |

### Modified files
| File | Change |
|---|---|
| `backend/app.js` | Register message routes |
| `frontend/dashboard.html` | Rental rows clickable, modal HTML added |
| `frontend/styles.css` | Modal, tab, chat bubble, contract styles |
| All 8 HTML files | OG meta tags + favicon link |

---

## 3. Data Model

### Message
```js
{
  rental:     ObjectId → Rental   // indexed
  sender:     ObjectId → User
  text:       String, required, trim, maxlength: 1000
  createdAt:  Date (auto)
  updatedAt:  Date (auto)
}
```

**Authorization rule:** Only the rental's `owner` or `renter` may read or write messages for a rental. Verified server-side on every request.

---

## 4. API Endpoints

Both endpoints require authentication (`requireAuth` middleware).

| Method | Path | Body | Response |
|---|---|---|---|
| `GET` | `/api/rentals/:id/messages` | — | `{ messages: [...] }` with sender populated (name, handcashHandle) |
| `POST` | `/api/rentals/:id/messages` | `{ text }` | `{ message }` newly created |

Error cases:
- 403 if requester is not the rental's owner or renter
- 404 if rental not found
- 400 if text is empty or missing

Route registered in `app.js` as `/api/rentals` (nested under existing rental routes or as separate).

---

## 5. Rental Detail Modal

### Trigger
Every rental row in all dashboard tables gets `onclick="openRentalModal('RENTAL_ID')"`. The function fetches `GET /api/rentals/:id` (new endpoint — does not currently exist), builds the modal, and shows it.

**New endpoint required:** `GET /api/rentals/:id` — fetch single rental, populated with `item` (photos, title, category, condition) and `owner` + `renter` (name, handcashHandle, isVerified, location). Auth: must be the rental's owner or renter, or admin. Add to `rentals.routes.js` and `rentals.controller.js`.

### Shell
- Full-screen overlay (`position: fixed, inset: 0, z-index: 1050`)
- Centered panel, `max-width: 720px`, `max-height: 90vh`, scrollable
- Dark card background (`var(--bg-card)`), `border: 1px solid rgba(0,200,255,.2)`, `border-radius: 18px`
- Header: 48px item thumbnail, item name + category, status badge, close button (×)
- Tab pills below header: **Overview · Contract · Chat**
- Close on overlay click or Escape key

### Tab: Overview

**Left column (counterparty):**
- 80px avatar or initials circle
- Display name + HandCash handle
- Verified badge if `isVerified`
- Role label (Owner / Renter)

**Right column (booking details):**
- Date range + duration in days
- Pricing table:
  - Daily rate × days = subtotal
  - Platform fee (5%)
  - Security deposit (refundable)
  - **Total** (bold)

**Lifecycle timeline:**
- Horizontal dot-and-line: `pending → accepted → active → returned → completed`
- Each dot filled + timestamp shown if that stage occurred
- Future stages grayed out
- Branches (declined, cancelled, disputed) shown if applicable

**Action buttons (role + status aware):**

| Role | Status | Actions |
|---|---|---|
| Owner | pending | Accept, Decline |
| Owner | active / overdue | Mark Returned |
| Renter | pending | Cancel |
| Renter | completed | Leave Review (if no review yet) |
| Either | any | View Item → item-detail.html?id=X |

### Tab: Contract

Visual treatment: document aesthetic — monospace hash, dotted dividers, VERIFIED stamp badge (green pill, top-right).

**Contract hash generation (client-side):**
```js
async function generateContractHash(rental) {
  const raw = `${rental._id}|${rental.item._id}|${rental.startDate}|${rental.endDate}|${rental.total}`;
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}
```
Deterministic — same rental always produces the same hash.
Displayed as `0x` + hash split into 4 groups of 16 chars for readability.

**Contract document layout:**
```
RENTAL AGREEMENT                      ● VERIFIED
Contract ID: 0xa3f8c2d1e7b4091f
               9c3d5e8a2f1b6047e ...
Issued: May 25, 2026 at 14:32 UTC

PARTIES
Owner    $wyneth · Makati City
Renter   $isaac  · BGC

ITEM
Sony A7III Camera Kit · Electronics
Condition: Excellent

TERMS
Period    May 28 – Jun 2, 2026 (5 days)
Daily     ₱800
Subtotal  ₱4,000
Network   < 0.00001 BSV (micropayment)
Deposit   ₱2,000 (refundable)
Total     ₱6,000

NETWORK
Bitcoin SV (BSV) · Simulated Ledger
Block confirmations: 6 ✓
```

**[ Copy Contract ID ]** button copies `0x...` hash to clipboard. Shows "Copied!" feedback for 2 seconds.

Note: The Overview tab shows the actual platform fee (5%). The Contract tab omits it — only the BSV network micropayment fee appears, reflecting the peer-to-peer blockchain framing.

### Tab: Chat

**Context line** (top, always visible): Item name — May 28 to Jun 2

**Message thread** (`320px` fixed height, overflow-y scroll):
- Counterparty messages: left-aligned, `var(--bg-surface)` bubble
- Own messages: right-aligned, `rgba(0,200,255,.12)` bubble
- Each bubble: sender name (small, above), message text, timestamp (small, below, `var(--muted)`)
- Empty state: "No messages yet. Send the first one."

**Refresh:** "↻ Refresh" link top-right, re-fetches messages on click.

**Input area (bottom, sticky):**
- Single-line text input, `flex: 1`
- **Send** button (cyan primary)
- Enter key submits
- Input cleared after send
- Optimistic: new message appended immediately, then confirmed by re-fetch

---

## 6. OG Image + Favicon

### Favicon (`frontend/favicon.svg`)
SVG, `viewBox="0 0 64 64"`:
- Dark navy circle fill (`#0B0B12`)
- "T" in white, Syne bold
- "0" in cyan (`#00C8FF`), Syne bold
- Referenced from all pages: `<link rel="icon" type="image/svg+xml" href="favicon.svg"/>`

### OG Image (`frontend/og-image.png`)
1200×630px PNG:
- Background: `#0B0B12`
- Purple glow blob top-left, cyan glow blob bottom-right (blurred circles, low opacity)
- Center-left: "T0kenRent" — Syne 800, white with "0" in cyan (`#00C8FF`)
- Below logo: "Smart Peer-to-Peer Equipment Rental" — DM Sans light, `#9CA3AF`
- Bottom-right: "Powered by BSV" small badge
- Thin cyan+purple gradient line along bottom edge

### Meta tags (all 8 HTML files)
```html
<link rel="icon" type="image/svg+xml" href="favicon.svg"/>
<meta property="og:type"        content="website"/>
<meta property="og:site_name"   content="T0kenRent"/>
<meta property="og:image"       content="https://tokenrent-psi.vercel.app/og-image.png"/>
<meta name="twitter:card"       content="summary_large_image"/>
<meta name="twitter:image"      content="https://tokenrent-psi.vercel.app/og-image.png"/>
```

Page-specific overrides per file:

| File | og:title | og:description | og:url |
|---|---|---|---|
| index.html | T0kenRent — Smart P2P Equipment Rental | Rent equipment from your community. Transparent, tracked, and blockchain-backed. | / |
| browse.html | Browse Equipment — T0kenRent | Find cameras, tools, vehicles and more from verified local owners. | /browse.html |
| list-item.html | List Your Item — T0kenRent | Earn from gear you don't use every day. List in minutes. | /list-item.html |
| dashboard.html | Dashboard — T0kenRent | Manage your rentals, listings, and earnings. | /dashboard.html |
| item-detail.html | T0kenRent | Rent this item on T0kenRent. | /item-detail.html |
| login.html | Sign In — T0kenRent | Sign in or create your T0kenRent account. | /login.html |
| how-it-works.html | How It Works — T0kenRent | How T0kenRent's blockchain rental process works. | /how-it-works.html |
| admin.html | Admin — T0kenRent | Platform control panel. | /admin.html |

---

## 7. Error Handling

- **Modal fetch fails:** Show inline error state inside the modal ("Failed to load rental details. Try again.") with a retry button.
- **Message send fails:** Show error below the input ("Message failed to send."), do not clear input.
- **Contract hash:** `crypto.subtle` is available in all modern browsers on HTTPS. No fallback needed — Vercel serves HTTPS.
- **Empty states:** All tabs have explicit empty states (no rentals, no messages).

---

## 8. Out of Scope

- Real-time chat (WebSocket / polling) — intentionally deferred
- Real BSV transactions or actual blockchain recording
- Push notifications for new messages
- File/image attachments in chat
- Message read receipts
