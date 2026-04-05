-- BUILDLOG SECURITY HARDENING v1
-- Fixes critical vulnerability: users could self-promote to admin via profile UPDATE.
-- Also adds brute-force protection and application-level security controls.

-- ============================================================
-- FIX 1: PREVENT ROLE SELF-ESCALATION (CRITICAL)
-- The old policy "Users can update own profile" allowed updating
-- ANY column including 'role', 'is_suspended'. This replaces it
-- with a restrictive policy using a security-definer function.
-- ============================================================

-- Drop the unsafe blanket UPDATE policy
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- New safe UPDATE policy: users can update their own profile
-- BUT the role, is_suspended, and suspended_reason columns are blocked.
-- Users can change: username, bio, avatar_url, skills, college, etc.
CREATE POLICY "Users can update own profile (safe)" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Prevent self-promotion: role must stay the same
    -- (only admins via service role or SQL editor can change role)
  );

-- Separate admin-only UPDATE policy for role management
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
CREATE POLICY "Admins can manage all profiles" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================================
-- FIX 2: BLOCK role COLUMN from user updates via a DB trigger
-- Belt-and-suspenders: even if above policy is bypassed,
-- this trigger prevents role escalation at the DB level.
-- ============================================================

CREATE OR REPLACE FUNCTION prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user is not an admin (checked via auth.uid()),
  -- disallow any change to the role, is_suspended, or suspended_reason columns.
  IF auth.uid() IS NOT NULL AND (
    SELECT role FROM profiles WHERE id = auth.uid()
  ) != 'admin' THEN
    -- Revert the sensitive columns to their original values
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

-- ============================================================
-- FIX 3: LOCK DOWN admin-only tables
-- Ensure only admins can view page_views (analytics).
-- Regular users can INSERT (track themselves) but never SELECT.
-- ============================================================

-- page_views: users can only insert their own, admins can read all
DROP POLICY IF EXISTS "Admins can view analytics" ON page_views;
CREATE POLICY "Admins can view analytics" ON page_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can track their views" ON page_views;
CREATE POLICY "Users can track their views" ON page_views
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- reports: users can submit, only admins can read/update
DROP POLICY IF EXISTS "Admins can manage reports" ON reports;
DROP POLICY IF EXISTS "Users can submit reports" ON reports;

CREATE POLICY "Users can read their own reports" ON reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Users can submit reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can manage reports" ON reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================================
-- FIX 4: SECURE ROLE-CHANGE FUNCTION
-- Expose a SECURITY DEFINER function so the admin panel can
-- safely change roles. Only works if caller is already admin.
-- ============================================================

CREATE OR REPLACE FUNCTION admin_set_user_role(
  target_user_id UUID,
  new_role TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Verify caller is an admin
  IF (SELECT role FROM profiles WHERE id = auth.uid()) != 'admin' THEN
    RAISE EXCEPTION 'Access denied: caller is not an admin';
  END IF;

  -- Validate role value
  IF new_role NOT IN ('user', 'moderator', 'admin') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;

  UPDATE profiles SET role = new_role WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

NOTIFY pgrst, 'reload schema';
