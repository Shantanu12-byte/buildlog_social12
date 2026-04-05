const express = require('express');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * 🔐 AUTH MIDDLEWARE (Fix 3)
 * Always use verified user from JWT, never trust client-supplied IDs.
 */
async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    console.error('[Auth Error]:', error?.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = user; // Attach verified user object
  next();
}

/**
 * Exchange temporary code for access token
 * POST /api/auth/github/exchange
 * [SECURED]: Uses requireAuth and verified user.id
 */
router.post('/exchange', requireAuth, async (req, res) => {
  const { code } = req.body;
  const userId = req.user.id; // From verified JWT

  if (!code) {
    return res.status(400).json({ error: 'OAuth code is required' });
  }

  try {
    // 1. Exchange code for access token with GitHub
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
      },
      {
        headers: { Accept: 'application/json' },
      }
    );

    const { access_token, scope, error: ghError } = tokenResponse.data;

    if (ghError) {
      console.error('[GitHub Exchange Error]:', ghError);
      return res.status(400).json({ error: 'Failed to exchange GitHub code' });
    }

    // 2. Save token to SECURE table (Fix 4: Token Isolation)
    const { error: dbError } = await supabaseAdmin
      .from('user_github_tokens')
      .upsert({
        user_id: userId,
        access_token: access_token,
        scope: scope,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (dbError) {
      console.error('[Database Error]:', dbError.message);
      return res.status(500).json({ error: 'Failed to securely store GitHub token' });
    }

    // 3. Update public flag in profiles
    await supabaseAdmin
      .from('profiles')
      .update({ is_github_connected: true })
      .eq('id', userId);

    res.json({ success: true, message: 'GitHub connected securely' });
  } catch (err) {
    console.error('GitHub Exchange Error:', err.message);
    res.status(500).json({ error: 'Internal server error during exchange' });
  }
});

/**
 * Fetch repositories for the authenticated user
 * GET /api/user/github/repos
 * [SECURED]: IDOR-free repository fetching
 */
router.get('/repos', requireAuth, async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. Fetch token server-side only (Fix 4)
    const { data: tokenData, error: dbError } = await supabaseAdmin
      .from('user_github_tokens')
      .select('access_token')
      .eq('user_id', userId)
      .single();

    if (dbError || !tokenData) {
      return res.status(401).json({ error: 'GitHub not connected' });
    }

    // 2. Use token for GitHub API (Never send token back to client)
    const repoResponse = await axios.get('https://api.github.com/user/repos', {
      params: { type: 'public', sort: 'updated', per_page: 100 },
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    // 3. Send only required data back
    res.json({ repos: repoResponse.data });
  } catch (err) {
    console.error('Fetch Repos Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

module.exports = router;
