# DormSafe

A student housing platform for Ateneo de Davao — search nearby dorms, manage stays and tenants, and review listings through a verified workflow.

**Capstone 2 Project** — Aguirre, Pacatang, Palima  
Ateneo de Davao University · SY 2025–2026

## Tech Stack

| Layer | Stack |
|-------|--------|
| Frontend | React 19, Vite, Tailwind CSS, React Router |
| Backend | Node.js, Express |
| Database | Supabase (PostgreSQL, Auth, Storage) |
| Maps | Google Maps JavaScript, Directions, Distance Matrix, Geocoding |

## Project Structure

```
DormSafe/
├── client/          # React app (Vite)
├── server/          # Express API
├── supabase/        # SQL migrations
├── Places/          # Local seed assets (photos, property info)
└── README.md
```

## Features

### Students
- Search approved listings within **2 km** of Jacinto or Roxas gate (walking time)
- Property detail with map route, rooms, availability, and reservations
- **Saved listings** — bookmark and compare side-by-side
- **My Stay** — timeline, move-out confirm/dispute, payment status, lease summary print, maintenance requests
- Room **reservations** when a unit is occupied (queue position shown)
- **Reviews** (after completed stay, admin-moderated) and **report listing**

### Owners
- Account verification (ID + business permit)
- Add / **edit** listings (photos, price, rules, contact) — edits do not require full resubmit
- Manage tenants (link student by email → invite notification)
- Manual **payment log** + rent reminders (no online gateway)
- **Analytics** — vacancy rate, revenue trend, occupancy calendar, maintenance inbox

### Admins
- Dashboard with **system health** and **campus-wide stats** (Jacinto vs Roxas)
- Verify accounts and approve/reject listings (with filters, pagination, bulk actions)
- Manage users, tenants, reviews, and listing reports
- **Audit log** of approval/rejection actions

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run migrations **in order** via **SQL Editor**:
   - `001_initial_schema.sql`
   - `002_rls_policies.sql`
   - `004_fix_signup_trigger.sql`
   - `005_contact_and_receipts.sql`
   - `006_verifications_notifications.sql`
   - `007_stays_reservations.sql`
   - `008_extended_features.sql`
3. Enable **Email** auth under Authentication → Providers
4. Seed demo listings (from `server/`):

```powershell
cd server
$env:SUPABASE_INSECURE_SSL="1"   # Windows — only if seed fails with SSL errors
npm run seed
```

**Demo accounts** (after seed):

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@dormsafe.test` | `Admin123!` |
| Owner (per property) | `owner.ivory1104@dormsafe.test`, etc. | `Owner123!` |

Students are **not** seeded — register at `/register`, then have an admin approve the account under **Verify Accounts**.

Each seeded property has its own owner. `owner.cezar@dormsafe.test` stays pending until admin approval (demo pending-owner flow).

### 2. Environment variables

From the project root (first time only):

```powershell
copy client\.env.example client\.env
copy server\.env.example server\.env
```

Do **not** re-run `copy` if your `.env` files already have real keys — it overwrites them.

**Supabase** — Dashboard → **Project Settings** → **API**:

| Supabase value | Client (`client/.env`) | Server (`server/.env`) |
|----------------|------------------------|-------------------------|
| Project URL | `VITE_SUPABASE_URL` | `SUPABASE_URL` |
| anon public key | `VITE_SUPABASE_ANON_KEY` | — |
| service_role key | — | `SUPABASE_SERVICE_ROLE_KEY` |

**Google Maps** — enable in [Google Cloud Console](https://console.cloud.google.com/):

- Maps JavaScript API + Directions API (client)
- Distance Matrix API + Geocoding API (server)

Use **two keys** in production/dev when possible:

| Key | Restrictions | Variable |
|-----|--------------|----------|
| Browser | HTTP referrers: `http://localhost:5173/*` | `VITE_GOOGLE_MAPS_API_KEY` |
| Server | No referrer restriction | `GOOGLE_MAPS_API_KEY` |

`client/.env` example:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GOOGLE_MAPS_API_KEY=your-browser-maps-key
VITE_API_URL=http://localhost:5000
```

`server/.env` example:

```env
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GOOGLE_MAPS_API_KEY=your-server-maps-key
CORS_ORIGIN=http://localhost:5173
SUPABASE_INSECURE_SSL=1
```

Rules: no quotes around values, no spaces around `=`, never commit `.env` or put **service_role** in the client.

### 3. Install dependencies

```powershell
cd server
npm install

cd ..\client
npm install
```

### 4. Run the app

Two terminals:

```powershell
# Terminal 1 — API
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

- App: http://localhost:5173  
- API health: http://localhost:5000/api/auth/health  

Restart whichever process you changed `.env` for.

## App routes (quick reference)

| Role | Main pages |
|------|------------|
| Student | `/student/search`, `/student/saved`, `/student/my-stay`, `/student/property/:id` |
| Owner | `/owner/dashboard`, `/owner/listings`, `/owner/add-property`, `/owner/tenants`, `/owner/payments`, `/owner/analytics`, `/owner/verification` |
| Admin | `/admin/dashboard`, `/admin/verify-accounts`, `/admin/approve-listings`, `/admin/manage-users`, `/admin/manage-tenants`, `/admin/audit-log`, `/admin/moderate` |

Unverified students and owners land on their verification page until an admin approves the account.

## API overview

Base URL: `http://localhost:5000/api`

| Prefix | Purpose |
|--------|---------|
| `/auth` | Register, login, verification uploads |
| `/proximity` | Student search and property detail |
| `/properties` | Owner listings, dashboard stats, edit |
| `/tenants` | Owner tenant CRUD |
| `/payments` | Owner payment log |
| `/students` | Stays, reservations, favorites, reviews, maintenance |
| `/owners` | Analytics, occupancy, payment reminders |
| `/admin` | Verifications, listings, users, audit, bulk actions |
| `/notifications` | In-app notification bell |

All protected routes expect `Authorization: Bearer <access_token>`.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `relation "…" does not exist` | Run missing migrations (especially `006`–`008`) in Supabase SQL Editor |
| Geocode error on edit listing (`REQUEST_DENIED`) | Use a **server** Maps key without browser referrer restrictions; enable Geocoding API. Unchanged addresses save without re-geocoding |
| Walking times all identical | Check server logs; enable Distance Matrix on the **server** key |
| `fetch failed` / SSL on seed | Set `SUPABASE_INSECURE_SSL=1` in `server/.env` |
| Blank owner verification page | Fixed in current build — refresh; page must not depend on owner dashboard context |
| Payment reminders say **0 sent** | Add due payments in **Payment Log**, or wait 24h if already notified; active tenants without paid rent this month also get a generic reminder |
| Student cannot search | Admin must approve account under **Verify Accounts** |
| My Stay empty | Owner must add tenant with the **same email** the student registered with |

## Proposal constraints

- No online payment processing — manual owner payment log only
- No legal property ownership verification beyond admin review
- **2 km** search radius from Jacinto / Roxas campus gates
- Listings and accounts require admin approval before going live

## Development notes

- Seed script: `server/scripts/seedPlaces.js` (reads `Places/` folders)
- Image uploads: **50 KB – 5 MB** per file (listings and verification documents)
- Client production build: `cd client && npm run build`
