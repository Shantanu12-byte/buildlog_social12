-- FIX USER DELETION FOREIGN KEY VIOLATIONS (v1)
-- This migration updates existing foreign keys to 'ON DELETE CASCADE' or 'ON DELETE SET NULL'
-- to prevent errors when users are deleted from auth.users.

-- 1. PAGE VIEWS (Analytics) - CASCADE
-- If a user is deleted, we should remove their page view logs.
ALTER TABLE IF EXISTS page_views
  DROP CONSTRAINT IF EXISTS page_views_user_id_fkey,
  ADD CONSTRAINT page_views_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. USER PROBLEMS (Challenges) - CASCADE
-- If a user is deleted, their progress data should be wiped.
ALTER TABLE IF EXISTS user_problems
  DROP CONSTRAINT IF EXISTS user_problems_user_id_fkey,
  ADD CONSTRAINT user_problems_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. REPORTS (Moderation) - SET NULL
-- We want to KEEP reports for audit history even if the reporter or the reported user is gone.
ALTER TABLE IF EXISTS reports
  DROP CONSTRAINT IF EXISTS reports_reporter_id_fkey,
  ADD CONSTRAINT reports_reporter_id_fkey 
    FOREIGN KEY (reporter_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  DROP CONSTRAINT IF EXISTS reports_reported_user_id_fkey,
  ADD CONSTRAINT reports_reported_user_id_fkey 
    FOREIGN KEY (reported_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 4. CHAT ROOMS (Metadata) - SET NULL
-- Don't delete the chat room if the creator is deleted.
ALTER TABLE IF EXISTS chat_rooms
  DROP CONSTRAINT IF EXISTS chat_rooms_created_by_fkey,
  ADD CONSTRAINT chat_rooms_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

NOTIFY pgrst, 'reload schema';
