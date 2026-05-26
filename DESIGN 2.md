# Design System — T0kenRent

## Theme

Dark. Always. Users are browsing listings, checking rental status, managing gear — often at night, on phones, in contexts where a bright white screen would be jarring. The dark navy surfaces feel premium and focused. This is not negotiable.

## Color

Strategy: **Committed** — the deep navy is the canvas, cyan is the primary action color, purple and pink are accent roles used deliberately.

```
--bg-deep:    #0B0B12   /* page background */
--bg-subtle:  #14141F   /* nav, sidebar, footer */
--bg-card:    #1C1C2E   /* cards, panels */
--bg-surface: #2A2A3E   /* inputs, raised elements */

--cyan:   #00C8FF   /* primary actions, active states, links */
--purple: #A855F7   /* secondary accents, stat highlights */
--pink:   #E91E8C   /* tertiary accent, badges, alerts */

--white: #FFFFFF
--muted: #9CA3AF
--soft:  #C7C7D1

--success: #4ADE80
--warning: #FBBF24
--danger:  #F87171
```

Cyan is the trust color — it signals "do this." Purple is the discovery color — exploration, premium feel. Pink is the alert color — pending, urgent, notable.

## Typography

- **Syne** (700, 800): headings, labels, nav, buttons, section titles
- **DM Sans** (300, 400, 500): body copy, table data, supporting text

Scale:
- Display: clamp(2.6rem, 7vw, 5.6rem) — hero only
- H1: clamp(1.7rem, 3vw, 2.3rem)
- H2: 1.5rem
- Section title: clamp(1.7rem, 3.4vw, 2.6rem)
- Card title: 0.95rem–1.1rem
- Body: 15px / 0.9rem
- Small/meta: 0.72rem–0.82rem

## Components

### Navigation
Fixed, 64px, frosted glass (`rgba(11,11,18,.82)` + `backdrop-filter: blur(20px)`). Logo left, links center-right, CTA rightmost. CTA is cyan-filled when logged out (Login), replaced by user pill when logged in (avatar + name + sign out).

### Buttons
- Primary: `background: var(--cyan); color: var(--bg-deep)` — cyan fill, dark text
- Outline: transparent + white border, hover to cyan tint
- Purple: `background: var(--purple); color: white`
- Ghost: transparent, muted text

### Cards
`background: var(--bg-card)`, `border: 1px solid rgba(255,255,255,.06)`, `border-radius: 18px`. Hover: `translateY(-4px)` + cyan border tint.

### Badges / Status
Pill-shaped, uppercase, dot prefix, color-coded by status:
- available: green tint
- rented: cyan tint
- overdue: red tint
- pending: amber tint
- completed: purple tint

### Forms
Dark inputs (`var(--bg-subtle)`), cyan focus ring (`rgba(0,200,255,.18)`), Syne labels.

## Spacing & Layout

- Page offset: `padding-top: 64px` (nav height)
- Section padding: `clamp(20px, 4vw, 56px)` horizontal
- Card gap: 18px–22px
- Component breathing room: varies for rhythm — not identical padding everywhere

## Motion

- Transitions: 0.2s–0.25s, ease-out
- Button hover: `translateY(-2px)` + shadow lift
- Card hover: `translateY(-4px)` + border color shift
- Skeleton loader: shimmer animation for data loading states
- No bounce, no elastic, no layout property animations

## Icons

Emoji icons in UI elements are a placeholder smell. Replace with inline SVG or CSS shapes for production quality.

## Bans (project-specific enforcement)

- No `.g-text` gradient text — all text is solid color
- No side-stripe border accents (`border-left` > 1px colored)
- No hero-metric card templates (big number + gradient accent) — use contextual stat layouts
- No nested cards
- No modal as first response to user actions
