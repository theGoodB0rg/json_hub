-- 0002_events_journey_ids.sql
--
-- Adds visitor_id, session_id and row_count to events.
--
-- Why: with no visitor id, journeys were guessed from country + user agent.
-- Chrome's reduced UA makes most visitors in a country look identical, so a
-- "single" 144-export visitor in Nov 2026 was at least 16 browsers. Both ids
-- are random tokens generated in the browser (lib/analytics/client-id.ts,
-- lib/analytics/session.ts); the worker stores them only if they match
-- /^[A-Za-z0-9-]{8,64}$/. row_count lets the paywall report say what share
-- of a file the free sample covered.
--
-- Order matters: apply BEFORE deploying the telemetry worker that writes
-- these columns, or every insert batch fails.
--
-- Safe to re-run? No — SQLite has no ADD COLUMN IF NOT EXISTS; a second run
-- errors with "duplicate column name", which is harmless.
--
-- Apply with:
--   npx wrangler d1 execute jsonexport-db --remote \
--     --file worker/migrations/0002_events_journey_ids.sql

ALTER TABLE events ADD COLUMN visitor_id TEXT;
ALTER TABLE events ADD COLUMN session_id TEXT;
ALTER TABLE events ADD COLUMN row_count INTEGER;
CREATE INDEX IF NOT EXISTS idx_events_visitor ON events(visitor_id);
