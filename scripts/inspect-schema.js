const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://trnfhlmwmagsdhabswsl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybmZobG13bWFnc2RoYWJzd3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTc5NjUsImV4cCI6MjA4OTA3Mzk2NX0.k70D6gXb2eDF1raEodQFlk8vnQ5qNlw--fZVrMYmwwA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspect() {
  console.log('--- INSPECTING POSTS TABLE ---');
  
  // Fetch one row to see keys
  const { data, error } = await supabase.from('posts').select('*').limit(1);
  
  if (error) {
    console.error('Error fetching posts:', error.message);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('Columns found in a post:', Object.keys(data[0]));
  } else {
    console.log('No posts found to inspect.');
  }
}

inspect();
