const express = require('express');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Simple in-memory cache for high-performance (In production, use Redis)
const importCache = new Map();

/**
 * GET /api/user/github/status
 * Reports if the access token is valid and has sufficient scopes.
 */
router.get('/status', async (req, res) => {
  const { userId } = req.query;

  if (!userId) return res.status(400).json({ error: 'userId is required' });

  try {
    const { data, error: dbError } = await supabase
      .from('profiles')
      .select('github_access_token')
      .eq('id', userId)
      .single();

    if (dbError || !data?.github_access_token) {
      // Return 200 instead of 404 to avoid console errors; just report isConnected: false
      return res.json({ isConnected: false, hasSufficientScopes: false, message: 'OAuth Link Missing' });
    }

    const accessToken = data.github_access_token;

    // Check GitHub token metadata
    const ghResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `token ${accessToken}` }
    });

    const scopes = ghResponse.headers['x-oauth-scopes'] || '';
    const hasSufficientScopes = scopes.includes('repo');

    res.json({
      isConnected: true,
      hasSufficientScopes,
      scopes: scopes.split(', '),
      username: ghResponse.data.login
    });

  } catch (err) {
    console.error('Status check error:', err.message);
    res.status(401).json({ isConnected: false, error: 'Invalid or expired token' });
  }
});

/**
 * POST /api/user/github/import
 * specialized endpoint for dynamic repo import with robust error handling.
 */
router.post('/import', async (req, res) => {
  const { userId, owner, repoName } = req.body;

  if (!userId || !owner || !repoName) {
    return res.status(400).json({ error: 'userId, owner, and repoName are required' });
  }

  // Check cache first
  const cacheKey = `${userId}:${owner}:${repoName}`;
  if (importCache.has(cacheKey)) {
    return res.json({ ...importCache.get(cacheKey), cached: true });
  }

  try {
    const { data: prof } = await supabase
      .from('profiles')
      .select('github_access_token')
      .eq('id', userId)
      .single();

    if (!prof?.github_access_token) {
      return res.status(403).json({ error: 'GitHub not connected' });
    }

    const accessToken = prof.github_access_token;

    // Systemic Fix 1: Dynamically build GitHub API URL using Axios
    const apiUrl = `https://api.github.com/repos/${owner}/${repoName}`;

    try {
      const repoResponse = await axios.get(apiUrl, {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      // Parse and categorize
      const result = {
        id: repoResponse.data.id,
        name: repoResponse.data.name,
        description: repoResponse.data.description,
        url: repoResponse.data.html_url,
        stars: repoResponse.data.stargazers_count,
        language: repoResponse.data.language,
        timestamp: new Date().toISOString()
      };

      // Systemic Fix 2: Cache locally for instant access
      importCache.set(cacheKey, result);

      res.json(result);

    } catch (ghErr) {
      // Systemic Fix 2 (Error Handling Logic): Check for 404 and verify scopes
      if (ghErr.response && ghErr.response.status === 404) {
        const userCheck = await axios.get('https://api.github.com/user', {
          headers: { Authorization: `token ${accessToken}` }
        });

        const scopes = userCheck.headers['x-oauth-scopes'] || '';
        if (!scopes.includes('repo')) {
          return res.status(403).json({
            error: 'FORBIDDEN_SCOPE',
            message: "The user pass needs the full 'repo' scope stamp to access this private work."
          });
        }
      }
      throw ghErr; // Re-throw for general catch
    }

  } catch (err) {
    console.error('Import Error:', err.message);
    res.status(500).json({ error: 'Failed to synchronize with GitHub API' });
  }
});

/**
 * POST /api/user/github/disconnect
 * specialized endpoint to clear the GitHub access token from the user profile.
 */
router.post('/disconnect', async (req, res) => {
  const { userId } = req.body;

  if (!userId) return res.status(400).json({ error: 'userId is required' });

  try {
    const { error: dbError } = await supabase
      .from('profiles')
      .update({ github_access_token: null })
      .eq('id', userId);

    if (dbError) throw dbError;

    res.json({ success: true, message: 'GitHub disconnected successfully' });
  } catch (err) {
    console.error('Disconnect Error:', err.message);
    res.status(500).json({ error: 'Failed to disconnect GitHub' });
  }
});

module.exports = router;
