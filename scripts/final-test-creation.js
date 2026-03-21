const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://trnfhlmwmagsdhabswsl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybmZobG13bWFnc2RoYWJzd3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTc5NjUsImV4cCI6MjA4OTA3Mzk2NX0.k70D6gXb2eDF1raEodQFlk8vnQ5qNlw--fZVrMYmwwA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function finalTest() {
  const { data: users } = await supabase.from('users').select('id, username').limit(1);
  if (!users || users.length === 0) { console.error('No users found in users table!'); return; }
  
  const testUser = users[0];
  console.log(`Testing with user: ${testUser.username}`);

  // Create Project
  const { data: proj, error: projErr } = await supabase.from('projects').insert({
    user_id: testUser.id,
    title: 'FINAL_TEST_PROJ',
    status: 'active'
  }).select().single();

  if (projErr) { console.error('PROJ_ERR:', projErr.message); return; }
  console.log('Project created:', proj.id);

  // Create Post
  const { error: postErr } = await supabase.from('posts').insert({
    author_id: testUser.id,
    user_id: testUser.id,
    project_id: proj.id,
    username: testUser.username,
    caption: 'Final test from script'
  });

  if (postErr) { console.error('POST_ERR:', postErr.message); }
  else { console.log('ALL CREATED SUCCESSFULLY!'); }
}

finalTest();
