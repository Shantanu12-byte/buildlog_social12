const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://trnfhlmwmagsdhabswsl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybmZobG13bWFnc2RoYWJzd3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTc5NjUsImV4cCI6MjA4OTA3Mzk2NX0.k70D6gXb2eDF1raEodQFlk8vnQ5qNlw--fZVrMYmwwA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function generateSQL() {
  const { data, error } = await supabase.from('posts').select('id, caption').order('created_at', { ascending: false });
  if (error) { console.error(error); return; }
  
  const DUMMY_SUBSTRINGS = [
    'Glassmorphism', '100k requests', 'render pipeline', 'Building this for my own', 'Automation is the only', 'Accidentally deleted'
  ];

  const dummyIds = data.filter(p => DUMMY_SUBSTRINGS.some(s => p.caption.includes(s))).map(p => p.id);
  
  console.log('-- 1. Reset everything to NULL');
  console.log('UPDATE public.posts SET username = NULL;');
  
  console.log('\n-- 2. Apply diverse names ONLY to confirmed dummy posts');
  const USERNAMES = ['pixel_pioneer', 'backend_boss', 'rust_renegade', 'coffee_coder', 'git_guru'];
  
  dummyIds.forEach((id, i) => {
    console.log(`UPDATE public.posts SET username = '${USERNAMES[i % USERNAMES.length]}' WHERE id = '${id}';`);
  });
  
  console.log('\n-- 3. Verify');
  console.log('SELECT id, username, caption FROM public.posts;');
}

generateSQL();
