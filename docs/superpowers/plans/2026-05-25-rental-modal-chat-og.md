# Rental Modal, Chat, OG + Favicon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a tabbed rental detail modal (Overview / Contract / Chat) to the dashboard, a mock BSV smart contract display, a MongoDB-backed message thread per rental, and OG social share image + favicon across all pages.

**Architecture:** Backend adds `GET /api/rentals/:id` (single rental fetch) and `/api/rentals/:id/messages` (GET + POST), nested inside the existing rentals router. Frontend gets a standalone `rental-modal.js` that owns all modal logic — open/close, tab switching, contract hash generation, chat send/receive. Modal is triggered by `onclick` on rental table rows.

**Tech Stack:** Node.js/Express, Mongoose, vanilla JS (no framework), Bootstrap 5, Web Crypto API (`crypto.subtle.digest`) for contract hash, `fetch` + HttpOnly cookie auth.

**Spec:** `docs/superpowers/specs/2026-05-25-rental-modal-chat-og-design.md`

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Create | `backend/models/Message.js` | Message schema |
| Create | `backend/controllers/messages.controller.js` | list + send handlers |
| Create | `backend/routes/messages.routes.js` | GET + POST / with mergeParams |
| Modify | `backend/routes/rentals.routes.js` | Add GET /:id + nest messages router |
| Modify | `backend/controllers/rentals.controller.js` | Add getOne export |
| Create | `frontend/rental-modal.js` | All modal logic |
| Create | `frontend/favicon.svg` | Browser tab icon |
| Create | `frontend/og-source.html` | Source for OG image (screenshot → PNG) |
| Modify | `frontend/styles.css` | Modal, tab, chat, contract CSS |
| Modify | `frontend/dashboard.html` | Modal HTML shell + row onclick + script tag |
| Modify | All 8 HTML files | Favicon link + OG meta tags |

---

## Task 1: Favicon SVG

**Files:**
- Create: `frontend/favicon.svg`

- [ ] **Step 1: Create the favicon**

Create `frontend/favicon.svg` with this exact content:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="10" fill="#0B0B12"/>
  <text x="7" y="46" font-family="Georgia,serif" font-weight="700" font-size="38" fill="#FFFFFF">T</text>
  <text x="31" y="46" font-family="Georgia,serif" font-weight="700" font-size="38" fill="#00C8FF">0</text>
</svg>
```

- [ ] **Step 2: Verify it renders**

Open `http://localhost:3000/favicon.svg` in a browser. You should see a dark square with "T" in white and "0" in cyan.

- [ ] **Step 3: Commit**

```bash
git add frontend/favicon.svg
git commit -m "feat: add SVG favicon — T0 logomark in cyan"
```

---

## Task 2: OG Image

**Files:**
- Create: `frontend/og-source.html`
- Create: `frontend/og-image.png` (generated from og-source.html)

- [ ] **Step 1: Create the OG source HTML**

Create `frontend/og-source.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1200px; height: 630px;
      background: #0B0B12;
      font-family: system-ui, -apple-system, sans-serif;
      overflow: hidden; position: relative;
    }
    .blob-purple {
      position: absolute; width: 520px; height: 520px;
      background: rgba(168,85,247,.28); border-radius: 50%;
      filter: blur(130px); top: -180px; left: -160px;
    }
    .blob-cyan {
      position: absolute; width: 420px; height: 420px;
      background: rgba(0,200,255,.22); border-radius: 50%;
      filter: blur(110px); bottom: -100px; right: -80px;
    }
    .content {
      position: relative; z-index: 1;
      padding: 90px 100px;
      height: 100%; display: flex; flex-direction: column; justify-content: center;
    }
    .logo {
      font-size: 80px; font-weight: 800; letter-spacing: -3px;
      color: #fff; margin-bottom: 24px; line-height: 1;
    }
    .logo span { color: #00C8FF; }
    .tagline {
      font-size: 30px; color: #9CA3AF; font-weight: 300;
      max-width: 680px; line-height: 1.5;
    }
    .badge {
      position: absolute; bottom: 52px; right: 80px;
      background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1);
      border-radius: 99px; padding: 8px 22px;
      color: #9CA3AF; font-size: 17px;
    }
    .badge span { color: #00C8FF; }
    .bar {
      position: absolute; bottom: 0; left: 0; right: 0; height: 3px;
      background: linear-gradient(90deg, #A855F7, #00C8FF, #E91E8C);
    }
  </style>
</head>
<body>
  <div class="blob-purple"></div>
  <div class="blob-cyan"></div>
  <div class="content">
    <div class="logo">T<span>0</span>kenRent</div>
    <div class="tagline">Smart Peer-to-Peer Equipment Rental.<br/>Transparent, tracked, and blockchain-backed.</div>
  </div>
  <div class="badge">Powered by <span>BSV</span></div>
  <div class="bar"></div>
</body>
</html>
```

- [ ] **Step 2: Generate the PNG**

Open `frontend/og-source.html` in a browser. Set the browser window or DevTools device emulation to exactly **1200 × 630 px**. Take a screenshot and save it as `frontend/og-image.png`.

> Shortcut with DevTools: Open DevTools → toggle device toolbar → set custom size 1200 × 630 → right-click page → "Capture screenshot".

- [ ] **Step 3: Commit**

```bash
git add frontend/og-source.html frontend/og-image.png
git commit -m "feat: add OG social share image and source HTML"
```

---

## Task 3: Favicon + OG Meta Tags (All 8 HTML Files)

