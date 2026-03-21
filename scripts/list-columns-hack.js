const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://trnfhlmwmagsdhabswsl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybmZobG13bWFnc2RoYWJzd3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTc5NjUsImV4cCI6MjA4OTA3Mzk2NX0.k70D6gXb2eDF1raEodQFlk8vnQ5qNlw--fZVrMYmwwA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function listColumns() {
  console.log('--- LISTING COLUMNS OF POSTS TABLE ---');
  // We can't query information_schema via standard supabase-js .from() 
  // unless we have a RPC or it's public. 
  // Let's try to insert a fake post and catch the error.
  const { error } = await supabase.from('posts').insert({
      id: '00000000-0000-0000-0000-000000000000',
      username: 'test'
  });
  
  if (error) {
    console.log('Error code:', error.code);
    console.log('Error message:', error.message);
  } else {
    console.log('No error - column likely exists!');
    // Delete the fake post
    await supabase.from('posts').delete().eq('id', '00000000-0000-0000-0000-000000000000');
  }
}

listColumns();
