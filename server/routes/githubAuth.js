const express = require('express');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Exchange temporary code for access token
 * POST /api/auth/github/exchange
 */
router.post('/exchange', async (req, res) => {
  const { code, userId } = req.body;

  if (!code || !userId) {
    return res.status(400).json({ error: 'Code and userId are required' });
  }

  try {
    // 1. Exchange code for access token
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
      return res.status(400).json({ error });
    }

    // 2. Save token to Supabase profile
    const { error: dbError } = await supabase
      .from('profiles')
      .update({ github_access_token: access_token })
      .eq('id', userId);

    if (dbError) {
      console.error('Database Error:', dbError);
      return res.status(500).json({ error: 'Failed to save token to profile' });
    }

    res.json({ success: true, message: 'GitHub connected successfully' });
  } catch (err) {
    console.error('Exchange Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Fetch repositories for the authenticated user
 * GET /api/user/github/repos
 */
router.get('/repos', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    // 1. Get token from Supabase
    const { data, error: dbError } = await supabase
      .from('profiles')
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