**Files:**
- Modify: `frontend/index.html`, `frontend/browse.html`, `frontend/list-item.html`, `frontend/dashboard.html`, `frontend/item-detail.html`, `frontend/login.html`, `frontend/how-it-works.html`, `frontend/admin.html`

Add the following inside `<head>` of each file, right after the `<meta name="viewport".../>` tag. Adjust `og:title`, `og:description`, and `og:url` per the table below.

**Shared block (same in all files):**
```html
<link rel="icon" type="image/svg+xml" href="favicon.svg"/>
<meta property="og:type"        content="website"/>
<meta property="og:site_name"   content="T0kenRent"/>
<meta property="og:image"       content="https://tokenrent-psi.vercel.app/og-image.png"/>
<meta name="twitter:card"       content="summary_large_image"/>
<meta name="twitter:image"      content="https://tokenrent-psi.vercel.app/og-image.png"/>
```

**Per-file overrides:**

| File | og:title | og:description | og:url |
|---|---|---|---|
| `index.html` | `T0kenRent — Smart P2P Equipment Rental` | `Rent equipment from your community. Transparent, tracked, and blockchain-backed.` | `https://tokenrent-psi.vercel.app/` |
| `browse.html` | `Browse Equipment — T0kenRent` | `Find cameras, tools, vehicles and more from verified local owners.` | `https://tokenrent-psi.vercel.app/browse.html` |
| `list-item.html` | `List Your Item — T0kenRent` | `Earn from gear you don't use every day. List in minutes.` | `https://tokenrent-psi.vercel.app/list-item.html` |
| `dashboard.html` | `Dashboard — T0kenRent` | `Manage your rentals, listings, and earnings.` | `https://tokenrent-psi.vercel.app/dashboard.html` |
| `item-detail.html` | `T0kenRent` | `Rent this item on T0kenRent.` | `https://tokenrent-psi.vercel.app/item-detail.html` |
| `login.html` | `Sign In — T0kenRent` | `Sign in or create your T0kenRent account.` | `https://tokenrent-psi.vercel.app/login.html` |
| `how-it-works.html` | `How It Works — T0kenRent` | `How T0kenRent's blockchain rental process works.` | `https://tokenrent-psi.vercel.app/how-it-works.html` |
| `admin.html` | `Admin — T0kenRent` | `Platform control panel.` | `https://tokenrent-psi.vercel.app/admin.html` |

- [ ] **Step 1: Add to index.html**

Inside `<head>`, after `<meta name="viewport".../>`, insert:
```html
<link rel="icon" type="image/svg+xml" href="favicon.svg"/>
<meta property="og:type"        content="website"/>
<meta property="og:site_name"   content="T0kenRent"/>
<meta property="og:title"       content="T0kenRent — Smart P2P Equipment Rental"/>
<meta property="og:description" content="Rent equipment from your community. Transparent, tracked, and blockchain-backed."/>
<meta property="og:image"       content="https://tokenrent-psi.vercel.app/og-image.png"/>
<meta property="og:url"         content="https://tokenrent-psi.vercel.app/"/>
<meta name="twitter:card"       content="summary_large_image"/>
<meta name="twitter:image"      content="https://tokenrent-psi.vercel.app/og-image.png"/>
```

- [ ] **Step 2: Add to browse.html**

```html
<link rel="icon" type="image/svg+xml" href="favicon.svg"/>
<meta property="og:type"        content="website"/>
<meta property="og:site_name"   content="T0kenRent"/>
<meta property="og:title"       content="Browse Equipment — T0kenRent"/>
<meta property="og:description" content="Find cameras, tools, vehicles and more from verified local owners."/>
<meta property="og:image"       content="https://tokenrent-psi.vercel.app/og-image.png"/>
<meta property="og:url"         content="https://tokenrent-psi.vercel.app/browse.html"/>
<meta name="twitter:card"       content="summary_large_image"/>
<meta name="twitter:image"      content="https://tokenrent-psi.vercel.app/og-image.png"/>
```

- [ ] **Step 3: Add to list-item.html**

```html
<link rel="icon" type="image/svg+xml" href="favicon.svg"/>
<meta property="og:type"        content="website"/>
<meta property="og:site_name"   content="T0kenRent"/>
<meta property="og:title"       content="List Your Item — T0kenRent"/>
<meta property="og:description" content="Earn from gear you don't use every day. List in minutes."/>
<meta property="og:image"       content="https://tokenrent-psi.vercel.app/og-image.png"/>
<meta property="og:url"         content="https://tokenrent-psi.vercel.app/list-item.html"/>
<meta name="twitter:card"       content="summary_large_image"/>
<meta name="twitter:image"      content="https://tokenrent-psi.vercel.app/og-image.png"/>
```

- [ ] **Step 4: Add to dashboard.html**

```html
<link rel="icon" type="image/svg+xml" href="favicon.svg"/>
<meta property="og:type"        content="website"/>
<meta property="og:site_name"   content="T0kenRent"/>
<meta property="og:title"       content="Dashboard — T0kenRent"/>
<meta property="og:description" content="Manage your rentals, listings, and earnings."/>
<meta property="og:image"       content="https://tokenrent-psi.vercel.app/og-image.png"/>
<meta property="og:url"         content="https://tokenrent-psi.vercel.app/dashboard.html"/>
<meta name="twitter:card"       content="summary_large_image"/>
<meta name="twitter:image"      content="https://tokenrent-psi.vercel.app/og-image.png"/>
```

- [ ] **Step 5: Add to item-detail.html**

