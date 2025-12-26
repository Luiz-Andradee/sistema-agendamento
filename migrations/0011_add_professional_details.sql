-- Migration: Add professional details (CPF, address, bank info, notes)
ALTER TABLE professionals ADD COLUMN cpf TEXT;
ALTER TABLE professionals ADD COLUMN address TEXT;
ALTER TABLE professionals ADD COLUMN bank_name TEXT;
ALTER TABLE professionals ADD COLUMN bank_account TEXT;
ALTER TABLE professionals ADD COLUMN notes TEXT;
