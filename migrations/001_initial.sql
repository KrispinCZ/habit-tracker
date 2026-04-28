-- Habit Tracker — initial schema
-- Spusť v Supabase SQL Editoru (DEV projekt)

-- Enum types
CREATE TYPE habit_frequency AS ENUM ('daily', 'weekly', 'monthly');
CREATE TYPE habit_status AS ENUM ('done', 'missed');

-- Habits
CREATE TABLE habits (
  id          integer generated always as identity primary key,
  user_id     uuid references auth.users(id),
  title       text not null,
  frequency   habit_frequency not null,
  target_day  integer,
  share_token text unique not null default gen_random_uuid()::text,
  deleted_at  timestamptz,
  created_at  timestamptz not null default now()
);

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "habits_allow_all" ON habits FOR ALL USING (true) WITH CHECK (true);

-- Habit logs
CREATE TABLE habit_logs (
  id         integer generated always as identity primary key,
  habit_id   integer not null references habits(id) on delete cascade,
  log_date   date not null,
  status     habit_status not null,
  created_at timestamptz not null default now(),
  UNIQUE (habit_id, log_date)
);

ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "habit_logs_allow_all" ON habit_logs FOR ALL USING (true) WITH CHECK (true);
