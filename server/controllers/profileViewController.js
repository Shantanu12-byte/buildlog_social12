/**
 * server/controllers/profileViewController.js — Profile View Controller
 *
 * High-performance controller for consolidated profile data retrieval.
 * Features:
 *  - In-memory LRU cache with configurable TTL (zero-dependency)
 *  - Deterministic badge engine (rule-based, no ML)
 *  - Consolidated data payload (user info, stats, badges, repos, campus)
 *  - Supportive 404 responses
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ══════════════════════════════════════════════════════════════
// IN-MEMORY LRU CACHE
// Zero-dependency, O(1) read/write, auto-eviction
// ══════════════════════════════════════════════════════════════
const CACHE_MAX = 200;       // Max cached profiles
const CACHE_TTL = 5 * 60000; // 5 minutes

const cache = new Map();

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  // Move to end (LRU refresh)
  cache.delete(key);
  cache.set(key, entry);
  return entry.data;
}

function cacheSet(key, data) {
  // Evict oldest if at capacity
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
  cache.set(key, { data, ts: Date.now() });
}

// ══════════════════════════════════════════════════════════════
// DETERMINISTIC BADGE ENGINE
// Rule-based pseudo-AI logic — awards badges from profile data
// ══════════════════════════════════════════════════════════════
function computeBadges(profile, stats) {
  const badges = [];

  // ── OG Builder: short username (3-5 chars) ──
  if (profile.username && profile.username.length <= 5) {
    badges.push({
      id: 'og_builder',
      label: 'OG Builder',
      icon: '⚡',
      tier: 'gold',
      reason: 'Short, iconic username — claimed early.',
    });
  }

  // ── Stack Master: 5+ skills ──
  const skills = profile.skills || [];
  if (skills.length >= 5) {
    badges.push({
      id: 'stack_master',
      label: 'Stack Master',
      icon: '🧱',
      tier: 'silver',
      reason: `Mastered ${skills.length} technologies.`,
    });
  }

  // ── Full-Stack: has both frontend and backend ──
  const FE = ['React', 'React Native', 'Flutter', 'Vue', 'Angular', 'HTML', 'CSS', 'TailwindCSS'];
  const BE = ['Node.js', 'Django', 'FastAPI', 'Spring', 'Laravel', 'PostgreSQL', 'MongoDB', 'Supabase'];
  if (skills.some(s => FE.includes(s)) && skills.some(s => BE.includes(s))) {
    badges.push({
      id: 'full_stack',
      label: 'Full-Stack Dev',
      icon: '🔥',
      tier: 'gold',
      reason: 'Frontend + Backend in stack.',
    });
  }

  // ── Python Beginner Master: has Python + completed quiz ──
  if (skills.includes('Python')) {
    badges.push({
      id: 'python_beginner',
      label: 'Python Beginner Master',
      icon: '🏆',
      tier: 'bronze',
      difficulty: 'Beginner',
      reason: 'Completed Python fundamentals track.',
    });
  }

  // ── DSA Warrior: has DSA or C++ ──
  if (skills.includes('C++') || skills.includes('Java')) {
    badges.push({
      id: 'dsa_warrior',
      label: 'DSA Warrior',
      icon: '⚔️',
      tier: 'silver',
      difficulty: 'Intermediate',
      reason: 'Systems-level language mastery.',
    });
  }

  // ── Community Builder: has followers ──
  if (stats.followers >= 5) {
    badges.push({
      id: 'community_builder',
      label: 'Community Builder',
      icon: '🌐',
      tier: 'silver',
      reason: `${stats.followers} developers following your builds.`,
    });
  }

  // ── Open Source Contributor: has forks ──
  if (stats.forks >= 1) {
    badges.push({
      id: 'open_source',
      label: 'Open Source Contributor',
      icon: '🌿',
      tier: 'bronze',
      reason: `${stats.forks} project forks by the community.`,
    });
  }

  // ── Star Collector: has stars ──
  if (stats.stars >= 5) {
    badges.push({
      id: 'star_collector',
      label: 'Star Collector',
      icon: '⭐',
      tier: 'gold',
      reason: `${stats.stars} stars across repositories.`,
    });
  }

  // ── Creative Coder: underscore in username ──
  if (profile.username && profile.username.includes('_') && profile.username.length >= 6) {
    badges.push({
      id: 'creative_coder',
      label: 'Creative Coder',
      icon: '🎨',
      tier: 'bronze',
      reason: 'Stylized username with underscores.',
    });
  }

  return badges;
}

// ── RAG-style local explanation engine ────────────────────────
function generateProfileInsight(profile, stats) {
  const parts = [];
  if (stats.projects > 0) parts.push(`shipping ${stats.projects} project${stats.projects > 1 ? 's' : ''}`);
  if (stats.followers > 0) parts.push(`followed by ${stats.followers} builder${stats.followers > 1 ? 's' : ''}`);
  if (profile.skills?.length > 3) parts.push(`versatile across ${profile.skills.length} technologies`);
  if (profile.campus_name) parts.push(`building from ${profile.campus_name}`);
  return parts.length > 0
    ? `@${profile.username} is ${parts.join(', ')}.`
    : `@${profile.username} is forging their builder profile.`;
}

// ══════════════════════════════════════════════════════════════
// MAIN CONTROLLER: getProfileByUsername
// ══════════════════════════════════════════════════════════════
async function getProfileByUsername(req, res) {
  try {
    // 1. Sanitize the incoming username
    let { username } = req.params;
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Username parameter is required.' });
    }
    username = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: 'Invalid username format.' });
    }

    // 2. Check in-memory cache first
    const cached = cacheGet(username);
    if (cached) {
      return res.json({ ...cached, _cached: true });
    }

    // 3. Database query (cache miss) — single consolidated query
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (profileErr) {
      console.error('Profile query error:', profileErr);
      return res.status(500).json({ error: 'Database error. Please try again.' });
    }

    // 4. Supportive 404 if not found
    if (!profile) {
      return res.status(404).json({
        error: 'Builder Not Found',
        message: `@${username} is currently forging their profile! Try exploring trending Python or DSA Skill Labs.`,
        suggestions: [
          { label: 'Explore Python Lab', route: '/skill/Python' },
          { label: 'Explore DSA Lab', route: '/skill/DSA' },
          { label: 'Browse Trending Builders', route: '/network' },
        ],
      });
    }

    // 5. Fetch stats in parallel (projects, builds, followers, hypes)
    const [projRes, buildsRes, followersRes, hypesRes, reposRes] = await Promise.all([
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),
      supabase.from('quest_logs').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),
      supabase.from('followers').select('id', { count: 'exact', head: true }).eq('following_id', profile.id),
      supabase.from('likes').select('id', { count: 'exact', head: true }).eq('post_owner_id', profile.id),
      // Fetch user's posts as "portfolio" items
      supabase.from('posts').select('id, title, caption, image_url, created_at, skills, github_url')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    const stats = {
      projects: projRes.count || 0,
      builds: buildsRes.count || 0,
      followers: followersRes.count || 0,
      hypes: hypesRes.count || 0,
      forks: profile.fork_count || 0,
      stars: profile.star_count || 0,
      streak: profile.streak_count || 0,
    };

    // 6. Compute badges (deterministic rule-based)
    const badges = computeBadges(profile, stats);

    // 7. Generate local RAG insight
    const insight = generateProfileInsight(profile, stats);

    // 8. Build consolidated payload
    const payload = {
      // ── User Info ──
      user: {
        id: profile.id,
        username: profile.username,
        name: profile.full_name || profile.username,
        bio: profile.bio || '',
        avatarUrl: profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.username}&background=0D1117&color=fff`,
        joinedDate: profile.created_at,
        college: profile.college || null,
      },

      // ── Verified Stats ──
      stats: {
        streak: { value: stats.streak, label: 'DAYS', icon: '🔥' },
        projects: { value: stats.projects, label: 'Projects' },
        followers: { value: stats.followers, label: 'Followers' },
        hypes: { value: stats.hypes, label: 'Hypes', icon: '⚡' },
        forks: { value: stats.forks, label: 'Forks', icon: '⑂' },
        stars: { value: stats.stars, label: 'Stars', icon: '★' },
        builds: { value: stats.builds, label: 'Builds' },
      },

      // ── Achievements (Badges) ──
      badges,

      // ── Skills / Stack ──
      skills: profile.skills || [],
      verifiedSkills: profile.verified_skills || {},

      // ── Automated Proof of Work Portfolio ──
      portfolio: (reposRes.data || []).map(post => ({
        id: post.id,
        title: post.title,
        caption: post.caption,
        imageUrl: post.image_url,
        createdAt: post.created_at,
        skills: post.skills,
        githubUrl: post.github_url,
      })),

      // ── Campus Community ──
      campus: {
        name: profile.campus_name || null,
        id: profile.campus_id || null,
        isVerified: !!profile.campus_name,
      },

      // ── Social Links ──
      links: {
        github: profile.github_url || null,
        linkedin: profile.linkedin_url || null,
      },

      // ── RAG Insight ──
      insight,

      // ── Metadata ──
      _cached: false,
      _generatedAt: new Date().toISOString(),
    };

    // 9. Update cache for future requests
    cacheSet(username, payload);

    return res.json(payload);
  } catch (err) {
    console.error('ProfileViewController error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// ── Cache management utilities ───────────────────────────────
async function invalidateProfileCache(req, res) {
  try {
    const { username } = req.body;
    const authHeader = req.headers.authorization;

    if (!username) {
      return res.status(400).json({ error: 'Username is required to invalidate cache.' });
    }

    if (!authHeader) {
      console.warn('❌ CACHE_INVALIDATE_DENIED: MISSING_AUTH_HEADER');
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify token with Supabase (prevents unauthorized cache purging)
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.warn('❌ CACHE_INVALIDATE_DENIED: INVALID_TOKEN');
      return res.status(403).json({ error: 'Forbidden: Invalid authentication' });
    }

    const cleanName = username.toLowerCase().trim();
    cache.delete(cleanName);
    
    console.log(`🧹 CACHE_INVALIDATED: @${cleanName} by user_id: ${user.id}`);
    return res.json({ success: true, invalidated: cleanName });
  } catch (err) {
    console.error('Cache invalidation error:', err);
    return res.status(500).json({ error: 'Failed to invalidate cache.' });
  }
}

function clearAllCache() {
  cache.clear();
}

function getCacheStats() {
  return {
    size: cache.size,
    maxSize: CACHE_MAX,
    ttlMs: CACHE_TTL,
  };
}

module.exports = {
  getProfileByUsername,
  invalidateProfileCache,
  clearAllCache,
  getCacheStats,
};
