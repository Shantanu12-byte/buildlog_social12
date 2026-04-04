const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');
const { sendPushNotification } = require('../controllers/pushNotificationController');
const axios = require('axios');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fetchTopStory() {
  try {
    const res = await axios.get('https://hacker-news.firebaseio.com/v0/topstories.json');
    const topId = res.data[0];
    const storyRes = await axios.get(`https://hacker-news.firebaseio.com/v0/item/${topId}.json`);
    return storyRes.data;
  } catch (err) {
    console.error('Error fetching story for daily news:', err);
    return null;
  }
}

async function broadcastDailyNews() {
  console.log('[Cron] Starting Daily News Broadcast...');
  const story = await fetchTopStory();
  if (!story) return;

  const title = `Daily Dev News: ${story.title}`;
  const body = `Stay updated, Builder! Here is what's trending on Hacker News today.`;
  const url = story.url || `https://news.ycombinator.com/item?id=${story.id}`;

  try {
    // Fetch all users with at least one push token (Web or Expo)
    const { data: usersWithExpo } = await supabase
      .from('profiles')
      .select('id')
      .not('expo_push_token', 'is', null);

    const { data: usersWithWeb } = await supabase
      .from('push_subscriptions')
      .select('user_id');

    const userIds = new Set([
      ...(usersWithExpo || []).map(u => u.id),
      ...(usersWithWeb || []).map(u => u.user_id)
    ]);

    console.log(`[Cron] Sending news to ${userIds.size} users.`);

    for (const userId of userIds) {
      await sendPushNotification(userId, title, body, url);
    }
    
    console.log('[Cron] Daily News Broadcast completed successfully.');
  } catch (err) {
    console.error('[Cron] Broadcast failed:', err);
  }
}

function initDailyNews() {
  // Run every morning at 9:00 AM
  cron.schedule('0 9 * * *', broadcastDailyNews);
}

module.exports = { initDailyNews, broadcastDailyNews };
