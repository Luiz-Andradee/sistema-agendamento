-- Migration number: 0005 	 2024-12-24T14:10:00.000Z
ALTER TABLE appointments ADD COLUMN client_notified BOOLEAN DEFAULT FALSE;
