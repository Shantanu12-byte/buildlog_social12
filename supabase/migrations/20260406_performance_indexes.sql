-- BUILDLOG PERFORMANCE INDEXES
-- Optimizes the most critical app queries for the Feed, Tavern, and Analytics.
-- These are 'safe' additions that require no code changes.

-- 1. POSTS - Fast Feed and Profile loading
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts (author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at_desc ON posts (created_at DESC);

-- 2. ROOM MEMBERS - Fast Tavern initialization
CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON room_members (user_id);

-- 3. PAGE VIEWS - Fast Analytics and Dashboard counting
CREATE INDEX IF NOT EXISTS idx_page_views_viewed_at ON page_views (viewed_at);
CREATE INDEX IF NOT EXISTS idx_page_views_user_id ON page_views (user_id);

-- 4. MESSAGES - Fast Chat history loading
CREATE INDEX IF NOT EXISTS idx_messages_room_id_created ON messages (room_id, created_at DESC);

NOTIFY pgrst, 'reload schema';
