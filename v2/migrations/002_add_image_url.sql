-- Add image_url column to links table
-- Created: 2026-01-20
-- Note: This migration is idempotent (safe to run multiple times)

-- SQLite doesn't support IF NOT EXISTS for columns, so we use a trick:
-- Check if column exists first, only add if missing
-- This is handled by catching the error in Python migrate.py
ALTER TABLE links ADD COLUMN image_url TEXT;
