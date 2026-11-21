CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password_hash TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  onboarded BOOLEAN DEFAULT FALSE,
  check_in_hours JSONB DEFAULT '["09:00","13:00","19:00"]',
  due_reminders BOOLEAN DEFAULT TRUE,
  last_checkin_at TIMESTAMPTZ,
  points INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  last_streak_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS object_types (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'box',
  description TEXT DEFAULT '',
  builtin BOOLEAN DEFAULT FALSE,
  archived BOOLEAN DEFAULT FALSE,
  statuses JSONB NOT NULL DEFAULT '[]',
  UNIQUE (user_id, slug)
);

CREATE TABLE IF NOT EXISTS object_fields (
  id TEXT PRIMARY KEY,
  object_type_id TEXT NOT NULL REFERENCES object_types(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  type TEXT NOT NULL,
  options JSONB,
  required BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  builtin BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  object_type_id TEXT NOT NULL REFERENCES object_types(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL,
  folder TEXT DEFAULT '',
  due_at TIMESTAMPTZ,
  field_values JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS labels (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#c45c26'
);

CREATE TABLE IF NOT EXISTS record_labels (
  record_id TEXT NOT NULL REFERENCES records(id) ON DELETE CASCADE,
  label_id TEXT NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (record_id, label_id)
);

CREATE TABLE IF NOT EXISTS record_links (
  from_id TEXT NOT NULL REFERENCES records(id) ON DELETE CASCADE,
  to_id TEXT NOT NULL REFERENCES records(id) ON DELETE CASCADE,
  PRIMARY KEY (from_id, to_id)
);

CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY,
  record_id TEXT NOT NULL REFERENCES records(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  mime TEXT NOT NULL,
  bytes BYTEA NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  UNIQUE (user_id, endpoint)
);

CREATE TABLE IF NOT EXISTS score_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  points INTEGER NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_badges (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);
