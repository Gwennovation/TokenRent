# Product

## Register

product

## Users

Peer-to-peer equipment owners and renters in the Philippines, primarily students and young professionals. Owners want passive income from idle gear (cameras, power tools, camping equipment). Renters want affordable access to equipment they can't justify buying. Both are mobile-first, comfortable with digital payments, and expect marketplace-grade UX without corporate stiffness.

## Product Purpose

T0kenRent is an equipment rental marketplace with blockchain-backed payments via HandCash. It lets anyone list gear and earn daily rental income, or rent equipment without large upfront costs. Success means: owners trust the platform to protect their gear (deposits, disputes, status tracking), and renters trust they'll get what they booked.

## Brand Personality

Bold, Modern, Community. This is a real product — not a school template. It should feel like something people want to use, not something they were assigned. The voice is direct, confident, and human. No corporate fluff, no startup buzzwords. Design earns trust through clarity and craft.

## Anti-references

- Bootstrap default look (blue buttons, gray cards, zero personality)
- Generic SaaS cream/white (Intercom, generic admin dashboards)
- Crypto bro neon (aggressive glow, matrix energy, laser eyes aesthetic)
- Light-mode Airbnb clone (rounded marketplace card grids with orange CTAs)

The existing dark navy + cyan/purple/pink palette stays. Refine it, don't replace it.

## Design Principles

1. **Trust is earned visually.** Every screen should feel stable and competent. Sparse, purposeful UI signals control — not emptiness.
2. **Auth state is always visible.** Logged-in users should never see a Login button. The user's identity anchors every screen.
3. **Community shows through data.** Real listings, real names, real stats. Empty states are honest and inviting, not hidden.
4. **Screens flow, not fragment.** Browse → Item Detail → Book → Dashboard should feel like one product, not 8 separate pages.
5. **Mobile is not a downgrade.** The sidebar, cards, and tables work at 375px without losing hierarchy.

## Accessibility & Inclusion

WCAG AA minimum. Focus rings maintained (already in styles.css). Color is never the only signal for status (badges use both color + label). Reduced motion respected via `prefers-reduced-motion` where animation is added.
