# Design Spec: Unified App Shell

**Date:** 2026-05-26
**Status:** Approved
**Scope:** Merge Dashboard, Browse, and List Item into a single authenticated shell with hash-based routing and a slide-in item detail panel.

---

## 1. Overview

After login, every authenticated action happens inside one page (`dashboard.html`). Browse and List Item are no longer separate pages — they become views inside the existing dashboard shell. The sidebar gains two new entries at the top. `browse.html` and `list-item.html` become redirect stubs. The landing page auto-redirects logged-in users to Browse.

Browse is the default landing view after login. The item detail opens as a slide-in panel from the right without leaving Browse.

---

## 2. Architecture

### 2.1 File changes

| File | Action | Detail |
|---|---|---|
| `frontend/dashboard.html` | **Expand** | Add Browse view, List Item view, item detail panel HTML. Sidebar gains Browse + List Item entries. Top `tr-nav` bar removed from this page only. |
| `frontend/dashboard.js` | **Create** | New file: hash router, Browse view logic, List Item view logic, item detail panel logic. Loaded via `<script src="dashboard.js">` in dashboard.html. Calls existing inline functions (`loadStats`, `loadOverview`, etc.) by name — does not replace them. |
| `frontend/browse.html` | **Redirect stub** | Replace content with immediate JS redirect → `dashboard.html#browse`. Keeps bookmarks working. |
| `frontend/list-item.html` | **Redirect stub** | Replace content with immediate JS redirect → `dashboard.html#list`. |
| `frontend/index.html` | **Add redirect** | If `Auth.isAuthed()`, redirect to `dashboard.html#browse` after auth check. |
| `frontend/item-detail.html` | **Keep** | Stays for direct links / social sharing. Shows an in-app banner for logged-in users: "You're logged in — view this in the app" linking to `dashboard.html#browse?item=ID`. |
| `frontend/styles.css` | **Append** | Panel slide-in CSS, view transition styles, redirect stub styles. |

### 2.2 New files

| File | Purpose |
|---|---|
| `frontend/dashboard.js` | Hash router + new view logic (Browse, List Item, item detail panel). New code only — calls existing dashboard functions by name. |

---

## 3. Shell Layout

### 3.1 Structure

```
┌─────────────────────────────────────────────────────┐
│  Sidebar (240px fixed)  │  Main content area (flex:1) │
│                         │                             │
│  T0kenRent logo         │  [Active view renders here] │
│  User card              │                             │
│  ─────────────          │                             │
│  🔍 Browse    ← active  │                             │
│  ➕ List an Item         │                             │
│  ─────────────          │                             │
│  MY ACTIVITY            ├──────────────────────────── │
│  📊 Overview            │  [Item detail panel 400px]  │
│  🔄 My Rentals          │  slides in from right when  │
│  ⏳ Pending   [badge]   │  item selected in Browse    │
│  📦 My Items            │                             │
│  ─────────────          │                             │
│  💬 Messages            │                             │
│  ⚙️  Settings            │                             │
└─────────────────────────────────────────────────────┘
```

The top `tr-nav` bar (logo + nav links + login CTA) is **removed from dashboard.html only**. It stays on all public pages (index.html, how-it-works.html, login.html, item-detail.html).

### 3.2 Sidebar nav items

| Entry | Hash | Badge |
|---|---|---|
| 🔍 Browse | `#browse` | — |
| ➕ List an Item | `#list` | — |
| 📊 Overview | `#overview` | — |
| 🔄 My Rentals | `#rentals` | — |
| ⏳ Pending | `#pending` | count of pending requests (pink) |
| 📦 My Items | `#items` | — |
| 💬 Messages | `#messages` | — |
| ⚙️ Settings | `#settings` | — |

Section labels (non-clickable): no label above Browse + List Item (they appear first with no group header), **My Activity** above Overview–My Items, no label for Messages + Settings. A thin divider separates Browse/List from the My Activity group.

Active nav item: cyan text + `rgba(0,200,255,.12)` background pill.

---

## 4. Hash-Based Router

A lightweight client-side router listens to `window.addEventListener('hashchange', ...)` and renders the appropriate view into `#appMain`.

### 4.1 Routes

| Hash | View rendered |
|---|---|
| `#browse` (default) | Browse grid |
| `#browse?item=ITEM_ID` | Browse grid + item detail panel open |
| `#list` | List an Item form |
| `#overview` | Dashboard overview (existing) |
| `#rentals` | My Rentals (existing) |
| `#pending` | Pending Requests (existing) |
| `#items` | My Items (existing) |
| `#messages` | Messages (existing) |
| `#settings` | Account Settings (existing) |

**Default:** If hash is empty or unrecognised → redirect to `#browse`.

