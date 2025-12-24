-- Create users table for authentication
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user
-- NOTE: In a real production app, passwords should be hashed (e.g., bcrypt/argon2).
-- For this simple implementation, we are storing it directly as requested for the prototype.
INSERT INTO users (id, username, password) VALUES
  ('admin-user', 'Aline', 'Aline2709#');