```html
<link rel="icon" type="image/svg+xml" href="favicon.svg"/>
<meta property="og:type"        content="website"/>
<meta property="og:site_name"   content="T0kenRent"/>
<meta property="og:title"       content="T0kenRent"/>
<meta property="og:description" content="Rent this item on T0kenRent."/>
<meta property="og:image"       content="https://tokenrent-psi.vercel.app/og-image.png"/>
<meta property="og:url"         content="https://tokenrent-psi.vercel.app/item-detail.html"/>
<meta name="twitter:card"       content="summary_large_image"/>
<meta name="twitter:image"      content="https://tokenrent-psi.vercel.app/og-image.png"/>
```

- [ ] **Step 6: Add to login.html**

```html
<link rel="icon" type="image/svg+xml" href="favicon.svg"/>
<meta property="og:type"        content="website"/>
<meta property="og:site_name"   content="T0kenRent"/>
<meta property="og:title"       content="Sign In — T0kenRent"/>
<meta property="og:description" content="Sign in or create your T0kenRent account."/>
<meta property="og:image"       content="https://tokenrent-psi.vercel.app/og-image.png"/>
<meta property="og:url"         content="https://tokenrent-psi.vercel.app/login.html"/>
<meta name="twitter:card"       content="summary_large_image"/>
<meta name="twitter:image"      content="https://tokenrent-psi.vercel.app/og-image.png"/>
```

- [ ] **Step 7: Add to how-it-works.html**

```html
<link rel="icon" type="image/svg+xml" href="favicon.svg"/>
<meta property="og:type"        content="website"/>
<meta property="og:site_name"   content="T0kenRent"/>
<meta property="og:title"       content="How It Works — T0kenRent"/>
<meta property="og:description" content="How T0kenRent's blockchain rental process works."/>
<meta property="og:image"       content="https://tokenrent-psi.vercel.app/og-image.png"/>
<meta property="og:url"         content="https://tokenrent-psi.vercel.app/how-it-works.html"/>
<meta name="twitter:card"       content="summary_large_image"/>
<meta name="twitter:image"      content="https://tokenrent-psi.vercel.app/og-image.png"/>
```

- [ ] **Step 8: Add to admin.html**

```html
<link rel="icon" type="image/svg+xml" href="favicon.svg"/>
<meta property="og:type"        content="website"/>
<meta property="og:site_name"   content="T0kenRent"/>
<meta property="og:title"       content="Admin — T0kenRent"/>
<meta property="og:description" content="Platform control panel."/>
<meta property="og:image"       content="https://tokenrent-psi.vercel.app/og-image.png"/>
<meta property="og:url"         content="https://tokenrent-psi.vercel.app/admin.html"/>
<meta name="twitter:card"       content="summary_large_image"/>
<meta name="twitter:image"      content="https://tokenrent-psi.vercel.app/og-image.png"/>
```

- [ ] **Step 9: Verify favicon in browser**

Start the server (`npm run dev`), open any page, check the browser tab — should show the T0 icon.

- [ ] **Step 10: Commit**

```bash
git add frontend/
git commit -m "feat: add favicon and OG meta tags to all pages"
```

---

## Task 4: GET /api/rentals/:id Endpoint

**Files:**
- Modify: `backend/controllers/rentals.controller.js` (append at end)
- Modify: `backend/routes/rentals.routes.js` (insert after `/mine`)

- [ ] **Step 1: Add `getOne` to the rentals controller**

Open `backend/controllers/rentals.controller.js`. Append at the very end of the file:

```js
/* ---------- GET /api/rentals/:id (owner or renter only) ---------- */
exports.getOne = async (req, res, next) => {
  try {
    const rental = await Rental.findById(req.params.id)
      .populate('item',   'title category condition photos dailyRate')
      .populate('owner',  'name handcashHandle isVerified location')
      .populate('renter', 'name handcashHandle isVerified location');

    if (!rental) return res.status(404).json({ error: 'Rental not found' });

    const uid = req.user._id.toString();
    const isParty = uid === rental.owner._id.toString() ||
                    uid === rental.renter._id.toString();
    if (!isParty && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ rental });
  } catch (err) { next(err); }
};
```

- [ ] **Step 2: Register the route**

Open `backend/routes/rentals.routes.js`. The current file looks like:

```js
router.post  ('/',                   ctrl.create);
router.get   ('/mine',               ctrl.mine);
router.patch ('/:id/accept',         ctrl.accept);
// ...
```

Add `GET /:id` immediately after `GET /mine` (order matters — `/mine` must come first):

```js
router.post  ('/',                   ctrl.create);
router.get   ('/mine',               ctrl.mine);
router.get   ('/:id',                ctrl.getOne);   // ← add this line
router.patch ('/:id/accept',         ctrl.accept);
router.patch ('/:id/decline',        ctrl.decline);
router.patch ('/:id/cancel',         ctrl.cancel);
router.patch ('/:id/return',         ctrl.markReturned);
router.post  ('/:id/review',         ctrl.review);
```

- [ ] **Step 3: Smoke test**

Start server: `npm run dev`

Log in via the browser, then open the network tab. Navigate to the dashboard, and in the console run (replace ID with a real rental ID from the database):

```js
fetch('/api/rentals/RENTAL_ID_HERE', { credentials: 'include' })
  .then(r => r.json()).then(console.log);
```

Expected: `{ rental: { _id: "...", item: { title: "..." }, owner: {...}, renter: {...}, status: "...", ... } }`

If you see `404`: the ID doesn't exist in the DB — use a real one from `/api/rentals/mine`.
If you see `403`: you're not the owner or renter of that rental.

- [ ] **Step 4: Commit**

