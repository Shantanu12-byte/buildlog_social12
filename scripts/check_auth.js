const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://trnfhlmwmagsdhabswsl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybmZobG13bWFnc2RoYWJzd3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTc5NjUsImV4cCI6MjA4OTA3Mzk2NX0.k70D6gXb2eDF1raEodQFlk8vnQ5qNlw--fZVrMYmwwA';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (session) {
    console.log(JSON.stringify(session.user.user_metadata, null, 2));
  } else {
    console.log('No active session found in script environment.');
  }
}
check();
