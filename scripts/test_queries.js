const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const user1 = 'ad61618a-4933-4af9-ae3d-24ed0aaffbd6'; // From user error
  const user2 = '523fe75d-4866-4e01-ad80-971ddd04f06f';
  
  console.log('--- TEST 1: Simple Select ---');
  const { error: e1 } = await supabase.from('dm_rooms').select('*').limit(1);
  console.log('Simple select:', e1 ? e1.message : 'OK');

  console.log('--- TEST 2: Select with Joins (Old Syntax) ---');
  const { error: e2 } = await supabase.from('dm_rooms').select('*, user1:profiles(username), user2:profiles(username)').limit(1);
  console.log('Joins (Old):', e2 ? e2.message : 'OK');

  console.log('--- TEST 3: Select with Joins (Explicit FK) ---');
  const { error: e3 } = await supabase.from('dm_rooms').select('*, user1:profiles!user1_id(username), user2:profiles!user2_id(username)').limit(1);
  console.log('Joins (Explicit FK):', e3 ? e3.message : 'OK');

  console.log('--- TEST 4: Advanced OR Filter ---');
  const { error: e4 } = await supabase.from('dm_rooms').select('*')
    .or(`and(user1_id.eq.${user1},user2_id.eq.${user2}),and(user1_id.eq.${user2},user2_id.eq.${user1})`)
    .limit(1);
  console.log('Advanced OR Filter:', e4 ? e4.message : 'OK');
}

check();
