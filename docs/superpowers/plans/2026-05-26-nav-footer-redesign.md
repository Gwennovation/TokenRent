# Nav + Footer Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the full-width anchored nav with a floating glass pill (Option A) and redesign the footer to a 2-column brand+links layout across all public pages, removing Browse and List Item from guest navigation.

**Architecture:** Pure HTML/CSS/JS changes across 5 files — no build step. `styles.css` is the single CSS source shared by all pages. Each public HTML page gets identical nav/footer HTML with only the `.active` class differing per page. `dashboard.html` gets only a footer link swap (it has no nav — uses a sidebar).

**Tech Stack:** Vanilla HTML5, CSS custom properties, Bootstrap 5 (layout only), DM Sans + Syne (Google Fonts)

---

## File Map

| File | What changes |
|---|---|
| `frontend/styles.css` | Replace `.tr-nav` block (lines 90–243) and `.tr-footer` block (lines 499–521) |
| `frontend/index.html` | New nav HTML, hero CTA hrefs, new footer HTML, add scroll JS |
| `frontend/how-it-works.html` | New nav HTML, new footer HTML, add scroll JS |
| `frontend/login.html` | New nav HTML (no CTA), add footer (currently absent), add scroll JS |
| `frontend/dashboard.html` | Footer HTML update to new structure + link swap |

---

## CSS Reference (used verbatim in Tasks 1–5)

### New nav CSS block (replaces lines 90–243 in styles.css)

```css
/* Page wrapper offset for floating nav */
.page { padding-top: 80px; min-height: 100vh; }

/* ---------- NAV ---------- */

/* Outer positioning wrapper */
.tr-nav {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1030;
  width: calc(100% - 48px);
  max-width: 1100px;
}

/* The visible pill */
.nav-inner {
  display: flex;
  align-items: center;
  position: relative;
  background: rgba(20, 20, 36, 0.72);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 999px;
  padding: 10px 10px 10px 22px;
  box-shadow: 0 4px 32px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.06);
  transition: background .3s, border-color .3s;
  gap: 4px;
}

/* Scroll: tighten the pill */
.tr-nav.scrolled .nav-inner {
  background: rgba(11,11,18,.92);
  border-color: rgba(0,200,255,.15);
}

/* Logo */
.tr-nav .nav-logo {
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  font-size: 1.1rem;
  letter-spacing: -.5px;
  color: var(--white);
  text-decoration: none;
  margin-right: auto;
}
.tr-nav .nav-logo em { color: var(--cyan); font-style: normal; }

/* Nav links row */
.nav-links { display: flex; align-items: center; gap: 4px; }
.nav-links a {
  font-size: .85rem;
  color: rgba(255,255,255,.6);
  font-weight: 500;
  padding: 7px 14px;
  border-radius: 999px;
  text-decoration: none;
  transition: color .2s, background .2s;
  white-space: nowrap;
}
.nav-links a:hover { color: var(--white); background: rgba(255,255,255,.06); }
.nav-links a.active { color: var(--white); }

/* Login CTA */
.nav-cta {
  background: var(--cyan) !important;
  color: #0B0B12 !important;
  padding: 9px 22px !important;
  border-radius: 999px !important;
  font-family: 'Syne', sans-serif;
  font-weight: 700 !important;
  font-size: .82rem !important;
  transition: opacity .2s !important;
  margin-left: 4px;
}
.nav-cta:hover { opacity: .85 !important; }

/* Hamburger — hidden on desktop */
.nav-toggle {
  display: none;
  background: transparent;
  border: 1px solid var(--border-mid);
  border-radius: 999px;
  color: var(--white);
  padding: 6px 12px;
  cursor: pointer;
  font-size: 1rem;
  margin-left: auto;
}

/* Mobile */
@media (max-width: 768px) {
  .tr-nav { width: calc(100% - 32px); top: 12px; }
  .nav-links {
    display: none;
    position: absolute;
    top: calc(100% + 8px);
    left: 0; right: 0;
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
    background: rgba(14, 14, 28, 0.96);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 16px;
    padding: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,.5);
    z-index: 10;
  }
  .nav-links.open { display: flex; }
  .nav-links a { padding: 12px 16px; border-radius: 10px; }
  .nav-links a.active { color: var(--cyan); background: rgba(0,200,255,.06); }
  .nav-cta { text-align: center; margin-left: 0 !important; }
  .nav-toggle { display: flex; align-items: center; }
  .page { padding-top: 72px; }
}
```

