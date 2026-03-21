const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://trnfhlmwmagsdhabswsl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybmZobG13bWFnc2RoYWJzd3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTc5NjUsImV4cCI6MjA4OTA3Mzk2NX0.k70D6gXb2eDF1raEodQFlk8vnQ5qNlw--fZVrMYmwwA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testCycle() {
  const { data: fetch1 } = await supabase.from('posts').select('id, username').limit(1);
  const targetId = fetch1[0].id;
  console.log(`Initial: ID=${targetId}, username=${fetch1[0].username}`);
  
  const testVal = 'TEST_USER_' + Date.now();
  console.log(`Updating to: ${testVal}`);
  
  const { error: updateErr } = await supabase.from('posts').update({ username: testVal }).eq('id', targetId);
  if (updateErr) { console.error('UpdateErr:', updateErr.message); return; }
  
  const { data: fetch2 } = await supabase.from('posts').select('id, username').eq('id', targetId).single();
  console.log(`Final: ID=${fetch2.id}, username=${fetch2.username}`);
}

testCycle();
