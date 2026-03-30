const express = require('express');
const router = express.Router();
const pushController = require('../controllers/pushNotificationController');

router.post('/subscribe', pushController.subscribe);
router.post('/test', pushController.sendTestNotification);
router.post('/notify/hype', pushController.notifyHype);
router.post('/notify/follow', pushController.notifyFollow);
router.post('/notify/chat', pushController.notifyChat);

module.exports = router;
