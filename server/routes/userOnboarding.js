/**
 * server/routes/userOnboarding.js — Username Validation Endpoint
 *
 * POST /api/user/validate-username
 * Sanitizes the incoming username, checks Supabase for duplicates,
 * and returns { available: boolean, sanitized: string }.
 */

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Sanitization (mirrors lib/sanitize.ts on the client) ─────
function sanitizeUsername(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 20);
}

function isValidUsername(username) {
  return /^[a-z0-9_]{3,20}$/.test(username);
}

// ── POST /validate-username ──────────────────────────────────
router.post('/validate-username', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || typeof username !== 'string') {
      return res.status(400).json({
        available: false,
        error: 'Username is required.',
        sanitized: '',
      });
    }

    const sanitized = sanitizeUsername(username);

    if (!isValidUsername(sanitized)) {
      return res.status(400).json({
        available: false,
        error: 'Username must be 3–20 characters (letters, numbers, underscores only).',
        sanitized,
      });
    }

    // Query Supabase profiles table for an existing match
    const { data, error: dbError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', sanitized)
      .maybeSingle();

    if (dbError) {
      console.error('Username validation DB error:', dbError);
      return res.status(500).json({
        available: false,
        error: 'Server error. Please try again.',
        sanitized,
      });
    }

    const available = !data; // null means no match → available

    return res.json({ available, sanitized });
  } catch (err) {
    console.error('Username validation error:', err.message);
    return res.status(500).json({
      available: false,
      error: 'Internal server error.',
      sanitized: '',
    });
  }
});

module.exports = router;
