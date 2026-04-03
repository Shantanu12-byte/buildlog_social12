const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { cleanText, isFiltered } = require('../utils/contentFilter');

/**
 * POST /api/chat/clean
 * Sanitizes the provided text (requires authentication).
 */
router.post('/clean', authMiddleware, (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  const cleaned = cleanText(text);
  const wasFiltered = isFiltered(text);

  res.json({
    original: text,
    cleaned,
    wasFiltered
  });
});

module.exports = router;
