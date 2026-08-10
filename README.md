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
3. Enable **Email** auth under Authentication → Providers
4. (Optional) Create admin user in Auth dashboard, then:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'your-admin@email.com';
   ```

### 2. Environment variables

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

Fill in:

| Variable | Where |
|----------|--------|
| `VITE_SUPABASE_URL` | client/.env |
| `VITE_SUPABASE_ANON_KEY` | client/.env |
| `VITE_GOOGLE_MAPS_API_KEY` | client/.env |
| `VITE_API_URL` | client/.env (`http://localhost:5000`) |
| `SUPABASE_URL` | server/.env |
| `SUPABASE_SERVICE_ROLE_KEY` | server/.env (keep secret) |
| `GOOGLE_MAPS_API_KEY` | server/.env (Distance Matrix API) |

### 3. Install & run

```bash
# Terminal 1 — API
cd server
npm install
npm run dev

# Terminal 2 — Frontend
cd client
npm install
npm run dev
```

- Frontend: http://localhost:5173  
- API health: http://localhost:5000/api/auth/health

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