```bash
git add backend/controllers/rentals.controller.js backend/routes/rentals.routes.js
git commit -m "feat: add GET /api/rentals/:id for rental detail modal"
```

---

## Task 5: Message Model

**Files:**
- Create: `backend/models/Message.js`

- [ ] **Step 1: Create the model**

Create `backend/models/Message.js`:

```js
/**
 * Message model — one message in a rental's chat thread.
 * Only the rental's owner and renter may read or write.
 */
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  rental: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rental',
    required: true,
    index: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
}, { timestamps: true });

// Compound index for fast thread fetches sorted by time
MessageSchema.index({ rental: 1, createdAt: 1 });

module.exports = mongoose.model('Message', MessageSchema);
```

- [ ] **Step 2: Commit**

```bash
git add backend/models/Message.js
git commit -m "feat: add Message model for rental chat threads"
```

---

## Task 6: Messages Controller + Routes

**Files:**
- Create: `backend/controllers/messages.controller.js`
- Create: `backend/routes/messages.routes.js`
- Modify: `backend/routes/rentals.routes.js` (nest messages router)

- [ ] **Step 1: Create messages controller**

Create `backend/controllers/messages.controller.js`:

```js
/**
 * Messages controller — list and send messages for a rental thread.
 * Access: rental's owner or renter only (checked on every request).
 */
const Message = require('../models/Message');
const Rental  = require('../models/Rental');

/** Returns the rental if the requesting user is the owner or renter, else null. */
async function assertAccess(rentalId, userId) {
  const rental = await Rental.findById(rentalId).select('owner renter');
  if (!rental) return null;
  const uid = userId.toString();
  if (uid !== rental.owner.toString() && uid !== rental.renter.toString()) return null;
  return rental;
}

/* ---------- GET /api/rentals/:id/messages ---------- */
exports.list = async (req, res, next) => {
  try {
    const rental = await assertAccess(req.params.id, req.user._id);
    if (!rental) return res.status(403).json({ error: 'Access denied' });

    const messages = await Message.find({ rental: req.params.id })
      .populate('sender', 'name handcashHandle')
      .sort({ createdAt: 1 });

    res.json({ messages });
  } catch (err) { next(err); }
};

/* ---------- POST /api/rentals/:id/messages ---------- */
exports.send = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    const rental = await assertAccess(req.params.id, req.user._id);
    if (!rental) return res.status(403).json({ error: 'Access denied' });

    const message = await Message.create({
      rental: req.params.id,
      sender: req.user._id,
      text:   text.trim(),
    });

    await message.populate('sender', 'name handcashHandle');
    res.status(201).json({ message });
  } catch (err) { next(err); }
};
```

- [ ] **Step 2: Create messages routes**

Create `backend/routes/messages.routes.js`:

```js
/**
 * Messages routes — nested under /api/rentals/:id/messages.
 * mergeParams: true gives access to :id from the parent rentals router.
 * requireAuth is inherited from the parent router's router.use(requireAuth).
 */
const router = require('express').Router({ mergeParams: true });
const ctrl   = require('../controllers/messages.controller');

router.get ('/', ctrl.list);
router.post('/', ctrl.send);

module.exports = router;
```

- [ ] **Step 3: Nest messages router inside rentals router**

Open `backend/routes/rentals.routes.js`. Add the messages router **after** the `GET /:id` line you added in Task 4:

```js
router.post  ('/',                   ctrl.create);
router.get   ('/mine',               ctrl.mine);
router.get   ('/:id',                ctrl.getOne);
router.use   ('/:id/messages',       require('./messages.routes'));   // ← add this
router.patch ('/:id/accept',         ctrl.accept);
router.patch ('/:id/decline',        ctrl.decline);
router.patch ('/:id/cancel',         ctrl.cancel);
router.patch ('/:id/return',         ctrl.markReturned);
router.post  ('/:id/review',         ctrl.review);
```

`requireAuth` is already applied at the top of `rentals.routes.js` via `router.use(requireAuth)`, so all nested routes inherit it. No need to add it again in `messages.routes.js`.

- [ ] **Step 4: Smoke test GET messages**

With server running and logged in, run in browser console (use a real rental ID):

```js
fetch('/api/rentals/RENTAL_ID_HERE/messages', { credentials: 'include' })
  .then(r => r.json()).then(console.log);
```

Expected: `{ messages: [] }` (empty array — no messages yet).

- [ ] **Step 5: Smoke test POST message**

```js
fetch('/api/rentals/RENTAL_ID_HERE/messages', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: 'Hello from console test' })
}).then(r => r.json()).then(console.log);
```

Expected: `{ message: { _id: "...", text: "Hello from console test", sender: { name: "...", ... }, createdAt: "..." } }`

- [ ] **Step 6: Commit**

```bash
git add backend/controllers/messages.controller.js backend/routes/messages.routes.js backend/routes/rentals.routes.js
git commit -m "feat: add messages API — GET + POST /api/rentals/:id/messages"
```

---

## Task 7: Modal CSS

**Files:**
- Modify: `frontend/styles.css` (append new section at end)

- [ ] **Step 1: Append modal styles to styles.css**

Open `frontend/styles.css`. Add this entire block at the very end of the file:

