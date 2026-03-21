const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://trnfhlmwmagsdhabswsl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybmZobG13bWFnc2RoYWJzd3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTc5NjUsImV4cCI6MjA4OTA3Mzk2NX0.k70D6gXb2eDF1raEodQFlk8vnQ5qNlw--fZVrMYmwwA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkColumns() {
  // We can use a trick: query a non-existent table to see if we have access to metadata? 
  // No, let's use a simple SELECT and check the keys of a result (even empty). 
  // But wait, the table is empty! 
  
  // Let's try to query the columns using POSTGRES RPC if available? 
  // No, let's try to fetch a row from any table that has rows and see metadata? 
  
  // I'll try to use the .select() with a non-existent column to see the error message 
  // which often lists available columns.
  const { error } = await supabase.from('posts').select('non_existent_column').limit(1);
  if (error) {
    console.log(error.message);
  }
}

checkColumns();
