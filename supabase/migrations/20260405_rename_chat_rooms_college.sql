-- Supabase Migration: 20260405_rename_chat_rooms_college.sql
-- Goal: Standardize 'college' -> 'campus_id' in chat_rooms table.

-- 1. Rename column in chat_rooms
ALTER TABLE chat_rooms 
RENAME COLUMN college TO campus_id;

-- 2. Verify column exists in profiles (already should, but to be safe)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS campus_id TEXT;
