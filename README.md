# CryptoNext – Crypto Events Analytics Dashboard

Technical challenge for Senior Full-Stack Engineer position: a Turborepo + pnpm monorepo with a Hono/Node.js backend, Next.js 16 frontend, Drizzle ORM, and PostgreSQL (Neon).

## Project layout

The challenge brief asks for `/backend` and `/frontend` directories. In this repo they live under `apps/` (standard Turborepo convention), with two shared workspace packages:

```
cryptonext/
├── apps/
│   ├── backend/     # Hono API + Drizzle ORM + PostgreSQL → /backend
│   └── frontend/    # Next.js 16 App Router + Recharts   → /frontend
├── packages/
│   ├── shared/      # @cryptonext/shared – wire-format types
│   └── ui/          # @cryptonext/ui – Shadcn primitives + globals.css
├── ARCHITECTURE_DATA.md
└── README.md
```

## Quick Start

### Option A — Docker Compose (one command)

```bash
docker compose up --build
```

This boots three containers:

- `postgres` (Postgres 16, persisted in the `pgdata` volume, exposed on `5432`)
- `backend` (Hono API, runs migrations on boot, then seeds if `SEED_ON_BOOT=true` — default in `docker-compose.yml`)
- `frontend` (Next.js production server)

Once the build settles:

- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Postgres: `postgres://cryptonext:cryptonext@localhost:5432/cryptonext`

To skip the destructive seed on subsequent boots:

```bash
SEED_ON_BOOT=false docker compose up
```

#### Dev mode (hot reload)

`docker-compose.dev.yml` overrides the prod build with bind mounts + dev servers (`tsx watch` for backend, `next dev --turbopack` for frontend). Source edits on the host trigger a reload inside the container.

```bash
make dev-build      # first run, builds images
make dev            # subsequent runs
make down           # stop + remove containers (keeps volume)
make clean          # nuke containers + volumes
make logs           # tail
```

Or the raw command if you prefer:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Notes:
- `node_modules` are kept inside the container via anonymous volumes — never mounted from the host (architecture mismatch).
- If you add or change a workspace dependency in `package.json`, rebuild the image: `make dev-build` (or `... up --build`).
- `WATCHPACK_POLLING=true` is set for Next.js so file watching works on Docker Desktop bind mounts.
- `make down` works around a podman-compose teardown bug where `depends_on` ordering leaves orphaned containers; on real Docker `docker compose down` works fine.

### Option B — Local pnpm

```bash
# 1. Install dependencies
pnpm install

# 2. Configure the database
# apps/backend/.env must define DATABASE_URL (Postgres connection string).
# Optional: PORT (default 3001), FRONTEND_URL (CORS allow-list, default http://localhost:3000)

# 3. Run migrations & seed the database
pnpm db:seed

# 4. Start both apps
pnpm dev
```

- Backend: http://localhost:3001
- Frontend: http://localhost:3000

## API Endpoints

| Method | Endpoint                  | Description                                                                  |
| ------ | ------------------------- | ---------------------------------------------------------------------------- |
| GET    | `/events`                 | List events with filters (assetType, algorithm, severity, date range) + page |
| GET    | `/stats/events-per-day`   | Daily event counts (filters: from, to, algorithm, severity, search)          |
| GET    | `/stats/events-over-time` | Daily counts split by severity (info/warning/critical/total)                 |
| GET    | `/stats/by-algorithm`     | Event counts grouped by algorithm & severity                                 |
| GET    | `/stats/algorithms`       | Distinct algorithm names (used to populate filter dropdowns)                 |
| GET    | `/stats/inventory-keys`   | Complex query: assetType + severity + year + algorithm list                  |
| GET    | `/stats/top-source-ips`   | Top N source IPs by event count, with severity + top-algorithm breakdown     |
| GET    | `/stats/summary`          | Totals + critical/warning counts + unique source IPs                         |
| GET    | `/health`                 | Liveness probe                                                               |

Every endpoint returns `{ data: ... }`; `/events` additionally returns `pagination`.

## Scripts

```bash
pnpm dev          # Start backend + frontend
pnpm build        # Build all apps
pnpm lint         # Type-check + ESLint
pnpm format       # Prettier write
pnpm db:seed      # Reset & seed the database (from apps/backend)
pnpm test         # Backend aggregation tests (needs TEST_DATABASE_URL)
```

## Testing

Backend aggregation endpoints have integration tests under `apps/backend/src/__tests__/`. They run against a throwaway Postgres database — never the dev database — and require `TEST_DATABASE_URL`.

```bash
# 1. Make sure Postgres is running (docker-compose does this automatically and
#    auto-creates a `cryptonext_test` database via init-test-db.sql).
make dev   # or: docker compose up -d postgres

# 2. Run the tests
make test                                       # convenience wrapper
# or
TEST_DATABASE_URL=postgres://cryptonext:cryptonext@localhost:5432/cryptonext_test \
  pnpm --filter backend test
```

The setup file (`src/__tests__/setup.ts`) runs migrations once, then truncates + reseeds a deterministic fixture (`fixtures.ts`) before each test. Tests assert exact counts, severity breakdowns, sort order, and filter behavior on every `/stats/*` endpoint plus `/events`.

Backend-only (from `apps/backend/`):

```bash
pnpm db:generate  # Emit a Drizzle SQL migration from schema.ts
pnpm db:migrate   # Apply migrations
pnpm db:studio    # Drizzle Studio
```

## Tech Stack

| Layer      | Technology                              | Version |
| ---------- | --------------------------------------- | ------- |
| Monorepo   | Turborepo + pnpm                        | 2.9.9   |
| Backend    | Hono + Node.js                          | 4.12.18 |
| ORM        | Drizzle ORM (postgres-js driver)        | 0.45.2  |
| Database   | PostgreSQL (Neon-compatible)            | 16+     |
| Frontend   | Next.js App Router (Turbopack)          | 16.2    |
| Styling    | TailwindCSS v4                          | 4.2.4   |
| Charts     | Recharts                                | 3.8.1   |
| Tables     | TanStack Table                          | 8.21    |
| Data fetch | TanStack Query                          | 5.100   |
| Validation | Zod via `@hono/zod-validator`           | 4.4.3   |

## Why These Choices?

**Backend**: Hono is TypeScript-first, extremely lightweight, and provides a familiar Express-like API with first-class middleware. Drizzle is SQL-first and type-safe — the actual query stays visible while remaining safe from injection via parameterized queries.

**Database**: PostgreSQL gives us `FILTER (WHERE ...)` clauses, `GROUP BY` with multiple keys, window functions, and a roadmap to TimescaleDB / partitioning when volume grows. The `postgres` driver runs without a build step and is Neon-friendly.

**Frontend**: Next.js 16 App Router with Turbopack for fast dev rebuilds. TanStack Query handles caching + loading + error states uniformly across every panel. Recharts is rendered through a shared `chartTheme` so all charts share palette + axes + tooltips.

**Monorepo**: Turborepo gives task orchestration + per-package caching. `@cryptonext/shared` is the canonical wire-format contract — change a type there and both apps see it immediately because packages ship raw source.
