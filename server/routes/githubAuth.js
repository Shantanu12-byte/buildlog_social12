const express = require('express');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Exchange temporary code for access token
 * POST /api/auth/github/exchange
 * [SECURED]: Uses authMiddleware and req.user.id
 */
router.post('/exchange', authMiddleware, async (req, res) => {
  const { code } = req.body;
  const userId = req.user.id; // Secure identification

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

    const { access_token, error } = tokenResponse.data;

    if (error) {
      console.error('[GitHub Exchange Error]:', error);
      return res.status(400).json({ error: 'Failed to exchange GitHub code' });
    }

    // 2. Save token to Supabase 'user_secrets' table (Secured storage)
    const { error: dbError } = await supabase
      .from('user_secrets')
      .upsert({ 
        id: userId, 
        github_access_token: access_token,
        updated_at: new Date().toISOString()
      });

    if (dbError) {
      console.error('[Database Error]:', dbError);
      return res.status(500).json({ error: 'Failed to securely store GitHub token' });
    }

    // 3. Mark profile as GitHub-connected (Optional UI flag)
    await supabase
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
 * [SECURED]: Uses authMiddleware and req.user.id
 */
router.get('/repos', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. Get token from user_secrets table
    const { data, error: dbError } = await supabase
      .from('user_secrets')
      .select('github_access_token')
      .eq('id', userId)
      .single();

    if (dbError || !data?.github_access_token) {
      return res.status(404).json({ error: 'GitHub not connected' });
    }

    // 2. Fetch repos from GitHub
    const repoResponse = await axios.get('https://api.github.com/user/repos', {
      params: { type: 'public', sort: 'updated', per_page: 100 },
      headers: {
        Authorization: `token ${data.github_access_token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    res.json(repoResponse.data);
  } catch (err) {
    console.error('Fetch Repos Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

module.exports = router;
