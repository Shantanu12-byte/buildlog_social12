-- ══════════════════════════════════════════════════════════════
-- CodeNid PERFORMANCE UPGRADE: PROFILE_STATS_CONSOLIDATION_v3
-- Enables consolidated profile stats fetch through a single RPC call.
-- Fixed table names: quest_logs -> user_problems
-- Fixed column names: likes -> cheers
-- Fixed posts selection: removed non-existent 'skills' and 'github_url'
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_profile_stats(user_id_param UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'projects_count', (SELECT count(*) FROM posts WHERE author_id = user_id_param),
    'builds_count', (SELECT count(*) FROM user_problems WHERE user_id = user_id_param AND status = 'solved'),
    'followers_count', (SELECT count(*) FROM followers WHERE following_id = user_id_param),
    'following_count', (SELECT count(*) FROM followers WHERE follower_id = user_id_param),
    'hypes_count', (SELECT COALESCE(sum(cheers), 0) FROM posts WHERE author_id = user_id_param),
    'posts', (
      SELECT COALESCE(json_agg(p), '[]'::json) FROM (
        SELECT id, "projectTitle", title, caption, "imageUrl", image_url, created_at
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
