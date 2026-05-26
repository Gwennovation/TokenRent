# Nav + Footer Redesign — Design Spec

**Date:** 2026-05-26
**Status:** Approved

---

## Goal

Replace the current full-width anchored nav with a **floating glass pill** (Option A). Redesign the footer with a 2-column brand+links layout. Remove Browse and List Item from all public navigation. Logged-out guests see: **Home · How It Works · Login**.

---

## Pages Affected

| File | Change |
|---|---|
| `frontend/styles.css` | Replace `.tr-nav` block; replace `.tr-footer` block |
| `frontend/index.html` | New nav HTML, new footer HTML, update hero CTAs |
| `frontend/how-it-works.html` | New nav HTML, new footer HTML |
| `frontend/login.html` | New nav HTML (no CTA), add footer (currently absent) |
| `frontend/dashboard.html` | Footer links update only (no nav — uses sidebar) |

`browse.html` and `list-item.html` are redirect stubs — no nav/footer to update.

---

## Nav Design — Option A (Floating Glass Pill)

### Layout

- `position: fixed; top: 16px; left: 50%; transform: translateX(-50%)`
- `width: calc(100% - 48px); max-width: 1100px`
- Inner pill element holds all content with `border-radius: 999px`

### Visual

- Background: `rgba(20, 20, 36, 0.72)` + `backdrop-filter: blur(20px)`
- Border: `1px solid rgba(255,255,255,.1)`
- Shadow: `0 4px 32px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.06)`

### Scroll behaviour

JS adds `.scrolled` class to `<nav class="tr-nav">` when `window.scrollY > 20`. `.scrolled .nav-inner` tightens bg to `rgba(11,11,18,.92)` and turns border cyan: `rgba(0,200,255,.15)`.

### Links

- Home — `href="index.html"`
- How It Works — `href="how-it-works.html"`
- *(Browse removed, List Item removed, Dashboard removed)*

### CTA button (Login)

Solid cyan pill on the right: `background: var(--cyan); color: #0B0B12; border-radius: 999px; font-family: Syne; font-weight: 700; padding: 9px 22px`. Not shown on `login.html` (user is already there).

### Active state

Each public page sets `data-page` on `<body>` (`"home"`, `"how-it-works"`, `"login"`). A small inline script reads `document.body.dataset.page` and adds `.active` to the matching nav link.

### Mobile (≤768px)

- Pill shrinks to full width minus 32px margin
- `.nav-links` collapses; hamburger button appears
- `toggleNav()` toggles `.open` class, drops links below pill
- CTA stays visible inside the pill at all sizes (not collapsed)

---

## Footer Design — 2-Column Layout

### Structure

```
[ Logo + Tagline ]          [ Stacked links ]
[ f-bottom: copyright + badge ]
```

### Visual

- `background: var(--bg-mid)` (#0D0D18)
- `border-top: 1px solid var(--border-soft)`
- Top padding: 48px, bottom padding after strip: 28px
- Inner max-width: 1100px, centered

### Links (right column, stacked)

- How It Works → `how-it-works.html`
- Dashboard → `dashboard.html`
- Login / Sign up → `login.html` (styled in cyan, weight 600)

### Bottom strip

- Left: `© 2025 T0kenRent. All rights reserved.`
- Right: Cyan dot badge — "Blockchain-verified rentals"
- Separated from columns by a 1px soft border

### Tagline

"The peer-to-peer rental marketplace for cameras, tools, vehicles, and more."

---

## Per-Page Notes

### `index.html`

- Nav: `data-page="home"` on body, Home link `.active`
- Hero CTA links updated: `browse.html` → `dashboard.html#browse`; `list-item.html` → `dashboard.html#list`
- Footer replaces current single-row footer

### `how-it-works.html`

- Nav: `data-page="how-it-works"` on body, How It Works link `.active`
- Existing `switchRole()`, `toggleFaq()`, `toggleNav()` inline script preserved
- Footer replaces current single-row footer

### `login.html`

- Nav: logo + Home + How It Works only. No CTA.
- Footer added at bottom of `<body>` before `</body>`
- `data-page="login"` on body (no active link highlights since Login CTA is absent)

### `dashboard.html` footer

Current footer links: Browse, List Item, Dashboard, Login
After: **How It Works**, Dashboard, Login / Sign up
(No structural or visual redesign — same `.tr-footer` class, just link swap)

---

## CSS Changes Summary

### Replace in `.tr-nav` block (lines ~94–242)

Remove: full-width fixed bar, `.nav-user-pill`, `.nav-av`, `.nav-user-name`, `.nav-admin-badge`, `.nav-logout-btn`, mobile `position:fixed` dropdown.

Keep: `.nav-toggle` button style (used for hamburger).

Add: `.tr-nav` as positioning wrapper only; `.nav-inner` as the styled pill; `.tr-nav.scrolled .nav-inner` for scroll state; updated `.nav-links` mobile dropdown (positioned below pill, not full-page overlay).

### Replace in `.tr-footer` block (lines ~500–521)

Remove: single-row flex layout, `small` tag style.

Add: `.tr-footer` with padding/bg, `.f-inner` grid, `.f-brand`, `.f-links` stacked column, `.f-bottom` strip, `.f-badge` + `.f-badge-dot`.

---

## Out of Scope

- No changes to `admin.html` or `item-detail.html`
- No changes to nav inside `dashboard.html` (sidebar is the app nav)
- No auth-aware nav state on public pages (nav shows Login CTA regardless — logged-in users are redirected to dashboard by `auth.js`)
- No redesign of hero section content on `index.html`
