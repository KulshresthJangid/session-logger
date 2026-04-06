# Session Logger — Portfolio Write-up

## One-liner
A full-stack freelance session tracker that replaces spreadsheets and stopwatches with one-click time tracking, automatic billing calculation, and exportable monthly reports.

---

## The Problem It Solves
Freelancers and consultants who bill clients hourly (or per project) typically juggle a mix of a stopwatch, a notes app, and a spreadsheet to record when they started, when they stopped, what the rate was, and how much to invoice. This is error-prone, slow, and produces no usable history. Session Logger replaces that entire workflow with a single web app that runs on your own infrastructure.

---

## Who It's For
- Freelance developers, designers, and consultants who bill clients by the hour or by fixed retainer
- Small agencies tracking billable time across multiple clients
- Anyone who wants a self-hosted, private, zero-subscription alternative to Toggl, Harvest, or Clockify

---

## Live Access
**URL:** https://buildwithkulshresth.com/session-logger

**Demo credentials** (read-only sandbox, data resets periodically):
- Email: `admin@example.com`
- Password: `password123`

---

## Feature Overview

### Dashboard
- Real-time stat cards: total clients, sessions this month, revenue this month, currently active sessions
- Client grid showing every client with their billing type (hourly / fixed) and either a "Start Session" button or a live running timer if a session is already active
- Active session count auto-refreshes every 10 seconds without a page reload

### Client Management
- Full CRUD: create, edit, soft-delete clients
- Per-client configuration: hourly rate, fixed rate, optional monthly budget, tags, notes
- Billing type (HOURLY / FIXED) is snapshotted at session start so rate changes never retroactively alter past invoices

### Session Tracking
- One-click start — immediately records the client, billing snapshot, and start timestamp
- Concurrent session guard: the API returns 409 if you accidentally try to start a second session for the same client
- Live elapsed timer (HH:MM:SS) on the dashboard card, initialised from the real start time on every page load so a browser refresh never resets the clock
- One-click end with an optional notes field; duration and cost are computed server-side on close
- Session status: ACTIVE → COMPLETED or ABANDONED

### Reports
- Monthly billing breakdown: filter by month (up to 12 months back) and optionally by client
- Per-client summary: total sessions, total hours, total revenue
- Grand total row across all clients for the selected month
- CSV export for dropping straight into an invoice template or accountancy tool

### Sessions History
- Filterable log of all sessions — by client, by status (ACTIVE / COMPLETED / ABANDONED), by date range
- Shows duration, cost, notes, and status badge for each session

### Auth
- Secure registration and login (bcrypt + JWT)
- JWT stored in localStorage, attached to every API request automatically
- 401 responses clear the token and redirect to login without any manual handling needed

---

## Tech Stack

| Layer       | Technology                                      |
|-------------|-------------------------------------------------|
| Frontend    | React 18 + TypeScript, Vite 5                   |
| Styling     | Tailwind CSS — dark-only, custom design tokens  |
| State       | React Query v5 (server state) + Zustand (auth)  |
| HTTP client | Axios with JWT interceptor                      |
| Backend     | Node.js + Express + TypeScript                  |
| Validation  | Zod (schema-first, on both request body + query)|
| ORM         | Prisma v5 + PostgreSQL 16                       |
| Auth        | JWT (jsonwebtoken) + bcryptjs                   |
| Infra       | Docker Compose (Postgres), nohup process, nginx |

---

## Architecture Decisions Worth Noting

**Billing snapshot** — When a session starts, the client's current hourly/fixed rate is copied into the session row. This means you can update a client's rate at any time without corrupting historical invoice data. A common mistake in naive implementations.

**React Query as single source of truth** — An early version used Zustand to mirror active-session data from the API. This caused an infinite re-render loop (new array reference on every render → Zustand subscriber triggered during React commit phase → `Maximum update depth exceeded`). The fix was to remove Zustand from that data path entirely and let React Query be the sole cache. Now the dashboard computes `activeSessionMap` via `useMemo` from the query result, eliminating all synchronisation complexity.

**Lazy timer initialisation** — `useTimer` initialises elapsed seconds directly in the `useState` lazy initialiser (`() => Math.floor((Date.now() - startTime) / 1000)`), not in a `useEffect`. This means on every page load — including hard reloads — the timer shows the correct elapsed time immediately with no "00:00:00" flash.

**Self-hosted, zero external dependencies** — The entire stack runs on a single VPS. No third-party billing APIs, no SaaS databases, no usage-based pricing. `./start.sh` builds both the frontend and backend, runs migrations, and starts the server in one command.

---

## Repository
https://github.com/KulshresthJangid/session-logger
