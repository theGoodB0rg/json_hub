-- Telemetry events table
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    event_name TEXT NOT NULL,
    platform TEXT,
    format TEXT,
    file_size_bytes INTEGER,
    duration_ms INTEGER,
    error_type TEXT,
    error_message TEXT,
    country TEXT,
    referrer TEXT,
    path TEXT,
    user_agent TEXT,
    timestamp INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_name ON events(event_name);
CREATE INDEX IF NOT EXISTS idx_events_platform ON events(platform);

-- User output satisfaction feedback table
CREATE TABLE IF NOT EXISTS user_feedback (
    id TEXT PRIMARY KEY,
    rating TEXT NOT NULL, -- 'positive' | 'negative'
    comment TEXT,
    platform TEXT,
    format TEXT,
    path TEXT,
    timestamp INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_feedback_timestamp ON user_feedback(timestamp);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON user_feedback(rating);
