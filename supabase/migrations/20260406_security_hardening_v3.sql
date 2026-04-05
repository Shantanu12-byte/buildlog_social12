-- BUILDLOG SECURITY HARDENING v3
-- Modernizes the role-protection trigger and ensures RLS is clean for profiles.
-- Fixes issue where new/existing users with NULL roles were breaking the security condition.

-- 1. RE-ENABLE RLS (Defensive)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. SIMPLIFIED POLICIES
-- Drop all previous inconsistent policies for profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile (safe)" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- Everyone can see profile data (public usernames, bios, etc.)
CREATE POLICY "profiles_select_public" ON profiles 
  FOR SELECT USING (true);

-- Authenticated users can create their own profile entry
CREATE POLICY "profiles_insert_own" ON profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Authenticated users can modify their own profile data
-- The 'prevent_role_escalation' trigger below will handle column-level security.
CREATE POLICY "profiles_update_own" ON profiles 
  FOR UPDATE USING (auth.uid() = id);

-- Admins (via their role) have full access
CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- 3. IMPROVED TRIGGER: ROLE PROTECTION
-- Uses COALESCE to handle NULL roles for new/existing users.
CREATE OR REPLACE FUNCTION prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- If modification is by an authenticated user (not service role/PSQL),
  -- and they are NOT an admin, block changes to sensitive columns.
  IF auth.uid() IS NOT NULL AND (
    SELECT COALESCE(role, 'user') FROM profiles WHERE id = auth.uid()
  ) != 'admin' THEN
    -- Force the sensitive columns back to their original values
    NEW.role := OLD.role;
    NEW.is_suspended := OLD.is_suspended;
    NEW.suspended_reason := OLD.suspended_reason;
    NEW.suspended_until := OLD.suspended_until;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_role_protection ON profiles;
CREATE TRIGGER enforce_role_protection
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_role_escalation();

-- 4. HOUSEKEEPING: USER SECRETS (Ensure table exists)
CREATE TABLE IF NOT EXISTS user_secrets (
  id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  github_access_token TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_secrets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own secrets" ON user_secrets;
CREATE POLICY "Users can manage own secrets" ON user_secrets
  FOR ALL USING (auth.uid() = id);

NOTIFY pgrst, 'reload schema';
