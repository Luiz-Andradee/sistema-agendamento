-- Migration: Initial schema for Estúdio Aline Andrade scheduling
-- Creates professionals, services, service_professionals, appointments and appointment_history tables

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS professionals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  bio TEXT,
  whatsapp TEXT,
  avatar_color TEXT,
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_professionals (
  service_id TEXT NOT NULL,
  professional_id TEXT NOT NULL,
  PRIMARY KEY (service_id, professional_id),
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  service_id TEXT NOT NULL,
  professional_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  notes TEXT,
  date TEXT NOT NULL, -- YYYY-MM-DD
  start_time TEXT NOT NULL, -- HH:MM
  end_time TEXT NOT NULL, -- HH:MM derived from service duration
  status TEXT NOT NULL DEFAULT 'pending',
  rebook_desired_date TEXT,
  rebook_desired_time TEXT,
  rebook_note TEXT,
  rebook_requested_at DATETIME,
  confirmed_at DATETIME,
  cancelled_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
  FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_appointments_professional_date ON appointments (professional_id, date, start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments (status);

CREATE TABLE IF NOT EXISTS appointment_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  appointment_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
);