### New footer CSS block (replaces lines 499–521 in styles.css)

```css
/* ---------- FOOTER ---------- */
.tr-footer {
  background: var(--bg-mid);
  border-top: 1px solid var(--border-soft);
  padding: 48px clamp(24px, 4vw, 56px) 28px;
}
.tr-footer .f-inner {
  max-width: 1100px;
  margin: 0 auto 28px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 48px;
  align-items: start;
}
.tr-footer .f-brand .f-logo {
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  font-size: 1.1rem;
  color: var(--white);
  margin-bottom: 10px;
}
.tr-footer .f-brand .f-logo em { color: var(--cyan); font-style: normal; }
.tr-footer .f-brand p {
  font-size: .82rem;
  color: var(--muted);
  max-width: 280px;
  line-height: 1.6;
}
.tr-footer .f-links {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;
}
.tr-footer .f-links a {
  color: var(--muted);
  font-size: .83rem;
  text-decoration: none;
  transition: color .2s;
}
.tr-footer .f-links a:hover { color: var(--white); }
.tr-footer .f-links a.f-cta { color: var(--cyan); font-weight: 600; }
.tr-footer .f-bottom {
  max-width: 1100px;
  margin: 0 auto;
  padding-top: 20px;
  border-top: 1px solid var(--border-soft);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: .75rem;
  color: rgba(255,255,255,.25);
  flex-wrap: wrap;
  gap: 10px;
}
.tr-footer .f-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(0,200,255,.08);
  border: 1px solid rgba(0,200,255,.15);
  border-radius: 999px;
  padding: 4px 12px 4px 8px;
  font-size: .7rem;
  color: var(--cyan);
}
.tr-footer .f-badge-dot {
  width: 6px; height: 6px;
  background: var(--cyan);
  border-radius: 50%;
  flex-shrink: 0;
}
@media (max-width: 600px) {
  .tr-footer .f-inner { grid-template-columns: 1fr; gap: 28px; }
  .tr-footer .f-links { align-items: flex-start; flex-direction: row; flex-wrap: wrap; gap: 12px 20px; }
}
```

### New nav HTML — index.html (Home active)

```html
<!-- NAV -->
<nav class="tr-nav" id="mainNav">
  <div class="nav-inner">
    <a href="index.html" class="nav-logo">T<em>0</em>kenRent</a>
    <button class="nav-toggle" aria-label="Toggle menu" aria-expanded="false" onclick="toggleNav(this)">☰</button>
    <div class="nav-links" id="navLinks">
      <a href="index.html" class="active">Home</a>
      <a href="how-it-works.html">How It Works</a>
      <a href="login.html" class="nav-cta">Login</a>
    </div>
  </div>
</nav>
```

### New nav HTML — how-it-works.html (How It Works active)

```html
<!-- NAV -->
<nav class="tr-nav" id="mainNav">
  <div class="nav-inner">
    <a href="index.html" class="nav-logo">T<em>0</em>kenRent</a>
    <button class="nav-toggle" aria-label="Toggle menu" aria-expanded="false" onclick="toggleNav(this)">☰</button>
    <div class="nav-links" id="navLinks">
      <a href="index.html">Home</a>
      <a href="how-it-works.html" class="active">How It Works</a>
      <a href="login.html" class="nav-cta">Login</a>
    </div>
  </div>
</nav>
```

### New nav HTML — login.html (no CTA — user is already here)

```html
<!-- NAV -->
<nav class="tr-nav" id="mainNav">
  <div class="nav-inner">
    <a href="index.html" class="nav-logo">T<em>0</em>kenRent</a>
    <button class="nav-toggle" aria-label="Toggle menu" aria-expanded="false" onclick="toggleNav(this)">☰</button>
    <div class="nav-links" id="navLinks">
      <a href="index.html">Home</a>
      <a href="how-it-works.html">How It Works</a>
    </div>
  </div>
</nav>
```

### New footer HTML — all public pages

```html
<footer class="tr-footer">
  <div class="f-inner">
    <div class="f-brand">
      <div class="f-logo">T<em>0</em>kenRent</div>
      <p>The peer-to-peer rental marketplace for cameras, tools, vehicles, and more.</p>
    </div>
    <div class="f-links">
      <a href="how-it-works.html">How It Works</a>
      <a href="dashboard.html">Dashboard</a>
      <a href="login.html" class="f-cta">Login / Sign up</a>
    </div>
  </div>
  <div class="f-bottom">
    <span>© 2026 T0kenRent. All rights reserved.</span>
    <span class="f-badge"><span class="f-badge-dot"></span>Blockchain-verified rentals</span>
  </div>
</footer>
```

