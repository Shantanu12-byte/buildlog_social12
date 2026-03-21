const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://trnfhlmwmagsdhabswsl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybmZobG13bWFnc2RoYWJzd3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTc5NjUsImV4cCI6MjA4OTA3Mzk2NX0.k70D6gXb2eDF1raEodQFlk8vnQ5qNlw--fZVrMYmwwA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function updatePosts() {
  console.log('--- UPDATING ALL POSTS ---');
  
  const { data: posts, error: fetchErr } = await supabase.from('posts').select('id, caption');
  if (fetchErr) {
    console.error('Fetch error:', fetchErr);
    return;
  }
  
  const USERNAMES = ['pixel_punk', 'backend_boss', 'rust_ace', 'data_wiz', 'go_getter'];
  
  for (let i = 0; i < posts.length; i++) {
    const randomUser = USERNAMES[i % USERNAMES.length];
    console.log(`Updating post ${posts[i].id} with username ${randomUser}...`);
    
    const { error: updateErr } = await supabase
      .from('posts')
      .update({ username: randomUser })
      .eq('id', posts[i].id);
      
    if (updateErr) {
      console.error(`Update error for ${posts[i].id}:`, updateErr.message);
    }
  }
  
  console.log('--- UPDATE COMPLETE ---');
}

updatePosts();
