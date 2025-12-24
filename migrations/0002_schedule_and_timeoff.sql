-- Migration 0002: personalized professional schedules and time-off blocks

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS professional_availability (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  professional_id TEXT NOT NULL,
  weekday INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  slot_interval INTEGER NOT NULL DEFAULT 30,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (professional_id, weekday, start_time, end_time),
  FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_availability_professional_weekday ON professional_availability (professional_id, weekday);

CREATE TABLE IF NOT EXISTS professional_time_off (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  professional_id TEXT NOT NULL,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_time_off_professional_date ON professional_time_off (professional_id, date);
