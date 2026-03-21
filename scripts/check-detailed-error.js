const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://trnfhlmwmagsdhabswsl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybmZobG13bWFnc2RoYWJzd3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTc5NjUsImV4cCI6MjA4OTA3Mzk2NX0.k70D6gXb2eDF1raEodQFlk8vnQ5qNlw--fZVrMYmwwA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkDetailedError() {
  console.log('--- DETAILED ERROR CHECK ---');
  // Attempt to insert into ANY of the potentially confusing columns
  const { error } = await supabase.from('posts').insert({
    author_id: '327371c6-26f1-4c78-9694-8bf26c3614cd',
    user_id: '327371c6-26f1-4c78-9694-8bf26c3614cd',
    caption: 'test'
  });
  
  if (error) {
    console.log('--- ERROR OBJECT ---');
    console.log(JSON.stringify(error, null, 2));
  } else {
    console.log('Success!');
  }
}

checkDetailedError();
