const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://trnfhlmwmagsdhabswsl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybmZobG13bWFnc2RoYWJzd3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTc5NjUsImV4cCI6MjA4OTA3Mzk2NX0.k70D6gXb2eDF1raEodQFlk8vnQ5qNlw--fZVrMYmwwA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
  console.log('--- TABLE AUDIT ---');
  
  const { data, error } = await supabase.from('posts').select('*').limit(1).single();
  if (error) {
    console.log(`[ ] posts: ERROR (${error.message})`);
  } else {
    console.log('[x] posts: OK');
    console.log('--- COLUMNS ---');
    Object.keys(data).forEach(key => console.log(key));
    console.log('--- SAMPLE DATA ---');
    console.log(JSON.stringify(data, null, 2));
  }
}

checkTables();
