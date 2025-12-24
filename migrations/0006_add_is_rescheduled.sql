-- Add is_rescheduled column to appointments table
ALTER TABLE appointments ADD COLUMN is_rescheduled BOOLEAN DEFAULT FALSE;
