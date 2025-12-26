-- Migration: Add missing updated_at column to professionals table
-- Note: Other columns (cpf, address, bank_name, bank_account, notes) already exist

ALTER TABLE professionals ADD COLUMN updated_at DATETIME;

