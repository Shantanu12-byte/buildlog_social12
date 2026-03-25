-- Add public profile fields and update RLS policies
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0;

-- Update RLS for profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (is_public = true);

-- Ensure projects and posts are also viewable publicly if they belong to a public profile
-- (Note: These tables already have "viewable by everyone" policies in the audit script, 
-- but we can make them more specific if needed. Keeping them broad for now as per current schema.)

-- Hotfix for existing profiles to have is_public as true
UPDATE profiles SET is_public = true WHERE is_public IS NULL;
