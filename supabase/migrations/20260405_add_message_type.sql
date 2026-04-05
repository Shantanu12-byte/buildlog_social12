-- Supabase Migration: 20260405_add_message_type.sql
-- Goal: Add 'type' column to messages to support system notifications

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text';

-- Update existing messages to be of type 'text'
UPDATE messages SET type = 'text' WHERE type IS NULL;
