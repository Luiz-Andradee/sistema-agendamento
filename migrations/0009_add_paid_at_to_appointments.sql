-- Migration number: 0009 	 2025-12-24T14:00:00.000Z
ALTER TABLE appointments ADD COLUMN paid_at DATETIME;