### New footer HTML — dashboard.html only (no tagline, different links)

```html
<footer class="tr-footer">
  <div class="f-inner">
    <div class="f-brand">
      <div class="f-logo">T<em>0</em>kenRent</div>
      <p>The peer-to-peer rental marketplace for cameras, tools, vehicles, and more.</p>
    </div>
    <div class="f-links">
      <a href="how-it-works.html">How It Works</a>
      <a href="dashboard.html">Dashboard</a>
      <a href="login.html" class="f-cta">Login / Sign up</a>
    </div>
  </div>
  <div class="f-bottom">
    <span>© 2026 T0kenRent. All rights reserved.</span>
    <span class="f-badge"><span class="f-badge-dot"></span>Blockchain-verified rentals</span>
  </div>
</footer>
```

### Scroll JS snippet (add to every public page's inline `<script>`)

```js
  // Floating nav scroll tint
  (function() {
    var nav = document.getElementById('mainNav');
    if (!nav) return;
    window.addEventListener('scroll', function() {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  })();
```

### toggleNav + close-on-click JS (same pattern, works with new structure)

```js
  function toggleNav(btn) {
    var links = document.getElementById('navLinks');
    var open = links.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
    btn.textContent = open ? '✕' : '☰';
  }
  document.querySelectorAll('#navLinks a').forEach(function(a) {
    a.addEventListener('click', function() {
      var links = document.getElementById('navLinks');
      var btn = document.querySelector('.nav-toggle');
      if (links && links.classList.contains('open')) {
        links.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        btn.textContent = '☰';
      }
    });
  });
```

---

## Task 1: CSS — Replace nav and footer blocks

**Files:**
- Modify: `frontend/styles.css:90-243` (nav block)
- Modify: `frontend/styles.css:499-521` (footer block)

- [ ] **Step 1: Replace the nav CSS block**

In `styles.css`, find the exact block starting with:
```
/* Page wrapper offset for fixed nav */
.page { padding-top: 64px; min-height: 100vh; }

/* ---------- NAV ---------- */
.tr-nav {
  position: fixed;
  top: 0; left: 0; right: 0;
```
...and ending with the closing brace of the `@media (max-width: 900px)` block that contains `.nav-toggle { display: inline-flex; align-items: center; }` (line 242) plus the closing `}` and blank line before `/* ---------- BUTTONS`.

Replace that entire block with the **New nav CSS block** from the CSS Reference section above.

- [ ] **Step 2: Replace the footer CSS block**

In `styles.css`, find the exact block starting with:
```css
/* ---------- FOOTER ---------- */
.tr-footer {
  background: var(--bg-subtle);
```
...ending with:
```css
.tr-footer .f-links a:hover { color: var(--cyan); }
```

Replace that entire block with the **New footer CSS block** from the CSS Reference section above.

- [ ] **Step 3: Verify no orphaned rules**

