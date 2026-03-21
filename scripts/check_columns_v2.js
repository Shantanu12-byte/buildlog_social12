const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  try {
    const { data, error } = await supabase.from('dm_rooms').select('*').limit(1);
    if (error) {
      console.error('Error fetching dm_rooms:', error);
      console.error('Hint: The table might exist but the current user might not have select permission.');
    } else {
      console.log('Columns in dm_rooms:', Object.keys(data[0] || {}));
      console.log('Sample data:', data[0]);
    }
    
    // Check if updated_at or last_message_at exists via info query if possible
    // Since we don't have direct SQL, we just try a select of those specific columns
    const { data: d2, error: e2 } = await supabase.from('dm_rooms').select('last_message_at').limit(1);
    console.log('last_message_at existence check:', e2 ? 'FAIL' : 'OK');
    
    const { data: d3, error: e3 } = await supabase.from('dm_rooms').select('updated_at').limit(1);
    console.log('updated_at existence check:', e3 ? 'FAIL' : 'OK');

  } catch (e) {
    console.error('Unexpected error:', e);
  }
}

check();
