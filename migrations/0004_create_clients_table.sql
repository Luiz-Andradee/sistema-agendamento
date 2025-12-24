CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  notes TEXT,
  procedure_id TEXT, -- ID of the service usually performed
  avg_time_minutes INTEGER, -- Custom duration for this client
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (procedure_id) REFERENCES services(id) ON DELETE SET NULL
);
