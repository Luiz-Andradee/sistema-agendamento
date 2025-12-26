-- Migration: Add missing updated_at column to services table

ALTER TABLE services ADD COLUMN updated_at DATETIME;
