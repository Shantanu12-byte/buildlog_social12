const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');
const { sendPushNotification } = require('../controllers/pushNotificationController');
const axios = require('axios');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Key stored in DB to track "already sent today"
const NEWS_SENT_KEY = 'daily_news_sent';
const CHALLENGE_SENT_KEY = 'daily_challenge_sent';

async function hasAlreadySentToday(key) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', key)
    .single();

  return data?.value === today;
}

async function markSentToday(key) {
  const today = new Date().toISOString().split('T')[0];
  await supabase
    .from('app_settings')
    .upsert({ key, value: today }, { onConflict: 'key' });
}

async function getAllUserIds() {
  const { data: usersWithExpo } = await supabase
    .from('profiles')
    .select('id')
    .not('expo_push_token', 'is', null);

  const { data: usersWithWeb } = await supabase
    .from('push_subscriptions')
    .select('user_id');

  return new Set([
    ...(usersWithExpo || []).map(u => u.id),
    ...(usersWithWeb || []).map(u => u.user_id)
  ]);
}

async function fetchTopStory() {
  try {
    const res = await axios.get('https://hacker-news.firebaseio.com/v0/topstories.json');
    const topId = res.data[0];
    const storyRes = await axios.get(`https://hacker-news.firebaseio.com/v0/item/${topId}.json`);
    return storyRes.data;
  } catch (err) {
    return null;
  }
}

async function broadcastDailyNews() {
  // Guard: only send once per day
  if (await hasAlreadySentToday(NEWS_SENT_KEY)) return;

  const story = await fetchTopStory();
  if (!story) return;

  const title = `Daily Dev News 📰`;
  const body = `Today's Top Story: ${story.title}`;
  const url = story.url || `https://news.ycombinator.com/item?id=${story.id}`;

  const userIds = await getAllUserIds();
  for (const userId of userIds) {
    await sendPushNotification(userId, title, body, url);
  }

  await markSentToday(NEWS_SENT_KEY);
}

async function broadcastDailyChallenge() {
  // Guard: only send once per day
  if (await hasAlreadySentToday(CHALLENGE_SENT_KEY)) return;

  // Fetch today's challenge from DB
  const today = new Date().toISOString().split('T')[0];
  const { data: daily } = await supabase
    .from('daily_challenges')
    .select('problem_id, problems(title, difficulty)')
    .eq('date', today)
    .single();

  const problemTitle = daily?.problems?.title || 'a new coding challenge';
  const difficulty = daily?.problems?.difficulty || 'Medium';

  const title = `Daily Challenge 🚀`;
  const body = `Today's problem: "${problemTitle}" [${difficulty}] — Keep your streak alive!`;
  const url = 'buildlog://challenges';

  const userIds = await getAllUserIds();
  for (const userId of userIds) {
    await sendPushNotification(userId, title, body, url);
  }

  await markSentToday(CHALLENGE_SENT_KEY);
}

function initDailyNotifications() {
  // News at 9:00 AM every day
  cron.schedule('0 9 * * *', broadcastDailyNews);
  // Challenges at 8:00 AM every day
  cron.schedule('0 8 * * *', broadcastDailyChallenge);
}

module.exports = { initDailyNotifications, broadcastDailyNews, broadcastDailyChallenge };
