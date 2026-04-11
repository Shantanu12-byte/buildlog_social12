-- ══════════════════════════════════════════════════════════════
-- CodeNid PERFORMANCE UPGRADE: PROFILE_STATS_CONSOLIDATION_v1
-- URL: https://supabase.com/dashboard/project/_/sql
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_profile_stats(user_id_param UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'projects_count', (SELECT count(*) FROM posts WHERE author_id = user_id_param),
    'builds_count', (SELECT count(*) FROM quest_logs WHERE user_id = user_id_param),
    'followers_count', (SELECT count(*) FROM followers WHERE following_id = user_id_param),
    'following_count', (SELECT count(*) FROM followers WHERE follower_id = user_id_param),
    'hypes_count', (SELECT COALESCE(sum(likes), 0) FROM posts WHERE author_id = user_id_param),
    'posts', (
      SELECT json_agg(p) FROM (
        SELECT id, title, caption, image_url, created_at, skills, github_url
        FROM posts
        WHERE author_id = user_id_param
        ORDER BY created_at DESC
        LIMIT 20
      ) p
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
