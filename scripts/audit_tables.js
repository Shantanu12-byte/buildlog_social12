const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://trnfhlmwmagsdhabswsl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybmZobG13bWFnc2RoYWJzd3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTc5NjUsImV4cCI6MjA4OTA3Mzk2NX0.k70D6gXb2eDF1raEodQFlk8vnQ5qNlw--fZVrMYmwwA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
  console.log('--- TABLE AUDIT ---');
  
  const tables = ['profiles', 'followers', 'notifications', 'dm_rooms', 'messages', 'posts', 'quest_logs'];
  
  for (const table of tables) {
    const { data, error, count } = await supabase.from(table).select('id', { count: 'exact', head: true }).limit(1);
    if (error) {
      console.log(`[ ] ${table}: ERROR (${error.message})`);
    } else {
      console.log(`[x] ${table}: OK (Count: ${count})`);
    }
  }
}

checkTables();
