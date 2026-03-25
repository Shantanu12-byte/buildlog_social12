const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://trnfhlmwmagsdhabswsl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybmZobG13bWFnc2RoYWJzd3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTc5NjUsImV4cCI6MjA4OTA3Mzk2NX0.k70D6gXb2eDF1raEodQFlk8vnQ5qNlw--fZVrMYmwwA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyQuery() {
  console.log('--- VERIFYING CORRECTED QUERY ---');
  
  // Try the corrected join syntax
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      posts_count:posts!author_id(count),
      following_count:followers!follower_id(count),
      followers_count:followers!following_id(count)
    `)
    .eq('username', 'testuser1')
    .single();

  if (error) {
    console.log('Query Error:', error.message);
  } else {
    console.log('Query Success!');
    console.log('Data:', JSON.stringify(data, null, 2));
  }
}

verifyQuery();