```css
/* =====================================================================
   RENTAL DETAIL MODAL (rdm-*)
   ===================================================================== */

.rdm-overlay {
  display: none;
  position: fixed; inset: 0; z-index: 1050;
  background: rgba(0,0,0,.65);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  align-items: center; justify-content: center;
  padding: 20px;
}
.rdm-overlay.open { display: flex; }

.rdm-panel {
  background: var(--bg-card);
  border: 1px solid rgba(0,200,255,.2);
  border-radius: 18px;
  width: 100%; max-width: 720px;
  max-height: 90vh;
  display: flex; flex-direction: column;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(0,0,0,.6);
}

/* --- Header --- */
.rdm-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 22px;
  border-bottom: 1px solid var(--border-soft);
  gap: 12px; flex-wrap: wrap; flex-shrink: 0;
}
.rdm-header-left  { display: flex; align-items: center; gap: 12px; }
.rdm-header-right { display: flex; align-items: center; gap: 10px; margin-left: auto; }
.rdm-thumb {
  width: 48px; height: 48px; border-radius: 8px;
  background: var(--bg-surface); overflow: hidden; flex-shrink: 0;
}
.rdm-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.rdm-item-name { font-family: 'Syne', sans-serif; font-weight: 700; font-size: .95rem; }
.rdm-item-meta { font-size: .74rem; color: var(--muted); margin-top: 2px; }
.rdm-close {
  background: transparent; border: 1px solid var(--border-mid);
  color: var(--muted); width: 30px; height: 30px; border-radius: 50%;
  cursor: pointer; font-size: 1.2rem; line-height: 1; display: flex;
  align-items: center; justify-content: center;
  transition: color .2s, border-color .2s;
}
.rdm-close:hover { color: var(--white); border-color: rgba(255,255,255,.3); }

/* --- Tabs --- */
.rdm-tabs {
  display: flex; gap: 0; padding: 0 22px;
  border-bottom: 1px solid var(--border-soft);
  flex-shrink: 0;
}
.rdm-tab {
  background: transparent; border: none; border-bottom: 2px solid transparent;
  color: var(--muted); font-family: 'Syne', sans-serif;
  font-weight: 700; font-size: .82rem;
  padding: 12px 18px; cursor: pointer; margin-bottom: -1px;
  transition: color .2s, border-color .2s;
}
.rdm-tab:hover { color: var(--white); }
.rdm-tab.active { color: var(--cyan); border-bottom-color: var(--cyan); }

/* --- Body / Panes --- */
.rdm-body { flex: 1; overflow-y: auto; }
.rdm-pane { display: none; padding: 22px; }
.rdm-pane.active { display: block; }
.rdm-loading { text-align: center; color: var(--muted); padding: 48px 0; font-size: .9rem; }

/* --- Overview: two-column grid --- */
.rdm-overview-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;
}
@media (max-width: 600px) { .rdm-overview-grid { grid-template-columns: 1fr; } }

.rdm-party-card {
  background: var(--bg-subtle); border: 1px solid var(--border-soft);
  border-radius: var(--radius); padding: 16px;
  display: flex; align-items: center; gap: 12px;
}
.rdm-av {
  width: 48px; height: 48px; border-radius: 50%;
  background: var(--cyan-10); border: 2px solid var(--cyan);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Syne', sans-serif; font-weight: 800; font-size: .9rem;
  color: var(--cyan); flex-shrink: 0;
}
.rdm-av-label { font-size: .62rem; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); margin-bottom: 3px; }
.rdm-av-name  { font-family: 'Syne', sans-serif; font-weight: 700; font-size: .9rem; }
.rdm-av-sub   { font-size: .74rem; color: var(--muted); margin-top: 1px; }

.rdm-price-table { width: 100%; font-size: .85rem; border-collapse: collapse; }
.rdm-price-table td { padding: 4px 0; }
.rdm-price-table td:last-child { text-align: right; font-weight: 500; }
.rdm-price-table td:first-child { color: var(--muted); }
.rdm-price-total td { font-family: 'Syne', sans-serif; font-weight: 800; font-size: .95rem; border-top: 1px solid var(--border-soft); padding-top: 9px; }

/* --- Timeline --- */
.rdm-tl-label-row {
  font-size: .72rem; text-transform: uppercase; letter-spacing: .08em;
  color: var(--muted); margin-bottom: 10px;
}
.rdm-timeline {
  display: flex; align-items: flex-start;
  overflow-x: auto; padding-bottom: 4px; margin-bottom: 20px;
}
.rdm-tl-step  { display: flex; flex-direction: column; align-items: center; flex: 1; min-width: 64px; }
.rdm-tl-dot   { width: 10px; height: 10px; border-radius: 50%; background: var(--border-mid); border: 2px solid var(--border-mid); margin-bottom: 6px; flex-shrink: 0; }
.rdm-tl-dot.done    { background: var(--cyan); border-color: var(--cyan); }
.rdm-tl-dot.current { background: var(--cyan); border-color: var(--cyan); box-shadow: 0 0 8px rgba(0,200,255,.5); }
.rdm-tl-name  { font-size: .62rem; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); text-align: center; }
.rdm-tl-name.done { color: var(--white); }
.rdm-tl-ts    { font-size: .58rem; color: var(--muted); text-align: center; margin-top: 2px; }
.rdm-tl-line  { flex: 1; height: 1px; background: var(--border-soft); margin-bottom: 28px; min-width: 12px; }
.rdm-tl-line.done { background: var(--cyan); }

/* --- Actions --- */
.rdm-actions {
  display: flex; gap: 8px; flex-wrap: wrap;
  padding-top: 16px; border-top: 1px solid var(--border-soft);
}

/* --- Contract tab --- */
.rdm-contract {
  background: var(--bg-subtle); border: 1px solid rgba(74,222,128,.15);
  border-radius: var(--radius); padding: 20px 24px;
  font-family: 'Courier New', Courier, monospace;
  font-size: .78rem; line-height: 1.8; color: var(--soft);
}
.rdm-contract-head {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 14px; padding-bottom: 12px;
  border-bottom: 1px dotted rgba(255,255,255,.1);
}
.rdm-contract-title {
  font-family: 'Syne', sans-serif; font-weight: 800;
  font-size: .88rem; letter-spacing: .08em; color: var(--white);
}
.rdm-verified {
  display: inline-flex; align-items: center; gap: 5px;
  background: rgba(74,222,128,.1); border: 1px solid rgba(74,222,128,.3);
  border-radius: 99px; padding: 3px 10px;
  font-family: 'Syne', sans-serif; font-size: .62rem;
  font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
  color: var(--success);
}
.rdm-verified::before { content: '●'; font-size: .5rem; margin-right: 2px; }
.rdm-hash   { font-size: .7rem; color: var(--cyan); word-break: break-all; margin-bottom: 3px; }
.rdm-issued { font-size: .7rem; color: var(--muted); margin-bottom: 14px; }
.rdm-c-section {
  font-family: 'Syne', sans-serif; font-size: .62rem; letter-spacing: .1em;
  text-transform: uppercase; color: var(--muted);
  margin: 14px 0 6px; padding-top: 12px;
  border-top: 1px dotted rgba(255,255,255,.07);
}
.rdm-c-row { display: flex; justify-content: space-between; padding: 1px 0; }
.rdm-c-row .k { color: var(--muted); }
.rdm-c-row .v { color: var(--white); text-align: right; max-width: 65%; word-break: break-word; }
.rdm-c-total .k,
.rdm-c-total .v { font-family: 'Syne', sans-serif; font-weight: 800; color: var(--white); font-size: .85rem; }
.rdm-copy-btn {
  width: 100%; margin-top: 16px;
  background: transparent; border: 1px solid var(--border-mid);
  border-radius: 8px; color: var(--muted);
  font-size: .78rem; font-weight: 600;
  padding: 8px 0; cursor: pointer;
  transition: color .2s, border-color .2s;
  font-family: 'DM Sans', sans-serif;
}
.rdm-copy-btn:hover  { color: var(--white); border-color: var(--cyan); }
.rdm-copy-btn.copied { color: var(--success); border-color: rgba(74,222,128,.4); }

/* --- Chat tab --- */
.rdm-chat-ctx  { font-size: .78rem; color: var(--muted); margin-bottom: 10px; }
.rdm-chat-wrap { display: flex; flex-direction: column; }
.rdm-chat-head { display: flex; justify-content: flex-end; margin-bottom: 6px; }
.rdm-chat-refresh {
  background: transparent; border: none; color: var(--muted);
  font-size: .75rem; cursor: pointer; transition: color .2s;
}
.rdm-chat-refresh:hover { color: var(--cyan); }
.rdm-thread {
  height: 300px; overflow-y: auto;
  display: flex; flex-direction: column; gap: 10px;
  margin-bottom: 12px; padding-right: 4px;
}
.rdm-thread-empty { text-align: center; color: var(--muted); font-size: .85rem; padding: 48px 0; }
.rdm-bw       { display: flex; flex-direction: column; }
.rdm-bw.mine  { align-items: flex-end; }
.rdm-b-sender { font-size: .64rem; color: var(--muted); margin-bottom: 3px; padding: 0 4px; }
.rdm-bubble   { max-width: 76%; padding: 9px 13px; border-radius: 12px; font-size: .85rem; line-height: 1.5; word-break: break-word; }
.rdm-bubble.theirs { background: var(--bg-surface); border-radius: 12px 12px 12px 2px; }
.rdm-bubble.mine   { background: rgba(0,200,255,.12); border: 1px solid rgba(0,200,255,.18); border-radius: 12px 12px 2px 12px; }
.rdm-b-ts     { font-size: .6rem; color: var(--muted); margin-top: 3px; padding: 0 4px; }
.rdm-chat-input { display: flex; gap: 8px; }
.rdm-chat-input input {
  flex: 1; background: var(--bg-subtle); border: 1px solid var(--border-mid);
  border-radius: 8px; color: var(--white); padding: 9px 13px; font-size: .88rem;
  font-family: 'DM Sans', sans-serif;
  transition: border-color .2s, box-shadow .2s;
}
.rdm-chat-input input:focus { border-color: var(--cyan); outline: none; box-shadow: 0 0 0 3px rgba(0,200,255,.15); }
.rdm-chat-input input::placeholder { color: rgba(156,163,175,.55); }
.rdm-chat-err { color: var(--danger); font-size: .74rem; margin-top: 6px; display: none; }
```

