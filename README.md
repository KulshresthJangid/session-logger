# Session Logger

Production-ready session tracking and billing app. Replace manual logs with one-click start/stop sessions, auto-computed billing, and monthly reports.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL 16 |
| ORM | Prisma |
| Auth | JWT (Bearer token) |
| UI | Tailwind CSS (dark mode) |
| State | Zustand + React Query |

---

## Prerequisites

- [Docker + Docker Compose](https://docs.docker.com/get-docker/)
- [Node.js 20+](https://nodejs.org/)
- npm 9+

---

## Setup (Step by Step)

### 1. Clone & enter the project

```bash
git clone <your-repo-url>
cd session-logger
```

### 2. Start the database

```bash
docker-compose up -d
```

Postgres is now running on `localhost:5432`.  
pgAdmin is available at `http://localhost:5050` (admin@admin.com / admin).

### 3. Configure backend environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` if you changed DB credentials in `docker-compose.yml`. Defaults work as-is.

### 4. Install backend dependencies

```bash
npm install
```

### 5. Run database migrations

```bash
npm run db:migrate
```

When prompted for a migration name, enter anything (e.g., `init`).

### 6. Seed sample data

```bash
npm run db:seed
```

Creates:
- User: `admin@example.com` / `password123`
- 3 sample clients (hourly + fixed billing)
- 4 sample sessions from the current month

### 7. Start the backend

```bash
npm run dev
```

API running at `http://localhost:3001`.

### 8. Configure frontend environment

```bash
cd ../frontend
```

No `.env` needed — Vite proxies `/api` to `localhost:3001` automatically.

### 9. Install frontend dependencies

```bash
npm install
```

### 10. Start the frontend

```bash
npm run dev
```

App running at `http://localhost:5173`.

---

## Usage

1. Open `http://localhost:5173`
2. Log in with `admin@example.com` / `password123`
3. **Dashboard** — see all clients with one-click Start Session buttons
4. Click **Start Session** on any client → live timer begins
5. Click **End** → optional notes modal → session saved with cost auto-computed
6. **Sessions** page — full log with filters
7. **Reports** page — monthly summaries with CSV export
8. Floating panel (bottom-right) shows all active sessions at all times

---

## Keyboard Shortcut (Planned)

| Key | Action |
|---|---|
| `S` | Start session (focused client) |
| `E` | End active session |

---

## API Reference

### Auth
```
POST /api/auth/register   { name, email, password }
POST /api/auth/login      { email, password }
GET  /api/auth/me
```

### Clients
```
GET    /api/clients
POST   /api/clients
GET    /api/clients/:id
PUT    /api/clients/:id
DELETE /api/clients/:id
```

### Sessions
```
POST   /api/sessions/start          { clientId }
POST   /api/sessions/end            { sessionId, notes? }
GET    /api/sessions/active
GET    /api/sessions                ?clientId&startDate&endDate&status&page&limit
PATCH  /api/sessions/:id/abandon
```

### Reports
```
GET /api/reports/dashboard
GET /api/reports/monthly    ?month=YYYY-MM&clientId=
GET /api/reports/export     ?month=YYYY-MM&clientId=   (returns CSV)
```

---

## Billing Logic

- **HOURLY**: `cost = (durationSeconds / 3600) × hourlyRate`
- **FIXED**: `cost = fixedRate` (flat per session, regardless of duration)

The rate is **snapshotted at session start** — changing a client's rate won't alter historical sessions.

---

## Project Structure

```
session-logger/
├── docker-compose.yml
├── postman-collection.json
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        ← data model
│   │   └── seed.ts              ← sample data
│   └── src/
│       ├── config/              ← env, database
│       ├── middleware/          ← auth, validation, error
│       ├── modules/
│       │   ├── auth/
│       │   ├── clients/
│       │   ├── sessions/
│       │   └── reports/
│       └── utils/               ← billing, date helpers
│
└── frontend/
    └── src/
        ├── api/                 ← typed API layer
        ├── components/          ← UI components, layout
        ├── hooks/               ← useTimer, useSessionActions
        ├── pages/               ← Dashboard, Clients, Sessions, Reports
        ├── store/               ← Zustand auth + sessions store
        └── types/               ← shared TypeScript types
```

---

## Sample Credentials

| Field | Value |
|---|---|
| Email | admin@example.com |
| Password | password123 |
