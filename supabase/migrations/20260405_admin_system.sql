-- BUILDLOG - ADMIN SYSTEM MIGRATION (v1)
-- Adds role-based access, content reporting, and analytics tracking.

-- 1. ROLE-BASED ACCESS CONTROL
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' 
CHECK (role IN ('user','moderator','admin'));

-- 2. SUSPENSION LOGIC
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS suspended_reason TEXT,
ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ;

-- 3. REPORTS QUEUE
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES auth.users(id),
  reported_user_id UUID REFERENCES auth.users(id),
  reported_post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  reported_message_id UUID, -- For future chat moderation
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'ignored')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. USAGE ANALYTICS
CREATE TABLE IF NOT EXISTS page_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  page TEXT NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT now()
);

-- 5. RLS POLICIES (SECURITY FIRST)
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Reports: Only admins can manage records
CREATE POLICY "Admins can manage reports" ON reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Reports: Users can insert their own reports
CREATE POLICY "Users can submit reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Page Views: Only admins can see analytics
CREATE POLICY "Admins can view analytics" ON page_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Page Views: Users can insert their own views
CREATE POLICY "Users can track their views" ON page_views
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Profiles: Restrict admin data visibility
-- Note: Profiles are usually public, but we might want to restrict 'role' or sensitive fields.
-- For now, let's ensure admins can manage all profiles.

-- Update yourself as admin (Replace with correct username after verification)
-- UPDATE profiles SET role = 'admin' WHERE username = 'shantanu_95';

NOTIFY pgrst, 'reload schema';
