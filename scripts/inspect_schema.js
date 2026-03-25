const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://trnfhlmwmagsdhabswsl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybmZobG13bWFnc2RoYWJzd3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTc5NjUsImV4cCI6MjA4OTA3Mzk2NX0.k70D6gXb2eDF1raEodQFlk8vnQ5qNlw--fZVrMYmwwA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectPostsSchema() {
  console.log('--- POSTS SCHEMA INSPECTION ---');
  
  // Try to get one post to see column names
  const { data, error } = await supabase.from('posts').select('*').limit(1);
  
  if (error) {
    console.log('Error fetching post:', error.message);
  } else if (data && data.length > 0) {
    console.log('Columns:', Object.keys(data[0]).join(', '));
    console.log('Sample Data:', JSON.stringify(data[0], null, 2));
  } else {
    console.log('No posts found.');
  }

  // Also check followers table since that's in the broken query too
  console.log('\n--- FOLLOWERS SCHEMA ---');
  const { data: fData, error: fError } = await supabase.from('followers').select('*').limit(1);
  if (fError) console.log('Followers Error:', fError.message);
  else if (fData && fData.length > 0) console.log('Followers Columns:', Object.keys(fData[0]).join(', '));
}

inspectPostsSchema();
