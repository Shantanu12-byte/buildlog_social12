const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://trnfhlmwmagsdhabswsl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybmZobG13bWFnc2RoYWJzd3NsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQ5Nzk2NSwiZXhwIjoyMDg5MDczOTY1fQ.1yZzQ3xTj6Thk_B241DheAcuStzanmjBl5HFlcpDVA8';
const USER_ID = '327371c6-26f1-4cfb-b398-4158e022616c';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  console.log(`Checking projects for User ID: ${USER_ID}`);
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', USER_ID);

  if (error) {
    console.error('Error fetching projects:', error);
    return;
  }

  console.log(`Found ${data.length} projects.`);
  data.forEach(p => {
    console.log(`- Project: ${p.title} (ID: ${p.id})`);
  });
}

check();