**Implementation:** The router reads `location.hash`, strips the `#`, splits on `?` to separate the view name from query params, then calls `loadView(name, params)`. Each view is a function that renders into `document.getElementById('appMain')`.

### 4.2 Back/forward navigation

`hashchange` events fire on browser back/forward — the router handles them naturally. No `history.pushState` needed.

---

## 5. Views

### 5.1 Browse view

Ported from `browse.html`. Renders inside `#appMain`.

**Components:**
- Search bar (full-width input, debounced 300ms)
- Category filter pills (All, Construction, Electronics, Photography, Outdoor, Vehicles, Events)
- Item grid (responsive: 3 cols on wide, 2 on medium, 1 on narrow)
- Each item card: photo, title, daily rate, category badge, availability status

**Item card click:** calls `openItemPanel(itemId)` — does NOT navigate. Updates URL to `#browse?item=ITEM_ID` via `location.hash`.

**Data source:** `GET /api/items` (existing endpoint, already used by browse.html). Fetched with `credentials: 'include'`.

**Empty/loading states:** Skeleton cards while loading, "No items found" with a clear-filters CTA.

### 5.2 List an Item view

Ported from `list-item.html`. Renders inside `#appMain` at full width.

**The multi-step form stays identical** — Title/Category/Condition, Description, Photos (Cloudinary upload), Pricing & Availability. All existing validation logic ported as-is.

**On success:** After item is created, router navigates to `#items` (My Items) so the user sees their new listing immediately.

### 5.3 Existing views (Overview, Rentals, Pending, My Items, Messages, Settings)

These already exist as tab panes in `dashboard.html`. They are **not redesigned** — only wired to the new router. The router replaces the current `showSection(name)` tab-switching function.

---

## 6. Item Detail Panel

### 6.1 Structure

A fixed-width panel (`400px`) that slides in from the right edge of `#appMain` when an item is selected in Browse. The browse grid compresses to fill the remaining space (CSS `flex` handles this automatically).

```
#appMain (display: flex)
├── #browseGrid (flex: 1, min-width: 0)   ← compresses
└── #itemPanel  (width: 400px, slide in)  ← new
```

### 6.2 Panel content

- **Header:** Item photo (full width, 180px tall, `object-fit: cover`), close button (×) top-right
- **Title + category + condition**
- **Owner card:** avatar, name, HandCash handle, verified badge, location
- **Pricing:** Daily rate, security deposit, minimum days
- **Availability:** available from–to dates (if set)
- **Booking form:** start date, end date, calculated total, **Book Now** button
- **Booking Now** calls `POST /api/rentals` (existing endpoint) with credentials

### 6.3 Open / close

`openItemPanel(id)`:
1. Sets `location.hash = '#browse?item=' + id`
2. Fetches `GET /api/items/:id`
3. Renders panel content
4. Adds `.panel-open` class to `#appMain` (triggers CSS transition)

`closeItemPanel()`:
1. Sets `location.hash = '#browse'`
2. Removes `.panel-open` class

Close triggers: × button, Escape key, clicking the overlay (on mobile).

### 6.4 Panel CSS

```css
#itemPanel {
  width: 0;
  overflow: hidden;
  transition: width .25s ease;
  flex-shrink: 0;
  border-left: 1px solid rgba(0,200,255,.15);
}
#appMain.panel-open #itemPanel {
  width: 400px;
}
```

---

## 7. Redirects

### 7.1 `browse.html` → stub

Replace the entire page body with:
```html
<script>location.replace('dashboard.html#browse');</script>
```
Keep `<head>` meta/favicon/OG tags intact.

### 7.2 `list-item.html` → stub

Replace body content with:
```html
<script>location.replace('dashboard.html#list');</script>
```
Keep `<head>` meta/favicon/OG tags intact.

### 7.3 `index.html` → auto-redirect if logged in

After `Auth.ready()` resolves with a user, redirect to `dashboard.html#browse`. If not logged in, stay on the landing page as normal.

---

## 8. Mobile

On screens ≤ 768px:
- Sidebar collapses behind a hamburger toggle (existing mobile nav already handles this)
- Item detail panel becomes a full-screen overlay (width: 100%) instead of a side panel
- Browse grid: 1 column

---

## 9. Error Handling

- **Browse fetch fails:** Inline error with retry button inside `#appMain`
- **Item panel fetch fails:** Error state inside the panel with retry
- **List item submit fails:** Existing validation error display, unchanged
- **Hash not recognised:** Redirect to `#browse`

---

## 10. Out of Scope

- Real-time notifications or badge auto-refresh (manual load on nav)
- Animated page transitions between views (hash change is instant)
- `item-detail.html` full refactor (kept as-is, just adds the logged-in banner)
- Edit item functionality (separate spec, tackled next)
- Any backend changes (all existing endpoints used as-is)
