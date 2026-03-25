const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://trnfhlmwmagsdhabswsl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybmZobG13bWFnc2RoYWJzd3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTc5NjUsImV4cCI6MjA4OTA3Mzk2NX0.k70D6gXb2eDF1raEodQFlk8vnQ5qNlw--fZVrMYmwwA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkFKs() {
  console.log('--- CHECKING FOREIGN KEYS (METADATA) ---');
  
  // We can query the information_schema via RPC if possible, 
  // but if not, let's just try every likely column name as a join
  
  const possibleJoins = [
    'posts(count)',
    'posts!user_id(count)',
    'posts!id(count)',
    'posts!author_id(count)',
    'posts!username(count)'
  ];

  for (const join of possibleJoins) {
    console.log(`Trying: ${join}`);
    const { error } = await supabase.from('profiles').select(`*, ${join}`).limit(1);
    if (error) {
      console.log(`  ❌ Failed: ${error.message}`);
    } else {
      console.log(`  ✅ Success!`);
    }
  }
}

checkFKs();
