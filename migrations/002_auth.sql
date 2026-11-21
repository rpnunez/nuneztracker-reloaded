ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member';
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY,
  notification_email TEXT NOT NULL DEFAULT ''
);

INSERT INTO app_settings (id, notification_email)
VALUES ('default', '')
ON CONFLICT (id) DO NOTHING;
