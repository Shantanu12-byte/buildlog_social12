/**
 * server/routes/userRoutes.js — User Profile Routes
 *
 * GET /api/user/profile/:username — Consolidated profile data endpoint
 */

const express = require('express');
const router = express.Router();
const { getProfileByUsername } = require('../controllers/profileViewController');

const { deleteUserAccount } = require('../controllers/profileViewController');
const { setCampus } = require('../controllers/userController');

// ── GET /:username — Fetch full profile payload ──────────────
router.get('/:username', getProfileByUsername);

// ── POST /set-campus — Permanent Campus Lock ─────────────────
router.post('/set-campus', setCampus);

// ── POST /invalidate — Clear cache for a user ────────────────
// Should be called after a profile update.
const { invalidateProfileCache } = require('../controllers/profileViewController');
router.post('/invalidate', invalidateProfileCache);

module.exports = router;
