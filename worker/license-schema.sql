-- license-schema.sql
-- D1 table for jsonexport-license worker (M3 in MONETIZATION_ROADMAP).
--
-- Each row is one (license, device) activation pair. A single license
-- key can have up to MAX_USES rows that haven't been revoked. The
-- composite PRIMARY KEY makes idempotent re-activation trivial.

CREATE TABLE IF NOT EXISTS license_activations (
    license_key TEXT NOT NULL,
    device_id   TEXT NOT NULL,
    activated_at INTEGER NOT NULL,            -- epoch ms
    revoked_at   INTEGER,                     -- epoch ms, NULL = active
    country     TEXT,
    user_agent  TEXT,
    email       TEXT,                         -- for admin lookups + refund tracking
    PRIMARY KEY (license_key, device_id)
);

-- Fast counts for the max-uses check in handleActivate.
CREATE INDEX IF NOT EXISTS idx_license_active ON license_activations (license_key)
    WHERE revoked_at IS NULL;

-- Audit by email (useful when a buyer emails support).
CREATE INDEX IF NOT EXISTS idx_license_email ON license_activations (email)
    WHERE email IS NOT NULL;
