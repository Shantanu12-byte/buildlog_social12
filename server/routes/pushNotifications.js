const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const pushController = require('../controllers/pushNotificationController');

router.post('/subscribe', authMiddleware, pushController.subscribe);
router.post('/test', authMiddleware, pushController.sendTestNotification);
router.post('/notify/hype', authMiddleware, pushController.notifyHype);
router.post('/notify/follow', authMiddleware, pushController.notifyFollow);
router.post('/notify/chat', authMiddleware, pushController.notifyChat);
router.get('/trigger-news', (req, res) => {
  const { broadcastDailyNews } = require('../cron/dailyNews');
  broadcastDailyNews();
  res.json({ success: true, message: 'News broadcast triggered' });
});

module.exports = router;
