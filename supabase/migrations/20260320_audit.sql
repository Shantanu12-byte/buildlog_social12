-- BUILDLOG - COMPREHENSIVE SCHEMA & SECURITY AUDIT (v4)
-- This script ensures all tables exist, enables RLS, and aligns schema with app code.

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    bio TEXT,
    college TEXT,
    avatar_url TEXT,
    skills TEXT[],
    languages TEXT[],
    github_url TEXT,
    linkedin_url TEXT,
    public_key TEXT,
    onboarding_complete BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PROJECTS
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT,
    description TEXT,
    image_url TEXT,
    needed_skills TEXT[],
    is_challenge BOOLEAN DEFAULT FALSE,
    challenge_duration INTEGER,
    looking_for_collabs BOOLEAN DEFAULT TRUE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. POSTS (Feed) - Aligned with App Code naming
CREATE TABLE IF NOT EXISTS posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    username TEXT,
    "projectTitle" TEXT,
    title TEXT, -- Fallback
    caption TEXT,
    content TEXT, -- Fallback
    "imageUrl" TEXT,
    image_url TEXT, -- Fallback
    gravity_score FLOAT DEFAULT 0,
    cheers INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. FOLLOWERS
CREATE TABLE IF NOT EXISTS followers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- 5. DM ROOMS (Private)
CREATE TABLE IF NOT EXISTS dm_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user1_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    user1_username TEXT,
    user2_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    user2_username TEXT,
    last_message TEXT,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CHAT ROOMS (Campus/Global)
CREATE TABLE IF NOT EXISTS chat_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT,
    type TEXT, -- 'campus', 'global', 'project'
    college TEXT,
    description TEXT,
    online_count INTEGER DEFAULT 0,
    member_count INTEGER DEFAULT 0,
    last_message TEXT,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. MESSAGES (Universal)
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID, -- Can point to dm_rooms.id OR chat_rooms.id
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    sender_username TEXT,
    sender_college TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. LIKES
CREATE TABLE IF NOT EXISTS likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- 2. ENABLE RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- 3. POLICIES
-- Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Projects
DROP POLICY IF EXISTS "Projects are viewable by everyone" ON projects;
CREATE POLICY "Projects are viewable by everyone" ON projects FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create projects" ON projects;
CREATE POLICY "Users can create projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Posts
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own posts" ON posts;
CREATE POLICY "Users can insert own posts" ON posts FOR INSERT WITH CHECK (auth.uid() = author_id OR auth.uid() = user_id);

-- DM Rooms
DROP POLICY IF EXISTS "Users can see their own rooms" ON dm_rooms;
CREATE POLICY "Users can see their own rooms" ON dm_rooms FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);
DROP POLICY IF EXISTS "Users can create rooms" ON dm_rooms;
CREATE POLICY "Users can create rooms" ON dm_rooms FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Chat Rooms
DROP POLICY IF EXISTS "Chat rooms are viewable by everyone" ON chat_rooms;
CREATE POLICY "Chat rooms are viewable by everyone" ON chat_rooms FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create chat rooms" ON chat_rooms;
CREATE POLICY "Users can create chat rooms" ON chat_rooms FOR INSERT WITH CHECK (true);

-- Messages
DROP POLICY IF EXISTS "Users can see messages in their rooms" ON messages;
CREATE POLICY "Users can see messages in their rooms" ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM dm_rooms WHERE dm_rooms.id = messages.room_id AND (dm_rooms.user1_id = auth.uid() OR dm_rooms.user2_id = auth.uid()))
  OR
  EXISTS (SELECT 1 FROM chat_rooms WHERE chat_rooms.id = messages.room_id)
);
DROP POLICY IF EXISTS "Users can send messages in their rooms" ON messages;
CREATE POLICY "Users can send messages in their rooms" ON messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND (
    EXISTS (SELECT 1 FROM dm_rooms WHERE dm_rooms.id = messages.room_id AND (dm_rooms.user1_id = auth.uid() OR dm_rooms.user2_id = auth.uid()))
    OR
    EXISTS (SELECT 1 FROM chat_rooms WHERE chat_rooms.id = messages.room_id)
  )
);

-- Followers
DROP POLICY IF EXISTS "Followers are viewable by everyone" ON followers;
CREATE POLICY "Followers are viewable by everyone" ON followers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can follow/unfollow" ON followers;
CREATE POLICY "Users can follow/unfollow" ON followers FOR ALL USING (auth.uid() = follower_id);

-- Likes
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON likes;
CREATE POLICY "Likes are viewable by everyone" ON likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage own likes" ON likes;
CREATE POLICY "Users can manage own likes" ON likes FOR ALL USING (auth.uid() = user_id);

-- 4. INDEXES
CREATE INDEX IF NOT EXISTS idx_posts_gravity_score ON posts(gravity_score DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON followers(following_id);
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_type ON chat_rooms(type);

-- 10. HOTFIX FOR EXISTING TABLES (ALTER TABLE commands)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS college TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS languages TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skills TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS github_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS public_key TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE posts ADD COLUMN IF NOT EXISTS "projectTitle" TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS caption TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS comments INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS username TEXT;

ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_username TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_college TEXT;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS needed_skills TEXT[];
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_challenge BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS challenge_duration INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS looking_for_collabs BOOLEAN DEFAULT TRUE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

NOTIFY pgrst, 'reload schema';

-- 5. SECURE RPC (Example)
CREATE OR REPLACE FUNCTION recalculate_verified_skills(p_user_id UUID)
RETURNS JSONB AS $$
BEGIN
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN '{"status": "success"}'::JSONB;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
