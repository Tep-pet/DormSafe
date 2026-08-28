# DormSafe

A Real-Time Student Housing Management System for Ateneo Students.

**Capstone 2 Project** — Aguirre, Pacatang, Palima  
Ateneo de Davao University · SY 2025–2026

## Tech Stack

- **Frontend:** React.js, Tailwind CSS, Vite
- **Backend:** Node.js, Express.js
- **Database:** Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Maps:** Google Maps API

## Project Structure

```
DormSafe/
├── client/                 # Presentation Layer (React + Tailwind)
├── server/                 # Logic Layer (Node.js + Express)
├── supabase/               # Data Layer (migrations, seed)
├── docs/
├── .gitignore
└── README.md
```

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run migrations in order via **SQL Editor**:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/004_fix_signup_trigger.sql`
   - `supabase/migrations/005_contact_and_receipts.sql` (contact info + payment receipts)
3. Enable **Email** auth under Authentication → Providers
4. Seed demo data from `server/`: `npm run seed` (requires `SUPABASE_INSECURE_SSL=1` on some networks)

**Demo accounts** (after seed):

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@dormsafe.test` | `Admin123!` |
| Owner (per property) | `owner.ivory1104@dormsafe.test`, etc. | `Owner123!` |

Each property has its own owner account. Cezar Verbata remains pending until admin approves.

### 2. Environment variables

#### Create the `.env` files (first time only)

Open **VS Code** → **Terminal → New Terminal**, then run these from the **project root** (`DormSafe`):

```powershell
cd path\to\DormSafe

copy client\.env.example client\.env
copy server\.env.example server\.env
```

> **Do not run `copy` again** if `client/.env` or `server/.env` already exist and have your keys — it will overwrite them with blanks.

If a file already exists, open it in VS Code and edit it directly instead.

#### Get your keys

**Supabase** — [supabase.com/dashboard](https://supabase.com/dashboard) → your project → **Project Settings** (gear) → **API**:

| Copy from Supabase | Paste into |
|--------------------|------------|
| **Project URL** | `VITE_SUPABASE_URL` in `client/.env` |
| **Project URL** | `SUPABASE_URL` in `server/.env` |
| **anon public** key | `VITE_SUPABASE_ANON_KEY` in `client/.env` |
| **service_role** key | `SUPABASE_SERVICE_ROLE_KEY` in `server/.env` |

> `VITE_` is **not** a Supabase label — it is a Vite naming rule for browser env vars. You rename values when pasting them into `client/.env`.

**Google Maps** — [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → enable:

- **Maps JavaScript API** (client map)
- **Directions API** (walking route on property detail page)
- **Distance Matrix API** (server walking times)
- **Geocoding API** (owner add-property address lookup)

Use **two API keys** (recommended) so server-side calls are not blocked by browser referrer restrictions:

| Key | Restrictions | Env var |
|-----|--------------|---------|
| Browser key | HTTP referrers: `http://localhost:5173/*`, your production domain | `VITE_GOOGLE_MAPS_API_KEY` in `client/.env` |
| Server key | No referrer restriction (IP restrict in production if needed) | `GOOGLE_MAPS_API_KEY` in `server/.env` |

For local dev you may use one unrestricted key in both files. If walking times look like estimates only, check the server logs for `REQUEST_DENIED` and verify Distance Matrix is enabled on the **server** key.

#### Example files (use your own values)

`client/.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key
VITE_API_URL=http://localhost:5000
```

`server/.env`:

```env
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GOOGLE_MAPS_API_KEY=your-google-maps-key
CORS_ORIGIN=http://localhost:5173
```

Rules:

- No quotes around values
- No spaces around `=`
- Never put **service_role** in `client/.env` or commit `.env` to Git

### 3. Install dependencies (first time only)

From the project root, in **two separate terminals** (or one after the other):

```powershell
cd path\to\DormSafe\server
npm install

cd path\to\DormSafe\client
npm install
```

### 4. Run the app (every time)

You need **two terminals** running at the same time.

**Terminal 1 — API server:**

```powershell
cd path\to\DormSafe\server
npm run dev
```

Expected output: `DormSafe server running on http://localhost:5000`

**Terminal 2 — Frontend (Vite):**

```powershell
cd path\to\DormSafe\client
npm run dev
```

Expected output: `Local: http://localhost:5173/`

Open the URL Vite prints in your browser (usually http://localhost:5173).

- API health check: http://localhost:5000/api/auth/health

#### VS Code tips

- **File → Open Folder** → select the `DormSafe` folder
- **Terminal → Split Terminal** to show server and client side by side
- Stop a server with **Ctrl+C** in its terminal
- After changing any `.env` file, stop and restart that server

#### Troubleshooting

| Problem | Fix |
|---------|-----|
| `Cannot find path ...\server\server\.env.example` | You are already inside `server/`. Use `copy .env.example .env` or `cd ..` back to the project root first. |
| `missing env vars: SUPABASE_URL` | `server/.env` is empty. Fill in keys — do not re-run `copy .env.example .env` if you already had values. |
| `EADDRINUSE :::5000` | Port 5000 is already in use. Stop the old server (**Ctrl+C**) or close the other terminal running it. |
| Vite uses port **5174** instead of **5173** | Another Vite process is still running. Open the URL Vite prints, or stop the old process. |
| Login or maps do not work | Check `client/.env` has **anon** key (not service_role) and restart `npm run dev`. |

## Sprint 1 Features (implemented)

- [x] Project scaffold (client + server)
- [x] Supabase schema + RLS policies
- [x] Auth (register/login, 3 roles)
- [x] Proximity Algorithm (2 km radius, walking distance)
- [x] Student search page with Google Maps
- [x] Property detail page (rooms, rules, availability badges)

## API Endpoints

| Method | Route | Role | Description |
|--------|-------|------|-------------|
| GET | `/api/auth/health` | Public | Health check |
| GET | `/api/auth/me` | Auth | Current profile |
| GET | `/api/proximity/search` | Student | Search within 2 km |
| GET | `/api/proximity/properties/:id` | Student | Property detail |

## Sprints (Agile-Scrum)

| Sprint | Focus | Status |
|--------|-------|--------|
| Sprint 1 | GPS Mapping + Proximity + Auth | ✅ In progress |
| Sprint 2 | Owner Dashboard + Digital Ledger + Admin | Planned |
| Sprint 3 | UI/UX Optimization + Evaluation Prep | Planned |

## Proposal Constraints

- No online payment processing (manual logs only)
- No legal property ownership verification
- 2 km radius from Jacinto / Roxas campus gates
- Manual admin verification before listings go live
