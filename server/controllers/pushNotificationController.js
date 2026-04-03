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

  if (!userId || !subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'userId and subscription are required' });
  }

  try {
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({ 
        user_id: userId, 
        subscription: subscription,
        endpoint: subscription.endpoint
      }, { onConflict: 'endpoint' });

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
  const { roomId, senderUsername, roomName, message } = req.body;
  const senderId = req.user.id; // From authMiddleware

  if (!roomId || !senderUsername || !roomName || !message) {
    return res.status(400).json({ error: 'Missing data' });
  }

  try {
    // 1. Fetch room members on the server (Privacy: client no longer sees all IDs)
    const { data: members, error } = await supabase
      .from('room_members')
      .select('user_id')
      .eq('room_id', roomId);

    if (error) throw error;

    // 2. Filter out the sender
    const targetUserIds = (members || [])
      .map(m => m.user_id)
      .filter(id => id !== senderId);

    if (targetUserIds.length === 0) {
      return res.json({ success: true, message: 'No other members to notify' });
    }

    // 3. Send notifications
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
  } catch (err) {
    console.error('notifyChat error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  subscribe,
  sendPushNotification,
  sendTestNotification,
  notifyHype,
  notifyFollow,
  notifyChat,
};
