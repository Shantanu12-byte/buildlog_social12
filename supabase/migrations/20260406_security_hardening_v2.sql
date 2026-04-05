-- BUILDLOG SECURITY HARDENING v2
-- Fixes RLS for Profiles to allow onboarding/campus selection.
-- Also restricts sensitive columns.

-- 1. PROFILES: SELECT
-- Everyone can see public profile data.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles 
  FOR SELECT USING (true);

-- 2. PROFILES: INSERT
-- Users can only insert their own profile.
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. PROFILES: UPDATE
-- Users can update their own non-sensitive columns.
-- Sensitive columns like 'role' are handled by the DB trigger.
DROP POLICY IF EXISTS "Users can update own profile (safe)" ON profiles;
CREATE POLICY "Users can update own profile (safe)" ON profiles 
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. ADIMIN PANEL: ALL
-- Admins have full control over all profiles.
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
CREATE POLICY "Admins can manage all profiles" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- 5. TRIGGER FOR ROLE PROTECTION
-- Re-apply/Ensure the trigger exists to block role escalation.
CREATE OR REPLACE FUNCTION prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- Revert sensitive columns if not modified by an admin.
  -- Service role (null auth.uid()) is allowed to modify anything.
  IF auth.uid() IS NOT NULL AND (
    SELECT role FROM profiles WHERE id = auth.uid()
  ) != 'admin' THEN
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

-- 6. GITHUB TOKENS PROTECTION
-- Move sensitive columns into a separate view or handled via column-level permissions
-- Since we can't easily do column-level RLS in Supabase, we rely on the fact 
-- that github_access_token should only be fetched when needed.
-- I will add a policy to 'profiles' to ensure github_access_token can't be fetched
-- by non-owners and non-admins if they try to select it specifically.
-- Actually, the best way in Supabase is to have a private table for secrets.
-- I will create a 'user_secrets' table for github tokens to be safer.

CREATE TABLE IF NOT EXISTS user_secrets (
  id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  github_access_token TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_secrets ENABLE ROW LEVEL SECURITY;

-- Only users can see/update their own secrets. Admins can see them.
CREATE POLICY "Users can manage own secrets" ON user_secrets
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Admins can view secrets" ON user_secrets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

NOTIFY pgrst, 'reload schema';
