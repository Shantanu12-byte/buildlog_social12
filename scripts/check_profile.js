const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://trnfhlmwmagsdhabswsl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybmZobG13bWFnc2RoYWJzd3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTc5NjUsImV4cCI6MjA4OTA3Mzk2NX0.k70D6gXb2eDF1raEodQFlk8vnQ5qNlw--fZVrMYmwwA';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  console.log(JSON.stringify(data, null, 2));
}
check();
