const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

webpush.setVapidDetails(
  'mailto:support@buildlog.sooty',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

async function subscribe(req, res) {
  const { userId, subscription } = req.body;

  if (!userId || !subscription) {
    return res.status(400).json({ error: 'userId and subscription are required' });
  }

  try {
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({ user_id: userId, subscription }, { onConflict: 'user_id,subscription' });

    if (error) throw error;

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Error saving subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function sendPushNotification(userId, title, body, url = '/') {
  try {
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId);

    if (error) throw error;

    const payload = JSON.stringify({
      title,
      body,
      url,
    });

    const notifications = (subscriptions || []).map(sub => 
      webpush.sendNotification(sub.subscription, payload).catch(err => {
        if (err.statusCode === 404 || err.statusCode === 410) {
          // Subscription expired or invalid, remove it
          return supabase.from('push_subscriptions').delete().match({ subscription: sub.subscription });
        }
        console.error('Error sending push notification:', err);
      })
    );

    await Promise.all(notifications);
  } catch (error) {
    console.error('Error in sendPushNotification:', error);
  }
}

async function notifyHype(req, res) {
  const { targetUserId, hypedByUsername, postTitle } = req.body;
  if (!targetUserId || !hypedByUsername) return res.status(400).json({ error: 'Missing data' });

  await sendPushNotification(
    targetUserId, 
    'New Hype! ⚡', 
    `@${hypedByUsername} hyped your post: ${postTitle || 'Untitled'}`,
    '/(tabs)/profile' // Link to profile
  );
  res.json({ success: true });
}

async function notifyFollow(req, res) {
  const { targetUserId, followerUsername } = req.body;
  if (!targetUserId || !followerUsername) return res.status(400).json({ error: 'Missing data' });

  await sendPushNotification(
    targetUserId, 
    'New Follower! 👤', 
    `@${followerUsername} is now following your buildlog.`,
    '/(tabs)/profile'
  );
  res.json({ success: true });
}

async function sendTestNotification(req, res) {
    const { userId } = req.body;
    await sendPushNotification(userId, 'Test Notification', 'It works! 🚀');
    res.json({ success: true });
}

async function notifyChat(req, res) {
  const { targetUserIds, senderUsername, roomName, message } = req.body;
  if (!targetUserIds || !senderUsername || !roomName || !targetUserIds.length) {
    return res.status(400).json({ error: 'Missing data' });
  }

  const notifications = targetUserIds.map(userId => 
    sendPushNotification(
      userId,
      `New message in ${roomName}`,
      `@${senderUsername}: ${message}`,
      '/(tabs)/tavern'
    )
  );
  
  await Promise.all(notifications);
  res.json({ success: true });
}

module.exports = {
  subscribe,
  sendPushNotification,
  sendTestNotification,
  notifyHype,
  notifyFollow,
  notifyChat,
};
