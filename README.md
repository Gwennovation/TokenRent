# T0kenRent — Smart Peer-to-Peer Equipment Rental

Blockchain-backed rental marketplace for the Web Systems course. Full-stack: HTML/CSS/JS frontend, Node.js + Express backend, MongoDB Atlas database, HandCash Connect for wallet auth, Cloudinary for photos.

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | HTML5 · CSS3 · Vanilla JS · Bootstrap 5 |
| Backend  | Node.js 18+ · Express 4 |
| Database | MongoDB Atlas (via Mongoose) |
| Auth     | HandCash Connect (OAuth) + email/password (bcrypt) · JWT in HttpOnly cookies |
| Photos   | Cloudinary (free tier) |
| Hosting  | Vercel (serverless) |

---

## Project structure

```
TokenRent - WebSys Project/
├── api/
│   └── index.js              ← Vercel serverless entry
├── backend/
│   ├── app.js                ← Express app factory (no listen)
│   ├── config/
│   │   ├── db.js             MongoDB connection (cached for serverless)
│   │   └── cloudinary.js     Cloudinary SDK config
│   ├── controllers/          Request handlers, one file per resource
│   ├── middleware/           auth, admin, upload, error
│   ├── models/               Mongoose schemas: User, Item, Rental, Dispute
│   ├── routes/               Express route mounts
│   ├── utils/                jwt.js, handcash.js
│   └── seed/seed.js          Sample data seeder
├── frontend/                 Static files — Express serves these locally
│   ├── index.html            Landing
│   ├── how-it-works.html     How-it-works page
│   ├── browse.html           Search + filter
│   ├── item-detail.html      Item + booking
│   ├── list-item.html        Owner upload form
│   ├── dashboard.html        User dashboard
│   ├── admin.html            Admin console (admin-only)
│   ├── login.html            Sign in / Sign up
│   ├── styles.css            Design system
│   ├── auth.js               Auth client (calls backend)
│   └── auth-gate.js          Blocking modal on protected pages
├── server.js                 Local dev entry (npm start)
├── vercel.json               Vercel deployment config
├── package.json
├── .env.example              Template — copy to .env
├── .env                      Local secrets (gitignored)
└── .gitignore
```

---

## Local setup

### 1. Install Node.js 18+
Verify with `node --version`.

### 2. Install dependencies
```bash
cd "TokenRent - WebSys Project"
npm install
```

### 3. Fill in `.env`
The file already exists with most values filled in. Confirm/replace:

