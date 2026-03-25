const express = require('express');
const router = express.Router();
const { cleanText, isFiltered } = require('../utils/contentFilter');

/**
 * POST /api/chat/clean
 * Sanitizes the provided text.
 */
router.post('/clean', (req, res) => {
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
