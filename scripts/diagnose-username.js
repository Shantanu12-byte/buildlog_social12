const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://trnfhlmwmagsdhabswsl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybmZobG13bWFnc2RoYWJzd3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTc5NjUsImV4cCI6MjA4OTA3Mzk2NX0.k70D6gXb2eDF1raEodQFlk8vnQ5qNlw--fZVrMYmwwA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function diagnose() {
  const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
  if (error) { console.error(error); return; }
  
  data.forEach((p, i) => {
    console.log(`POST ${i+1}: ID=${p.id.substring(0,8)}, username=${p.username} (type=${typeof p.username}), profiles_username=${p.profiles?.username}`);
  });
}

diagnose();