| Variable | Where to get it |
|----------|----------------|
| `MONGO_URI` | MongoDB Atlas → cluster → Connect → Drivers — should already be set |
| `JWT_SECRET` | Run `openssl rand -base64 48` and paste the output |
| `HANDCASH_APP_ID` | Already set (`692c…07d4e`) |
| `HANDCASH_APP_SECRET` | From [dashboard.handcash.io](https://dashboard.handcash.io) — paste yours |
| `CLOUDINARY_*` | Sign up at [cloudinary.com](https://cloudinary.com) → Dashboard → Cloud Name + API Key + API Secret |
| `ADMIN_EMAIL` | Already set to `manalogwyneth2@gmail.com` — first user to register with this email becomes admin |

### 4. HandCash redirect URL
In [HandCash Dashboard](https://dashboard.handcash.io) → your app → Authorized Redirect URLs, add:
```
http://localhost:3000/auth/handcash/callback
```
(Add your Vercel URL too once you deploy — see below.)

### 5. Seed sample data (optional but recommended)
```bash
npm run seed
```
Creates a demo owner (login: `demo@tokenrent.local` / `demo-password-12345`) and 10 sample items.

### 6. Run the server
```bash
npm run dev    # auto-restart on file changes (nodemon)
# or
npm start      # production mode
```

Open `http://localhost:3000` — the landing page should appear with the dark navy/cyan theme.

---

## Deploy to Vercel

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial T0kenRent project"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/tokenrent.git
git push -u origin main
```
**Make sure `.env` is gitignored** — `git status` should NOT show it before pushing.

### 2. Import the repo on Vercel
- Go to [vercel.com](https://vercel.com) → New Project
- Import your GitHub repo
- Framework Preset: **Other**
- Root Directory: `./` (default)
- Build Command: leave empty (Vercel reads `vercel.json`)
- Click **Deploy**

### 3. Add environment variables in Vercel
After the first deploy, go to **Settings → Environment Variables** and add every key from your local `.env`:

- `MONGO_URI`
- `JWT_SECRET`
- `HANDCASH_APP_ID`
- `HANDCASH_APP_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `ADMIN_EMAIL`
- `NODE_ENV` → `production`
- `APP_URL` → your Vercel URL (e.g., `https://tokenrent.vercel.app`)

Click **Save**, then **Deployments → Redeploy** to apply.

### 4. Update HandCash redirect URL
In HandCash Dashboard, add your Vercel URL to Authorized Redirect URLs:
```
https://YOUR_VERCEL_DOMAIN.vercel.app/auth/handcash/callback
```

### 5. (Optional) Add a custom domain
Vercel → Project → Settings → Domains → add your domain → follow DNS instructions.

---

## API reference

All endpoints return JSON. Auth is via JWT in an HttpOnly cookie — set on login, sent on every subsequent request.

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET    | `/api/health`               | — | Health check |
| POST   | `/auth/register`            | — | Email/password registration |
| POST   | `/auth/login`               | — | Email/password login |
| POST   | `/auth/logout`              | — | Clear session |
| GET    | `/auth/me`                  | — | Get current user (or null) |
| GET    | `/auth/handcash`            | — | Redirects to HandCash OAuth |
| GET    | `/auth/handcash/callback`   | — | OAuth callback — sets session, redirects to dashboard |
| GET    | `/api/items`                | — | List items (paginated, filterable) |
| GET    | `/api/items/mine`           | user | My listings |
| GET    | `/api/items/:id`            | — | Item detail |
| POST   | `/api/items`                | user | Create listing (multipart: photos[]) |
| PATCH  | `/api/items/:id`            | owner | Update listing |
| DELETE | `/api/items/:id`            | owner | Delete listing |
| POST   | `/api/rentals`              | user | Create booking request |
| GET    | `/api/rentals/mine`         | user | My rentals (as=renter\|owner) |
| PATCH  | `/api/rentals/:id/accept`   | owner | Accept request |
| PATCH  | `/api/rentals/:id/decline`  | owner | Decline request |
| PATCH  | `/api/rentals/:id/cancel`   | renter | Cancel before pickup |
| PATCH  | `/api/rentals/:id/return`   | owner | Confirm return |
| POST   | `/api/rentals/:id/review`   | renter | Leave a review |
| GET    | `/api/users/me`             | user | Profile |
| PATCH  | `/api/users/me`             | user | Update profile |
| GET    | `/api/users/me/stats`       | user | Dashboard stats |
| POST   | `/api/users/disputes`       | user | Open dispute (multipart: evidence[]) |
| GET    | `/api/admin/users`          | admin | List/search users |
| PATCH  | `/api/admin/users/:id`      | admin | Suspend/verify/promote |
| DELETE | `/api/admin/users/:id`      | admin | Soft-delete |
| GET    | `/api/admin/disputes`       | admin | List disputes |
| PATCH  | `/api/admin/disputes/:id/resolve` | admin | Resolve dispute |
| GET    | `/api/admin/analytics`      | admin | Platform metrics |

---

## Data model

**User** — email or HandCash identity; role: user/admin; status: active/suspended/deleted; verification flag; aggregate stats.

**Item** — owner (User ref); title/description/category/condition; pricing (dailyRate, securityDeposit); availability dates; photos (Cloudinary URLs); status: available/rented/overdue/unavailable; stats.

**Rental** — item + owner + renter refs; date range; price snapshot at booking time; status state machine (pending → accepted → completed, or branches: declined, cancelled, overdue, disputed); optional review.

**Dispute** — opened by either party against the other; type (damage/late_return/no_show/payment/other); evidence photos; admin resolution with deposit split decision.

---

## Security notes

- `.env` is in `.gitignore` — never commit secrets
- HandCash App Secret only ever lives in backend env vars
- Passwords hashed with bcrypt (cost 12)
- JWT in HttpOnly cookie (not accessible to JS — XSS-safe)
- Helmet sets security headers
- Rate limit: 200 req / 15 min per IP on `/api`
- Mongoose validation on every write
- `select: false` on `passwordHash` — never returned

**Action item for the team:** rotate the MongoDB password in Atlas after the project ends — once shared, treat it as compromised.

---

## Common issues

| Problem | Fix |
|---------|-----|
| `MONGO_URI is missing` | `.env` not loaded — make sure file exists at project root |
| HandCash redirects to login with `?error=handcash` | App Secret wrong, OR redirect URL not added to HandCash dashboard |
| Photos don't upload | Cloudinary creds missing/wrong in `.env` |
| Vercel 500 on every API call | Environment variables not set in Vercel dashboard (re-deploy after adding them) |
| "Sign in required" loop | Cookie not setting — check `APP_URL` matches actual domain (no trailing slash) |
| Admin page shows "Admin access only" | Your email doesn't match `ADMIN_EMAIL` — register with that exact email |

---

## Scripts

```bash
npm start       # Run server (production mode)
npm run dev     # Run with nodemon (auto-reload)
npm run seed    # Seed sample items
```
