# Architecture & Data Documentation

## Data Model

### Core Entity: `crypto_events`

| Column      | Type         | Constraints                                                 | Index           |
| ----------- | ------------ | ----------------------------------------------------------- | --------------- |
| id          | VARCHAR(50)  | Primary Key                                                 | -               |
| asset_id    | VARCHAR(100) | NOT NULL                                                    | -               |
| asset_type  | VARCHAR(50)  | NOT NULL                                                    | idx_asset_type  |
| algorithm   | VARCHAR(50)  | NOT NULL                                                    | idx_algorithm   |
| severity    | VARCHAR      | NOT NULL (enum: info/warning/critical)                      | idx_severity    |
| source_ip   | VARCHAR(45)  | NOT NULL                                                    | idx_source_ip   |
| observed_at | TIMESTAMPTZ  | NOT NULL                                                    | idx_observed_at |
| event_type  | VARCHAR      | NOT NULL (enum: observed/rotation/expiration-warning/error) | idx_event_type  |
| created_at  | TIMESTAMPTZ  | NOT NULL, DEFAULT now()                                     | -               |

`severity` and `event_type` are encoded as Drizzle `varchar({ enum: [...] })` — Postgres stores them as plain VARCHAR but the type system enforces the literal union at the application boundary. `source_ip` is sized for IPv6.

### Indexing Strategy

All queryable columns are indexed individually:

- `idx_algorithm` – filtering / grouping by crypto algorithm
- `idx_severity` – severity breakdowns + dashboard filters
- `idx_asset_type` – inventory queries
- `idx_observed_at` – date range filtering (every aggregation uses this)
- `idx_source_ip` – top-IP aggregation
- `idx_event_type` – event type filtering

For the current dataset size single-column B-trees are sufficient. The next index to add as volume grows is a compound `(observed_at, severity)` — most dashboard queries scope by date first and then aggregate by severity, so this lets Postgres index-only-scan the hot path.

## Aggregation Approach

All aggregations are pushed to Postgres (no in-process grouping) and centralize their WHERE clauses in `buildCommonConditions()` (from / to / algorithm / severity / search). Heavy use is made of `FILTER (WHERE …)` so each endpoint produces severity-broken-down results in one pass.

### Events Per Day

```sql
SELECT observed_at::date AS date, COUNT(*)::int AS count
FROM crypto_events
WHERE <filters>
GROUP BY observed_at::date
ORDER BY observed_at::date
```

### By Algorithm with Severity Breakdown

```sql
SELECT algorithm, severity, COUNT(*)::int AS count
FROM crypto_events
WHERE <filters>
GROUP BY algorithm, severity
ORDER BY count DESC
```

### Events Over Time (severity split, single pass)

```sql
SELECT observed_at::date AS date,
       COUNT(*) FILTER (WHERE severity = 'info')::int     AS info,
       COUNT(*) FILTER (WHERE severity = 'warning')::int  AS warning,
       COUNT(*) FILTER (WHERE severity = 'critical')::int AS critical,
       COUNT(*)::int                                       AS total
FROM crypto_events
WHERE <filters>
GROUP BY observed_at::date
ORDER BY observed_at::date
```

### Top Source IPs (with severity + top-algorithm breakdown)

Two queries kept in the route handler:

```sql
-- 1. Top N IPs with severity counters
SELECT source_ip,
       COUNT(*)::int                                              AS total,
       COUNT(*) FILTER (WHERE severity = 'critical')::int         AS critical,
       COUNT(*) FILTER (WHERE severity = 'warning')::int          AS warning,
       COUNT(*) FILTER (WHERE severity = 'info')::int             AS info
FROM crypto_events
WHERE <filters>
GROUP BY source_ip
ORDER BY total DESC
LIMIT $1;

-- 2. For just those IPs, count events per algorithm
SELECT source_ip, algorithm, COUNT(*)::int AS count
FROM crypto_events
WHERE source_ip IN ($top_ip_list) AND <filters>
GROUP BY source_ip, algorithm
ORDER BY count DESC;
```

Results are joined in JS, then each IP keeps its top 5 algorithms. This is what the frontend `/ips` page consumes.

## Scalability Considerations

**Current (a few thousand seeded events)**: a single Postgres connection pool (`postgres({ max: 10 })`) is more than enough. Every aggregation completes in a single index range scan + grouping.