Run:
```bash
grep -n "nav-user-pill\|nav-av\b\|nav-user-name\|nav-admin-badge\|nav-logout-btn\|bg-subtle" /Users/ian/Desktop/TokenRent/frontend/styles.css
```
Expected: zero matches for `nav-user-pill`, `nav-av`, `nav-user-name`, `nav-admin-badge`, `nav-logout-btn`. (`bg-subtle` may appear elsewhere — that's fine.)

- [ ] **Step 4: Commit**

```bash
cd /Users/ian/Desktop/TokenRent
git add frontend/styles.css
git commit -m "design: replace nav with floating glass pill, redesign footer CSS"
```

---

## Task 2: index.html — Nav, hero CTAs, footer, scripts

**Files:**
- Modify: `frontend/index.html:276-287` (nav HTML)
- Modify: `frontend/index.html:300-301` (hero CTA hrefs)
- Modify: `frontend/index.html:420-429` (footer HTML)
- Modify: `frontend/index.html:446-463` (inline script — toggleNav + close-links)

- [ ] **Step 1: Replace nav HTML**

Find and replace the entire `<!-- NAV -->` block:
```html
<!-- NAV -->
<nav class="tr-nav">
  <a href="index.html" class="nav-logo">T<em>0</em>kenRent</a>
  <button class="nav-toggle ms-auto" aria-label="Toggle menu" aria-expanded="false" aria-controls="navLinks" onclick="toggleNav(this)">☰</button>
  <div class="nav-links ms-auto" id="navLinks">
    <a href="index.html" class="active">Home</a>
    <a href="how-it-works.html">How It Works</a>
    <a href="browse.html">Browse</a>
    <a href="list-item.html">List Item</a>
    <a href="dashboard.html">Dashboard</a>
    <a href="login.html" class="nav-cta">Login</a>
  </div>
</nav>
```
With the **New nav HTML — index.html** from the CSS Reference section.

- [ ] **Step 2: Update hero CTA hrefs**

Find:
```html
    <a href="browse.html" class="btn btn-primary px-4 py-3">Browse Equipment</a>
    <a href="list-item.html" class="btn btn-outline-cyan px-4 py-3">List Your Item</a>
```
Replace with:
```html
    <a href="dashboard.html#browse" class="btn btn-primary px-4 py-3">Browse Equipment</a>
    <a href="dashboard.html#list" class="btn btn-outline-cyan px-4 py-3">List Your Item</a>
```

- [ ] **Step 3: Replace footer HTML**

Find and replace the entire `<!-- FOOTER -->` block:
```html
<!-- FOOTER -->
<footer class="tr-footer">
  <div class="f-logo">T<em>0</em>kenRent</div>
  <small>Blockchain-Based Smart Rental · Web Systems · HTML · CSS · JS · Bootstrap 5</small>
  <div class="f-links">
    <a href="browse.html">Browse</a>
    <a href="list-item.html">List Item</a>
    <a href="dashboard.html">Dashboard</a>
    <a href="login.html">Login</a>
  </div>
</footer>
```
With:
```html
<!-- FOOTER -->
```
followed by the **New footer HTML — all public pages** from the CSS Reference section.

- [ ] **Step 4: Update inline script**

Find and replace the `toggleNav` function and close-on-click block:
```js
  function toggleNav(btn){
    const links = document.getElementById('navLinks');
    const open = links.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
    btn.textContent = open ? '✕' : '☰';
  }
  // Close mobile nav when a link is clicked
  document.querySelectorAll('#navLinks a').forEach(a => {
    a.addEventListener('click', () => {
      const links = document.getElementById('navLinks');
      const btn = document.querySelector('.nav-toggle');
      if (links.classList.contains('open')) {
        links.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        btn.textContent = '☰';
      }
    });
  });
```
With the **toggleNav + close-on-click JS** from the CSS Reference section. Then append the **Scroll JS snippet** just before the closing `</script>` tag.

The final inline `<script>` block should look like:
```html
<script>
  document.addEventListener('DOMContentLoaded', () => {
    Auth.ready().then(user => {
      if (user) {
        window.location.replace('dashboard.html#browse');
        return;
      }
    });
  });

  function toggleNav(btn) {
    var links = document.getElementById('navLinks');
    var open = links.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
    btn.textContent = open ? '✕' : '☰';
  }
  document.querySelectorAll('#navLinks a').forEach(function(a) {
    a.addEventListener('click', function() {
      var links = document.getElementById('navLinks');
      var btn = document.querySelector('.nav-toggle');
      if (links && links.classList.contains('open')) {
        links.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        btn.textContent = '☰';
      }
    });
  });

  // Floating nav scroll tint
  (function() {
    var nav = document.getElementById('mainNav');
    if (!nav) return;
    window.addEventListener('scroll', function() {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  })();
</script>
```

- [ ] **Step 5: Verify**

Open `frontend/index.html` in a browser (double-click or `open frontend/index.html`). Confirm:
- Nav renders as a floating pill, not full-width bar
- Logo left, Home (active/white), How It Works (muted), Login (cyan pill) on right
- No Browse, no List Item, no Dashboard links
- Hero CTAs link to `dashboard.html#browse` and `dashboard.html#list` (check href in DevTools)
- Footer shows logo + tagline on left, 3 stacked links on right, copyright strip at bottom
- No Browse or List Item in footer

- [ ] **Step 6: Commit**

```bash
git add frontend/index.html
git commit -m "design: floating glass pill nav, updated footer + hero CTAs on index.html"
```

---

## Task 3: how-it-works.html — Nav, footer, scripts

**Files:**
- Modify: `frontend/how-it-works.html:259-266` (nav HTML)
- Modify: `frontend/how-it-works.html:542-548` (footer HTML)
- Modify: `frontend/how-it-works.html:556-585` (inline script)

- [ ] **Step 1: Replace nav HTML**

Find and replace the nav block (currently lines 259–266):
```html
<nav class="tr-nav">
  <a href="index.html" class="nav-logo">T<em>0</em>kenRent</a>
  <button class="nav-toggle ms-auto" aria-label="Toggle menu" aria-expanded="false" onclick="toggleNav(this)">☰</button>
  <div class="nav-links ms-auto" id="navLinks">
    <a href="index.html">Home</a>
    <a href="how-it-works.html" class="active">How It Works</a>
    <a href="browse.html">Browse</a>
    <a href="list-item.html">List Item</a>
    <a href="dashboard.html">Dashboard</a>
    <a href="login.html" class="nav-cta">Login</a>
  </div>
</nav>
```
With **New nav HTML — how-it-works.html** from the CSS Reference section.

- [ ] **Step 2: Replace footer HTML**

Find and replace the footer block (currently lines 542–548):
```html
<footer class="tr-footer">
  <div class="f-logo">T<em>0</em>kenRent</div>
  <small>Blockchain-Based Smart Rental · Web Systems</small>
  <div class="f-links">
    <a href="index.html">Home</a>
    <a href="browse.html">Browse</a>
    <a href="list-item.html">List Item</a>
    <a href="dashboard.html">Dashboard</a>
    <a href="login.html">Login</a>
  </div>
</footer>
```
With the **New footer HTML — all public pages** from the CSS Reference section.

- [ ] **Step 3: Update inline script**

The current inline `<script>` block (lines 556–585) contains: auth-aware nav pill replacement, `switchRole()`, `toggleFaq()`, `toggleNav()`. Keep `switchRole()` and `toggleFaq()` exactly as-is. Replace only the `DOMContentLoaded` callback and `toggleNav` + close-on-click block.

The full updated `<script>` block should be:
```html
<script>
  function switchRole(role, btn) {
    document.querySelectorAll('.role-tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
    btn.classList.add('active'); btn.setAttribute('aria-selected','true');
    document.querySelectorAll('.steps').forEach(s => s.classList.remove('active'));
    document.getElementById('steps-' + role).classList.add('active');
  }

  function toggleFaq(el) {
    el.parentElement.classList.toggle('open');
  }

  function toggleNav(btn) {
    var links = document.getElementById('navLinks');
    var open = links.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
    btn.textContent = open ? '✕' : '☰';
  }
  document.querySelectorAll('#navLinks a').forEach(function(a) {
    a.addEventListener('click', function() {
      var links = document.getElementById('navLinks');
      var btn = document.querySelector('.nav-toggle');
      if (links && links.classList.contains('open')) {
        links.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        btn.textContent = '☰';
      }
    });
  });

  // Floating nav scroll tint
  (function() {
    var nav = document.getElementById('mainNav');
    if (!nav) return;
    window.addEventListener('scroll', function() {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  })();
</script>
```

Note: The old `DOMContentLoaded` auth-aware nav pill code is removed — it was dead code since `auth.js` redirects logged-in users before the DOM settles.

- [ ] **Step 4: Verify**

Open `frontend/how-it-works.html`. Confirm:
- Floating pill nav with How It Works highlighted (white, not muted)
- No Browse/List Item/Dashboard links
- Footer matches index.html footer (2-column + strip)
- Role tabs still toggle (Renter / Owner)
- FAQ accordion still works

- [ ] **Step 5: Commit**

```bash
git add frontend/how-it-works.html
git commit -m "design: floating pill nav + redesigned footer on how-it-works.html"
```

---

## Task 4: login.html — Nav + add footer + scroll JS

**Files:**
- Modify: `frontend/login.html:267-277` (nav HTML)
- Modify: `frontend/login.html` before `</body>` (add footer)
- Modify: `frontend/login.html` inline script (add scroll JS + toggleNav)

- [ ] **Step 1: Replace nav HTML**

Find and replace (currently lines 267–277):
```html
<nav class="tr-nav">
  <a href="index.html" class="nav-logo">T<em>0</em>kenRent</a>
  <button class="nav-toggle ms-auto" aria-label="Toggle menu" aria-expanded="false" onclick="toggleNav(this)">☰</button>
  <div class="nav-links ms-auto" id="navLinks">
    <a href="index.html">Home</a>
    <a href="browse.html">Browse</a>
    <a href="list-item.html">List Item</a>
    <a href="dashboard.html">Dashboard</a>
    <a href="login.html" class="active">Login</a>
  </div>
</nav>
```
With the **New nav HTML — login.html** from the CSS Reference section (no CTA, no active link since Login CTA is absent).

- [ ] **Step 2: Add footer before `</body>`**

Find the closing `</body>` tag and insert the **New footer HTML — all public pages** from the CSS Reference section immediately before it, leaving the existing `<script src="...bootstrap...">`, `<script src="auth.js">`, and the inline `<script>` above it untouched.

The end of the file should look like:
```html
  ...last content div...

<footer class="tr-footer">
  <div class="f-inner">
    <div class="f-brand">
      <div class="f-logo">T<em>0</em>kenRent</div>
      <p>The peer-to-peer rental marketplace for cameras, tools, vehicles, and more.</p>
    </div>
    <div class="f-links">
      <a href="how-it-works.html">How It Works</a>
      <a href="dashboard.html">Dashboard</a>
      <a href="login.html" class="f-cta">Login / Sign up</a>
    </div>
  </div>
  <div class="f-bottom">
    <span>© 2026 T0kenRent. All rights reserved.</span>
    <span class="f-badge"><span class="f-badge-dot"></span>Blockchain-verified rentals</span>
  </div>
</footer>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="auth.js"></script>
<script>
  ...existing login form JS...
</script>

</body>
</html>
```

- [ ] **Step 3: Add scroll JS + toggleNav to inline script**

The existing login.html inline `<script>` block (starts around line 444) handles form submissions, tab switching (Login/Register), and password visibility. It does NOT contain `toggleNav`. Append the following just before the closing `</script>` tag of that block:

```js
  function toggleNav(btn) {
    var links = document.getElementById('navLinks');
    var open = links.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
    btn.textContent = open ? '✕' : '☰';
  }
  document.querySelectorAll('#navLinks a').forEach(function(a) {
    a.addEventListener('click', function() {
      var links = document.getElementById('navLinks');
      var btn = document.querySelector('.nav-toggle');
      if (links && links.classList.contains('open')) {
        links.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        btn.textContent = '☰';
      }
    });
  });

  // Floating nav scroll tint
  (function() {
    var nav = document.getElementById('mainNav');
    if (!nav) return;
    window.addEventListener('scroll', function() {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  })();
```

- [ ] **Step 4: Verify**

Open `frontend/login.html`. Confirm:
- Floating pill nav shows logo + Home + How It Works (no Login CTA — user is already here)
- Footer appears at the bottom of the page (was missing before)
- Login / Register form still works visually
- No console errors

- [ ] **Step 5: Commit**

```bash
git add frontend/login.html
git commit -m "design: floating pill nav + add footer on login.html"
```

---

## Task 5: dashboard.html — Footer update + push

**Files:**
- Modify: `frontend/dashboard.html:514-523` (footer HTML)

- [ ] **Step 1: Replace footer HTML**

Find and replace (currently lines 514–523):
```html
<footer class="tr-footer">
  <div class="f-logo">T<em>0</em>kenRent</div>
  <small>Blockchain-Based Smart Rental · Web Systems</small>
  <div class="f-links">
    <a href="index.html">Home</a>
    <a href="browse.html">Browse</a>
    <a href="list-item.html">List Item</a>
    <a href="login.html">Login</a>
  </div>
</footer>
```
With the **New footer HTML — dashboard.html only** from the CSS Reference section.

- [ ] **Step 2: Verify**

Open `frontend/dashboard.html` (requires login — use the dev server or open locally with a valid session). Confirm:
- Footer shows 2-column grid (logo+tagline left, 3 links right)
- Links are: How It Works · Dashboard · Login / Sign up
- No Browse or List Item in footer
- Copyright strip + badge visible at bottom
- Dashboard nav (sidebar) is completely unchanged

- [ ] **Step 3: Cross-page smoke test**

Open each of the 4 pages and confirm:
1. `index.html` — pill nav, 3 links, footer
2. `how-it-works.html` — pill nav, 3 links (How It Works active), footer
3. `login.html` — pill nav, 2 links (no CTA), footer
4. `dashboard.html` — no top nav (sidebar only), updated footer
5. Resize to <768px on any page — confirm hamburger appears, pill shrinks, links open in dropdown

- [ ] **Step 4: Push to GitHub**

```bash
git push origin main
```
Expected: push succeeds, Vercel deployment starts within ~30 seconds.

- [ ] **Step 5: Verify on Vercel**

Open `https://tokenrent-psi.vercel.app` and confirm the floating pill nav is live.
