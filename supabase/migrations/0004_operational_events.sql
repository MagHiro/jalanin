-- Lightweight persistent analytics and instance-independent abuse throttling.
-- No raw IP addresses or applicant data are persisted here.
CREATE TABLE analytics_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_type VARCHAR(60) NOT NULL
    CHECK (event_type IN ('page_view','internship_view','apply_clicked',
      'application_draft_saved','application_submitted','contact_submitted')),
  page_path VARCHAR(320),
  internship_slug VARCHAR(160),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX analytics_events_type_created_idx ON analytics_events (event_type, created_at);
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
-- No anon/authenticated policies: writes go via the validated server intake.

CREATE TABLE request_rate_limits (
  bucket_hash CHAR(64) PRIMARY KEY,
  request_count INTEGER NOT NULL DEFAULT 1 CHECK (request_count >= 0),
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX request_rate_limits_expires_idx ON request_rate_limits (expires_at);
ALTER TABLE request_rate_limits ENABLE ROW LEVEL SECURITY;
-- No client access; only server-owned throttling queries.