**Growth path**:

1. **100k events**: add the `(observed_at, severity)` compound index. Add a generated `observed_at_date` column with an index if `::date` casting starts dominating query plans.
2. **10M events**: range-partition `crypto_events` by `observed_at` (monthly partitions). Materialized views for the heaviest dashboard aggregations refreshed on a schedule.
3. **100M+ events**: dedicated OLAP store. ClickHouse or TimescaleDB hypertables for time-bucketed aggregations; the OLTP Postgres keeps recent / unaggregated data only.

**Streaming (production)**:

- Kafka / Event Hubs for ingestion, with idempotent writers keyed on event `id`.
- A consumer that performs micro-batch inserts (`COPY` or multi-row INSERT) into Postgres.
- ClickHouse / Materialize for low-latency dashboards.
- Redis (or just Postgres advisory locks + a counters table) for short-lived real-time tallies.

## Security Considerations

- **Input validation**: every Hono route is wrapped with `zValidator('query', schema)` from `@hono/zod-validator`; unknown / malformed parameters are rejected before they touch the DB.
- **SQL injection**: all queries go through Drizzle's parameterized query builder — no string concatenation in the codebase.
- **CORS**: `cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:3000', allowMethods: ['GET', 'OPTIONS'] })`. No wildcard, no other verbs allowed.
- **Error handling**: a global `app.onError` maps `HTTPException` to a JSON error body and logs unknown errors without leaking stack traces to the client.
- **Secrets**: `DATABASE_URL` is required at boot — the backend throws if it's missing, preventing accidental boot against a default DSN. `.env` files are git-ignored.
- **No auth in this MVP**: production deployment would add a JWT or session middleware on `app.use('*', …)` before the routers, plus a `tenant_id` claim threaded into every query (see below).

## Multi-Tenancy Strategy

Current implementation is single-tenant. For multi-tenant SaaS, in increasing order of isolation:

1. **Row-level tenant column**: add `tenant_id VARCHAR NOT NULL` with a compound index on `(tenant_id, observed_at)`. Enforce via Postgres `ROW LEVEL SECURITY` policies bound to a session variable set on each connection. Cheapest, easiest to reason about, fine up to mid-size customers.
2. **Schema-per-tenant**: separate Postgres schemas, one connection pool per tenant or a connection-time `SET search_path`. Helps with noisy-neighbour but multiplies migrations.
3. **Database-per-tenant**: real isolation, required for regulated tenants. Run via a control plane that provisions Neon branches / dedicated databases on signup.

The application code stays clean if `tenant_id` is the first argument of every query builder helper.

## Performance Optimizations

1. **Single-pass severity aggregations** via `FILTER (WHERE …)` — avoids 3 round-trips.
2. **Centralized filter builder** (`buildCommonConditions`) so every endpoint shares the same WHERE shape — easy to add an index and have every endpoint benefit.
3. **TanStack Query caching**: 30s `staleTime`, `retry: 1` in `apps/frontend/src/app/providers.tsx`. The filter dropdown (`/stats/algorithms`) uses a 5-minute stale time because it's nearly static.
4. **Lightweight aggregation responses**: stats endpoints return only the columns the chart needs — no full entity hydration.
5. **Connection pooling**: `postgres({ max: 10 })` configured once in `db/index.ts`.
6. **Pagination**: `/events` enforces `limit` ≤ 5000 via Zod so clients can't request unbounded result sets.

## With 2 Extra Days

1. **Docker Compose** with Postgres + backend + frontend, hot reload for both apps.
2. **Vitest aggregation tests** seeded against a throwaway Postgres schema, covering filter combinations and the multi-query top-source-ips path.
3. **GitHub Actions CI**: install → lint → build → test on every PR; Turbo remote cache hooked to GHA cache.
4. **Server-driven IP page**: add a `sourceIp` filter to `/events` and stop the client from ever fetching 5000 rows.
5. **Real-time updates** via Server-Sent Events from a `LISTEN/NOTIFY` channel emitted by an `AFTER INSERT` trigger.
6. **Export to CSV / NDJSON** on the events table, streamed from the backend so it scales to large filtered exports.
7. **Materialized view for `events-per-day`** + a small scheduler to refresh it, so the dashboard chart is independent of dataset size.
