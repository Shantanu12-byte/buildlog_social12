-- BUILDLOG CRITICAL FIXES (v4)
-- This migration implements:
-- 1. Security Trigger refinement (Fix 3)
-- 2. RLS policy modernization (Fix 2)
-- 3. GitHub Token Isolation table (Fix 4)

-- 🟢 FIX 4: Secure tokens table
CREATE TABLE IF NOT EXISTS user_github_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  access_token text NOT NULL,
  token_type text DEFAULT 'bearer',
  scope text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- STRICT RLS — users only see OWN token
ALTER TABLE user_github_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own token only" ON user_github_tokens;
CREATE POLICY "own token only" 
ON user_github_tokens
FOR ALL USING (auth.uid() = user_id);

-- 🟢 FIX 2: Profiles RLS Modernization
-- Drop old restrictive/conflicting policies
DROP POLICY IF EXISTS "users can update own profile" ON profiles;
DROP POLICY IF EXISTS "users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "authenticated can read profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_select_public" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;

-- Allow insert for new profiles
CREATE POLICY "users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow simplest working update policy
-- (Trigger will handle sensitive column protection)
CREATE POLICY "users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow read for all authenticated users
CREATE POLICY "authenticated can read profiles"
ON profiles FOR SELECT
USING (auth.role() = 'authenticated');

-- 🟢 FIX 3: Role Escalation Security Trigger
DROP TRIGGER IF EXISTS prevent_role_escalation ON profiles;
DROP TRIGGER IF EXISTS enforce_role_protection ON profiles;
DROP FUNCTION IF EXISTS check_role_escalation();
DROP FUNCTION IF EXISTS prevent_role_escalation();

CREATE OR REPLACE FUNCTION check_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle NULL old role safely (New users have NULL role initially)
  IF COALESCE(OLD.role, 'user') = 'admin' 
     AND NEW.role != 'admin' 
     AND auth.uid() != OLD.id THEN
    RAISE EXCEPTION 'Cannot demote admin role';
  END IF;

  -- Prevent self-promotion to admin/moderator
  IF auth.uid() = NEW.id 
     AND NEW.role IN ('admin', 'moderator')
     AND COALESCE(OLD.role, 'user') = 'user' 
  THEN
    RAISE EXCEPTION 'Cannot self-promote role';
  END IF;

  -- Allow NULL → user transition (new user profile creation)
  IF OLD.role IS NULL AND NEW.role = 'user' THEN
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER prevent_role_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_role_escalation();

-- 🔵 MIGRATION: Move tokens out of profiles
INSERT INTO user_github_tokens (user_id, access_token)
SELECT id, github_access_token
FROM profiles 
WHERE github_access_token IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- Cleanup deprecated columns
ALTER TABLE profiles DROP COLUMN IF EXISTS github_token;
ALTER TABLE profiles DROP COLUMN IF EXISTS github_access_token;

NOTIFY pgrst, 'reload schema';
