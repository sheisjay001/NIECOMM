# Local Electronics Marketplace (Trust‑First)

A location‑first electronics marketplace designed for Nigeria, built around **trust, cost efficiency, and local fulfillment**.

This is **not another generic ecommerce app**.  
It prioritizes:
- Buying from **verified local vendors**
- **Clear returns**
- **Transparent pricing**
- Reduced logistics risk
- Calm, confidence‑driven UX

---

## Core Problem

Electronics buyers in Nigeria face:
- Fake or misrepresented products
- Unclear return policies
- Hidden delivery fees
- Long-distance logistics failures
- Low trust in online vendors

This platform solves those problems by making **locality and verification first‑class features**, not filters.

---

## Product Principles

- **Trust before growth**
- **Local before national**
- **Clarity before conversion**
- **Calm before persuasion**

If a feature does not increase trust, reduce friction, or save money locally, it does not ship.

---

## Key Features

### 1. Location‑First Shopping
- Manual state, city, and LGA selection (GPS optional)
- Products shown based on local availability
- Distance and pickup speed visible on every product

### 2. Verified Vendor System
- Vendor verification badge
- Physical shop indicator (where applicable)
- Completed sales count
- Reputation weighted by recent performance

### 3. Transparent Returns
- Clear return window displayed everywhere
- In‑store return option
- Local pickup for returns
- No hidden terms

### 4. Calm, Trust‑Driven UI
- Product‑first layouts
- Minimal animations
- Clear hierarchy
- Neutral, quiet color system

### 5. Vendor Dashboard
- Orders grouped by location
- Clear return requests
- Performance metrics
- Clean, neutral UI for vendors

---

## Design System

### Brand Colors

| Purpose | Color | Hex |
|------|------|------|
| Primary (Trust) | Deep Indigo Blue | #1E2A44 |
| Success / Verified | Emerald Green | #1FA971 |
| Attention / Urgency | Warm Amber | #F4B400 |
| Error | Respectful Red | #DC2626 |
| Warning | Soft Amber | #F59E0B |

### Neutral System

- Primary Text: #0F172A
- Secondary Text: #475569
- Borders: #E2E8F0
- App Background: #F8FAFC
- Cards: #FFFFFF

### Typography
- Font: Inter (or SF Pro equivalent)
- Headings: Semi‑bold
- Body: Regular
- Prices: Medium weight

No decorative fonts. No hype.

---

## Trust Stack (Always Visible)

1. Locality (distance / pickup speed)
2. Vendor verification
3. Return eligibility
4. Social proof (completed sales)

This stack appears consistently across:
- Product cards
- Product detail pages
- Checkout review

---

## UX Designed for Nigerian Realities

- Manual location control (no forced GPS)
- Cached views for unstable connectivity
- Early display of final costs
- Clear pickup vs delivery choice
- Savings indicator for buying locally

Example:
> You saved ₦4,500 by buying locally

---

## Tech Stack (Suggested)

- Frontend: Next.js
- Styling: TailwindCSS
- Backend: Node.js / NestJS
- Database: PostgreSQL
- Auth: Clerk / Firebase Auth
- Hosting: Vercel
- Storage: S3‑compatible (Wasabi / Cloudflare R2)

---

## Roadmap

### Phase 1
- Buyer onboarding
- Location selection
- Product listing
- Vendor verification MVP

### Phase 2
- Returns workflow
- Vendor dashboard
- Reputation scoring

### Phase 3
- Local logistics partnerships
- Escrow payments
- Analytics & fraud prevention

---

## License

MIT License

---

## Final Note

This project is about **confidence at the point of purchase**.

Calm beats loud.  
Clear beats clever.  
Local beats distant.
