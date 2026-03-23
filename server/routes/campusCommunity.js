const express = require('express');
const router = express.Router();

const ALLOWED_CAMPUSES = ['ram_meghe_eng', 'sipna_eng'];

router.post('/join', async (req, res) => {
  const { userId, campusId } = req.body;
  
  if (!userId || !campusId) {
    return res.status(400).json({ error: 'Missing userId or campusId' });
  }

  if (!ALLOWED_CAMPUSES.includes(campusId)) {
    return res.status(403).json({ error: 'Unauthorized campus selection. Only Prof Ram Meghe and Sipna College of Engineering are permitted.' });
  }

  // Here you would typically verify the user's profile data against the database to secure it further.
  // We'll just return a success message now.
  return res.json({
    success: true,
    message: `Successfully joined ${campusId}`
  });
});

module.exports = router;
