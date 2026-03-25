const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://trnfhlmwmagsdhabswsl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybmZobG13bWFnc2RoYWJzd3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTc5NjUsImV4cCI6MjA4OTA3Mzk2NX0.k70D6gXb2eDF1raEodQFlk8vnQ5qNlw--fZVrMYmwwA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkNullable() {
  console.log('--- POSTS TABLE SCHEMA CHECK ---');
  // We can't directly check nullable via anon key easily without RPC, 
  // so we'll try to insert a dummy post with null project_id (don't worry, we won't actually commit if it fails)
  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: '00000000-0000-0000-0000-000000000000', // Dummy
      author_id: '00000000-0000-0000-0000-000000000000',
      username: 'audit_bot',
      project_id: null,
      projectTitle: null,
      caption: 'audit test',
      image_url: 'https://example.com/test.jpg'
    })
    .select();

  if (error) {
    console.log('Insert with NULL project failed:', error.message);
    if (error.message.includes('violates not-null constraint')) {
       console.log('RESULT: project_id is NOT NULL (Needs migration)');
    } else {
       console.log('RESULT: Different error (probably auth/FK), check message.');
    }
  } else {
    console.log('Insert with NULL project SUCCEEDED!');
    console.log('RESULT: project_id is already nullable.');
    // Cleanup
    await supabase.from('posts').delete().eq('id', data[0].id);
  }
}

checkNullable();
