const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://trnfhlmwmagsdhabswsl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybmZobG13bWFnc2RoYWJzd3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTc5NjUsImV4cCI6MjA4OTA3Mzk2NX0.k70D6gXb2eDF1raEodQFlk8vnQ5qNlw--fZVrMYmwwA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function syncUsers() {
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
  if (pErr) { console.error(pErr); return; }
  
  console.log(`Syncing ${profiles.length} profiles...`);
  
  for (const p of profiles) {
    const { error: uErr } = await supabase.from('users').upsert({
      id: p.id,
      username: p.username,
      bio: p.bio,
      avatar_url: p.avatar_url,
      created_at: p.created_at
    });
    if (uErr) console.error(`Failed to sync ${p.username}:`, uErr.message);
    else console.log(`Synced ${p.username}`);
  }
}

syncUsers();
