-- ============================================================
-- BuildLog: Username Unique Constraint + Profile Stats Columns
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Add UNIQUE index on profiles.username (case-insensitive)
--    Uses lower() so 'JohnDoe' and 'johndoe' are treated as the same.
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_unique
  ON profiles (lower(username));

-- 2. Add UNIQUE index on users.username
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique
  ON users (lower(username));

-- 3. Add fork_count and star_count columns to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'fork_count'
  ) THEN
    ALTER TABLE profiles ADD COLUMN fork_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'star_count'
  ) THEN
    ALTER TABLE profiles ADD COLUMN star_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- 4. Verify indexes were created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('profiles', 'users')
  AND indexname LIKE '%username%';

-- 5. Verify new columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('fork_count', 'star_count');