- [ ] **Step 2: Commit**

```bash
git add frontend/styles.css
git commit -m "feat: add rental detail modal CSS (rdm-* classes)"
```

---

## Task 8: Modal HTML Shell in dashboard.html

**Files:**
- Modify: `frontend/dashboard.html`

- [ ] **Step 1: Add modal overlay HTML**

Open `frontend/dashboard.html`. Find the closing `</body>` tag. Insert this block immediately before it (before `<script src="...bootstrap...">` is fine too — just before `</body>`):

```html
<!-- ── Rental Detail Modal ─────────────────────────────────────── -->
<div class="rdm-overlay" id="rdmOverlay" onclick="closeRentalModal(event)">
  <div class="rdm-panel" role="dialog" aria-modal="true" aria-labelledby="rdmItemName">

    <!-- Header -->
    <div class="rdm-header">
      <div class="rdm-header-left">
        <div class="rdm-thumb" id="rdmThumb"></div>
        <div>
          <div class="rdm-item-name" id="rdmItemName">Loading…</div>
          <div class="rdm-item-meta" id="rdmItemMeta"></div>
        </div>
      </div>
      <div class="rdm-header-right">
        <span id="rdmStatusBadge"></span>
        <button class="rdm-close" onclick="closeRentalModal()" aria-label="Close">×</button>
      </div>
    </div>

    <!-- Tab pills -->
    <div class="rdm-tabs" role="tablist">
      <button class="rdm-tab active" role="tab" onclick="rdmSwitchTab('overview',this)">Overview</button>
      <button class="rdm-tab"        role="tab" onclick="rdmSwitchTab('contract',this)">Contract</button>
      <button class="rdm-tab"        role="tab" onclick="rdmSwitchTab('chat',this)">Chat</button>
    </div>

    <!-- Panes -->
    <div class="rdm-body">
      <div class="rdm-pane active" id="rdm-overview" role="tabpanel">
        <div id="rdmOverviewContent"><div class="rdm-loading">Loading…</div></div>
      </div>
      <div class="rdm-pane" id="rdm-contract" role="tabpanel">
        <div id="rdmContractContent"><div class="rdm-loading">Loading…</div></div>
      </div>
      <div class="rdm-pane" id="rdm-chat" role="tabpanel">
        <div id="rdmChatContent"><div class="rdm-loading">Loading…</div></div>
      </div>
    </div>

  </div>
</div>
```

