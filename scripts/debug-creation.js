const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://trnfhlmwmagsdhabswsl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybmZobG13bWFnc2RoYWJzd3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTc5NjUsImV4cCI6MjA4OTA3Mzk2NX0.k70D6gXb2eDF1raEodQFlk8vnQ5qNlw--fZVrMYmwwA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testCreation() {
  console.log('--- TESTING CREATION ---');
  
  // 1. Get a user
  const { data: profiles } = await supabase.from('profiles').select('id, username').limit(1);
  const user = profiles[0];
  console.log(`Using user: ${user.username} (${user.id})`);

  // 2. Try to create a project
  console.log('Inserting project...');
  const { data: proj, error: projErr } = await supabase.from('projects').insert({
    user_id: user.id,
    title: 'DEBUG_PROJECT_' + Date.now(),
    status: 'active'
  }).select().single();

  if (projErr) {
    console.error('PROJECT_ERROR:', projErr.message);
    return;
  }
  console.log('Project created:', proj.id);

  // 3. Try to create a post
  console.log('Inserting post...');
  const { error: postErr } = await supabase.from('posts').insert({
    author_id: user.id,
    user_id: user.id,
    project_id: proj.id,
    username: 'DEBUG_USER',
    caption: 'This is a debug post.'
  });

  if (postErr) {
    console.error('POST_ERROR:', postErr.message);
  } else {
    console.log('Post created successfully!');
  }
}

testCreation();
