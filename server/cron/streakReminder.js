const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');
const { sendPushNotification } = require('../controllers/pushNotificationController');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function initStreakReminder() {
  // Run every day at 8:00 PM (20:00)
  // Format: second minute hour day-of-month month day-of-week
  cron.schedule('0 0 20 * * *', async () => {
    console.log('Running 8 PM Streak Reminder...');
    
    try {
      // 1. Get all profiles
      const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('id, username, streak_count');

      if (pError) throw pError;

      const today = new Date().toISOString().split('T')[0];

      for (const profile of profiles) {
        // 2. Check if user has posted today
        const { data: posts, error: postError } = await supabase
          .from('posts')
          .select('id')
          .eq('user_id', profile.id)
          .gte('created_at', today)
          .limit(1);

        if (postError) {
          console.error(`Error checking posts for ${profile.username}:`, postError);
          continue;
        }

        // 3. If no posts today, send reminder
        if (posts.length === 0) {
          console.log(`Sending streak reminder to @${profile.username}`);
          await sendPushNotification(
            profile.id,
            'Don\'t lose your streak! 🔥',
            `You haven't posted yet today. Log a build to keep your ${profile.streak_count || 0} day streak alive!`,
            '/(tabs)/index'
          );
        }
      }
    } catch (error) {
      console.error('Streak Reminder Error:', error);
    }
  });
  
  console.log('Streak reminder cron scheduled for 8:00 PM daily.');
}

module.exports = { initStreakReminder };
