const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://trnfhlmwmagsdhabswsl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybmZobG13bWFnc2RoYWJzd3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTc5NjUsImV4cCI6MjA4OTA3Mzk2NX0.k70D6gXb2eDF1raEodQFlk8vnQ5qNlw--fZVrMYmwwA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function auditUser() {
  console.log('--- USER DATA AUDIT ---');
  const targetUsername = 'testuser1';

  // 1. Check Profiles table
  const { data: profile, error: pError } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', targetUsername)
    .maybeSingle();

  if (pError) console.log('Profiles Error:', pError.message);
  else if (profile) {
    console.log('[PROFILES] avatar_url:', profile.avatar_url);
    console.log('[PROFILES] id:', profile.id);
  } else {
    console.log('[PROFILES] Not found for', targetUsername);
  }

  // 2. Check Users table (if exists)
  const { data: userTable, error: uError } = await supabase
    .from('users')
    .select('*')
    .eq('username', targetUsername)
    .maybeSingle();

  if (uError) console.log('Users Table Error:', uError.message);
  else if (userTable) {
    console.log('[USERS TABLE] avatar_url:', userTable.avatar_url);
  } else {
    console.log('[USERS TABLE] Not found for', targetUsername);
  }

  // 3. Check Posts table (most recent post)
  const { data: posts, error: postError } = await supabase
    .from('posts')
    .select('username, avatar_url, project_id')
    .eq('username', targetUsername)
    .order('created_at', { ascending: false })
    .limit(1);

  if (postError) console.log('Posts Error:', postError.message);
  else if (posts && posts.length > 0) {
    console.log('[POSTS] Latest avatar_url:', posts[0].avatar_url);
  }
}

auditUser();