- [ ] **Step 2: Add rental-modal.js script tag**

In `frontend/dashboard.html`, find the existing `<script src="auth.js"></script>` line. Add `rental-modal.js` after it:

```html
<script src="auth.js"></script>
<script src="rental-modal.js"></script>
<script src="auth-gate.js"></script>
```

- [ ] **Step 3: Commit**

```bash
git add frontend/dashboard.html
git commit -m "feat: add rental modal HTML shell and script tag to dashboard"
```

---

## Task 9: rental-modal.js — Open / Close / Header / Overview Tab

**Files:**
- Create: `frontend/rental-modal.js`

- [ ] **Step 1: Create rental-modal.js**

Create `frontend/rental-modal.js` with the following content:

```js
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
```

- [ ] **Step 2: Verify modal opens**

With server running, go to the Dashboard. Open browser console and run:

```js
// Use a real rental ID from your DB. Get one from:
fetch('/api/rentals/mine?as=owner', { credentials: 'include' })
  .then(r => r.json()).then(d => console.log(d.rentals[0]._id));
```

Then call:
```js
openRentalModal('THAT_ID');
```

Expected: modal appears with item name, status badge, counterparty card, pricing table, and timeline.

- [ ] **Step 3: Commit**

```bash
git add frontend/rental-modal.js
git commit -m "feat: rental modal open/close/overview tab"
```

---

## Task 10: rental-modal.js — Contract Tab

**Files:**
- Modify: `frontend/rental-modal.js` (append before the `window.` exports)

- [ ] **Step 1: Append contract tab code**

Open `frontend/rental-modal.js`. Find the line `/* ── Expose globals ──` and insert this block immediately before it:

```js
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
```

- [ ] **Step 2: Expose new globals**

Find the `window.` exports block at the bottom of `rental-modal.js`. Add the new functions:

```js
window.openRentalModal  = openRentalModal;
window.closeRentalModal = closeRentalModal;
window.rdmSwitchTab     = rdmSwitchTab;
window.rdmCopyHash      = rdmCopyHash;     // ← add
```

- [ ] **Step 3: Verify contract tab**

Open a rental modal in the browser. Click the **Contract** tab.

Expected:
- Document with "RENTAL AGREEMENT" heading and green "VERIFIED" badge
- Contract hash shown as `0x` + grouped hex string
- All parties, item, terms, and network sections populated
- "Copy Contract ID" button copies the full hash to clipboard

Open the console and verify the hash is deterministic:
```js
// Open the same rental twice — hash should be identical both times
openRentalModal('SAME_RENTAL_ID');
```

- [ ] **Step 4: Commit**

```bash
git add frontend/rental-modal.js
git commit -m "feat: add contract tab with SHA-256 mock BSV contract"
```

---

## Task 11: rental-modal.js — Chat Tab + Action Handler

**Files:**
- Modify: `frontend/rental-modal.js` (append before the `window.` exports)

- [ ] **Step 1: Append chat tab and action handler code**

Open `frontend/rental-modal.js`. Insert this block immediately before the `/* ── Expose globals` line:

```js
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
  const me     = Auth.get();
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
```

- [ ] **Step 2: Expose new globals**

Update the `window.` exports at the bottom:

```js
window.openRentalModal  = openRentalModal;
window.closeRentalModal = closeRentalModal;
window.rdmSwitchTab     = rdmSwitchTab;
window.rdmCopyHash      = rdmCopyHash;
window.rdmSendMessage   = rdmSendMessage;   // ← add
window.rdmAction        = rdmAction;         // ← add
window._rdmRefreshChat  = _rdmRefreshChat;   // ← add (called from inline onclick)
```

- [ ] **Step 3: Verify chat tab**

Open a rental modal. Click **Chat**. Expected: empty state "No messages yet. Send the first one."

Type a message and press Enter or click Send. Expected: message appears on the right (mine, cyan bubble).

Click **↻ Refresh**. Expected: messages re-fetch and display.

Also verify actions: open a rental with status `pending` as the owner. Expected: Accept and Decline buttons appear in the Overview tab. Click Accept — rental status should update and buttons should change.

- [ ] **Step 4: Commit**

```bash
git add frontend/rental-modal.js
git commit -m "feat: add chat tab, send message, and action handler to rental modal"
```

