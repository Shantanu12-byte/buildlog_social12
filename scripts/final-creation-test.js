const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://trnfhlmwmagsdhabswsl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybmZobG13bWFnc2RoYWJzd3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTc5NjUsImV4cCI6MjA4OTA3Mzk2NX0.k70D6gXb2eDF1raEodQFlk8vnQ5qNlw--fZVrMYmwwA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function finalCreationTest() {
  const { data: users } = await supabase.from('users').select('id, username').limit(1);
  const user = users[0];
  console.log(`User: ${user.username} (${user.id})`);

  // 1. Create Project
  const { data: proj, error: projErr } = await supabase.from('projects').insert({
    user_id: user.id,
    title: 'PROJ_' + Date.now()
  }).select().single();

  if (projErr) { console.error('PROJ_ERR:', projErr.message); return; }
  console.log('Project ID:', proj.id);

  // 2. Create Post
  const { error: postErr } = await supabase.from('posts').insert({
    author_id: user.id,
    user_id: user.id,
    project_id: proj.id,
    username: 'test_diver',
    caption: 'Test diversification',
    projectTitle: 'STUPID_KEYBOARD_CASE_TEST'
  });

  if (postErr) {
    console.log('--- POST_ERR DETAILS ---');
    console.log(postErr);
  } else {
    console.log('ALL WORKED!');
  }
}

finalCreationTest();
