-- BUILDLOG - SCHEMA REFINEMENT (v5)
-- Adopts modern campus fields, in-app notifications, and a search-optimized view.

-- 1. PROFILES ENHANCEMENTS
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS campus_id TEXT,
ADD COLUMN IF NOT EXISTS campus_name TEXT,
ADD COLUMN IF NOT EXISTS is_joined_to_campus BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS expo_push_token TEXT;

-- 2. POSTS ENHANCEMENTS (Defensive Fix for missing columns)
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS caption TEXT,
ADD COLUMN IF NOT EXISTS "projectTitle" TEXT,
ADD COLUMN IF NOT EXISTS content TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS "imageUrl" TEXT,
ADD COLUMN IF NOT EXISTS gravity_score FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS cheers INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comments INTEGER DEFAULT 0;

-- 3. NOTIFICATIONS TABLE (In-App History)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT, -- 'follow', 'hype', 'chat', 'system'
    title TEXT,
    content TEXT,
    sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see their own notifications" ON notifications;
CREATE POLICY "Users can see their own notifications" ON notifications 
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications 
FOR UPDATE USING (auth.uid() = user_id);

-- 4. POSTS_WITH_PROFILES VIEW (Search Optimization)
-- This view joins posts with author profiles for the 'Explore' tab.
CREATE OR REPLACE VIEW posts_with_profiles AS
SELECT 
    p.id,
    p.author_id,
    p."projectTitle",
    p.title,
    p.caption,
    p.content,
    p."imageUrl",
    p.image_url,
    p.gravity_score,
    p.cheers,
    p.comments,
    p.created_at,
    u.username,
    u.avatar_url,
    u.college
FROM posts p
LEFT JOIN profiles u ON p.author_id = u.id;

-- 4. REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
