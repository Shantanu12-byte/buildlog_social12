const express = require('express');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/user/projects
 * Fetches and filters public GitHub repositories for the user to showcase as projects.
 */
router.get('/projects', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    // 1. Retrieve the stored GitHub access token from the user profile
    const { data, error: dbError } = await supabase
      .from('profiles')
      .select('github_access_token')
      .eq('id', userId)
      .single();

    if (dbError || !data?.github_access_token) {
      return res.status(404).json({ error: 'GitHub account not linked. Please authorize via OAuth.' });
    }

    const accessToken = data.github_access_token;

    // 2. Call the official GitHub User Repos API
    const githubResponse = await axios.get('https://api.github.com/user/repos', {
      params: { 
        type: 'public', 
        sort: 'updated', 
        per_page: 50 
      },
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    // 3. Filtering & Categorization Logic
    // Automatically filter out 'empty' (no description) or irrelevant repositories
    const filteredRepos = githubResponse.data
      .filter(repo => {
        // High-quality filter: must have a description and a primary language
        const hasDescription = !!repo.description && repo.description.trim().length > 5;
        const hasLanguage = !!repo.language;
        const isNotFork = !repo.fork;
        
        return hasDescription && hasLanguage && isNotFork;
      })
      .map(repo => ({
        id: repo.id,
        name: repo.name,
        description: repo.description,
        language: repo.language,
        url: repo.html_url,
        stars: repo.stargazers_count,
        updated_at: repo.updated_at,
        topics: repo.topics || []
      }));

    // Respond with categorized and filtered portfolio data
    res.json({
      username: githubResponse.data[0]?.owner?.login || 'builder',
      projects: filteredRepos,
      total_count: filteredRepos.length
    });

  } catch (err) {
    console.error('GitHub Portfolio Error:', err.message);
    res.status(500).json({ error: 'Failed to synchronize with GitHub API' });
  }
});

module.exports = router;