---

## Task 12: Wire Up Dashboard Rental Rows

**Files:**
- Modify: `frontend/dashboard.html` (update `rentalsRow()` function)

- [ ] **Step 1: Make rental rows clickable**

Open `frontend/dashboard.html`. Find the `rentalsRow` function. It currently returns `<tr>` elements. Add `onclick` to open the modal and `style="cursor:pointer"` to each row. Also add `onclick="event.stopPropagation()"` to action buttons so clicking them doesn't open the modal.

Replace the entire `rentalsRow` function with:

```js
function rentalsRow(rentals, mode) {
  if (!rentals.length) return `<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:30px">Nothing here yet.</td></tr>`;
  return rentals.map(r => {
    const other = mode === 'owner' ? r.renter : r.owner;
    const statusBadge = `<span class="badge badge-${r.status === 'completed' ? 'completed' : r.status === 'overdue' ? 'overdue' : r.status === 'pending' ? 'pending' : 'rented'}">${r.status}</span>`;
    let actions = '';
    if (mode === 'owner' && r.status === 'pending') {
      actions = `<button class="btn btn-primary btn-sm" onclick="event.stopPropagation();acceptRental('${r._id}')">Accept</button>
                 <button class="btn btn-ghost btn-sm"   onclick="event.stopPropagation();declineRental('${r._id}')">Decline</button>`;
    } else if (mode === 'owner' && ['accepted','active','overdue'].includes(r.status)) {
      actions = `<button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();returnRental('${r._id}')">Mark Returned</button>`;
    } else {
      actions = `<button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openRentalModal('${r._id}')">Details</button>`;
    }
    return `<tr onclick="openRentalModal('${r._id}')" style="cursor:pointer">
      <td>${itemCell(r.item, '₱' + r.dailyRate + '/day')}</td>
      <td style="color:var(--muted);font-size:.82rem">${counterpartyName(other)}</td>
      <td style="font-size:.82rem">${fmtRange(r.startDate, r.endDate)}</td>
      <td>${statusBadge}</td>
      <td onclick="event.stopPropagation()">${actions}</td>
    </tr>`;
  }).join('');
}
```

- [ ] **Step 2: Make "My Items" rows clickable too**

In the same file, find the `loadMyItems` function. Update the table rows to be clickable — wrap them so clicking opens the rental modal isn't applicable here (items aren't rentals), but make the item title link to item-detail. Add `onclick` to the row to navigate to the item detail page:

Find this pattern inside `loadMyItems`:
```js
<tr>
  <td>${itemCell(it, 'Listed ' + ...
```

Replace the `<tr>` with:
```js
<tr onclick="location.href='item-detail.html?id=${it._id}'" style="cursor:pointer">
  <td onclick="event.stopPropagation()">${itemCell(it, 'Listed ' + new Date(it.createdAt).toLocaleDateString('en-PH', { month: 'short', year: 'numeric' }))}</td>
```

> Note: update the full row — just add `onclick` and `style` to the opening `<tr>` tag and wrap the action `<td>` with `onclick="event.stopPropagation()"`.

- [ ] **Step 3: Final integration smoke test**

1. Start server: `npm run dev`
2. Log in with a user that has at least one rental
3. Go to Dashboard → active rentals table should have clickable rows (cursor: pointer on hover)
4. Click any row → modal opens with Overview tab showing counterparty, pricing, timeline
5. Click **Contract** tab → hash appears, "VERIFIED" badge, micropayment fee shown
6. Click **Copy Contract ID** → browser shows "Copied!" feedback for 2s
7. Click **Chat** tab → empty state or existing messages
8. Type a message + Enter → appears in thread
9. Press Escape → modal closes
10. Click overlay background → modal closes
11. Click × button → modal closes

- [ ] **Step 4: Commit**

```bash
git add frontend/dashboard.html
git commit -m "feat: wire rental rows to open detail modal on click"
```

---

## Task 13: Push to GitHub + Verify on Vercel

- [ ] **Step 1: Push all commits**

```bash
git push origin main
```

- [ ] **Step 2: Wait for Vercel deploy**

Go to [vercel.com](https://vercel.com) → TokenRent project → Deployments. Wait for the green "Ready" status (usually 30–60 seconds).

- [ ] **Step 3: Test OG image**

Paste `https://tokenrent-psi.vercel.app/` into [opengraph.xyz](https://www.opengraph.xyz) or [metatags.io](https://metatags.io) to verify the OG image and title render correctly.

- [ ] **Step 4: Test favicon on live site**

Open `https://tokenrent-psi.vercel.app/` — browser tab should show the T0 icon.

- [ ] **Step 5: Test modal on live site**

Log in on the live site, go to Dashboard, click a rental row. Verify the modal works end-to-end in production (HTTPS context matters for `crypto.subtle`).

---

## Self-Review Notes

- `GET /:id` is placed after `GET /mine` in the router — avoids Express treating "mine" as a Mongo ObjectId (which would throw a CastError).
- `router.use('/:id/messages', ...)` is nested after `GET /:id` — both use the existing top-level `requireAuth` middleware.
- `crypto.subtle.digest` requires a secure context (HTTPS or localhost) — works on Vercel (HTTPS) and local dev. Does not work on plain HTTP.
- `_esc()` is applied to all user-supplied strings inserted into innerHTML to prevent XSS.
- `event.stopPropagation()` on the actions `<td>` prevents row click from firing when clicking action buttons.
- OG image references the absolute Vercel URL — won't work in local dev (shows broken image in social previews), but correct for production.
