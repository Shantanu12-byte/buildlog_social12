const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://trnfhlmwmagsdhabswsl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybmZobG13bWFnc2RoYWJzd3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTc5NjUsImV4cCI6MjA4OTA3Mzk2NX0.k70D6gXb2eDF1raEodQFlk8vnQ5qNlw--fZVrMYmwwA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function generateSQL() {
  const { data, error } = await supabase.from('posts').select('id, username, caption').order('created_at', { ascending: false });
  if (error) { console.error(error); return; }
  
  console.log('-- 1. Reset all usernames to NULL (restore profile names)');
  console.log('UPDATE public.posts SET username = NULL;');
  
  console.log('\n-- 2. Re-apply diverse names ONLY to the confirmed AI/dummy posts');
  const DUMMY_KEYWORDS = ['glosscut', 'Glassmorphism', '100k requests', 'render pipeline', 'Building this for my own', 'Automation is the only', 'Accidentally deleted'];
  const USERNAMES = ['pixel_pioneer', 'backend_boss', 'rust_renegade', 'coffee_coder', 'git_guru', 'dev_wizard'];

  let dummyCount = 0;
  data.forEach((p) => {
    const isDummy = DUMMY_KEYWORDS.some(k => p.caption.includes(k));
    if (isDummy) {
      console.log(`UPDATE public.posts SET username = '${USERNAMES[dummyCount % USERNAMES.length]}' WHERE id = '${p.id}'; -- "${p.caption.substring(0, 20)}..."`);
      dummyCount++;
    }
  });

  console.log('\n-- 3. Verify status');
  console.log('SELECT id, username, caption FROM public.posts;');
}

generateSQL();
