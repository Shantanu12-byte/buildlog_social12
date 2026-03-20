const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  try {
    const { data, error } = await supabase.from('dm_rooms').select('*').limit(1);
    if (error) {
      console.error('Error fetching dm_rooms:', error);
    } else {
      console.log('Columns in dm_rooms:', Object.keys(data[0] || {}));
      console.log('Sample data:', data[0]);
    }
  } catch (e) {
    console.error('Unexpected error:', e);
  }
}

check();
