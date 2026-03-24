const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://trnfhlmwmagsdhabswsl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybmZobG13bWFnc2RoYWJzd3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTc5NjUsImV4cCI6MjA4OTA3Mzk2NX0.k70D6gXb2eDF1raEodQFlk8vnQ5qNlw--fZVrMYmwwA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runStressTest() {
  console.log('--- STARTING STRESS TEST ---');
  
  // 1. Get a test user and room
  const { data: rooms, error: roomError } = await supabase.from('dm_rooms').select('id, user1_id, user2_id').limit(1);
  if (roomError || !rooms.length) {
    console.error('Error fetching test room:', roomError);
    return;
  }
  const room = rooms[0];
  const senderId = room.user1_id;
  const recipientId = room.user2_id;

  console.log(`Testing with Room: ${room.id}, Sender: ${senderId}`);

  // 2. Latency Test: Sequential Inserts (50 messages)
  console.log('\n1. LATENCY TEST (Sequential Inserts)...');
  const startLatency = Date.now();
  for (let i = 0; i < 20; i++) {
    await supabase.from('messages').insert({
      room_id: room.id,
      sender_id: senderId,
      recipient_id: recipientId,
      content: `STRESS_TEST_MSG_${i}_${Date.now()}`
    });
  }
  const endLatency = Date.now();
  console.log(`20 Sequential Inserts: ${endLatency - startLatency}ms (Avg: ${(endLatency - startLatency) / 20}ms/msg)`);

  // 3. Throughput Test: Parallel Inserts (50 messages)
  console.log('\n2. THROUGHPUT TEST (Parallel Inserts)...');
  const startThroughput = Date.now();
  const promises = [];
  for (let i = 0; i < 50; i++) {
    promises.push(supabase.from('messages').insert({
      room_id: room.id,
      sender_id: senderId,
      recipient_id: recipientId,
      content: `STRESS_TEST_BATCH_${i}_${Date.now()}`
    }));
  }
  await Promise.all(promises);
  const endThroughput = Date.now();
  console.log(`50 Parallel Inserts: ${endThroughput - startThroughput}ms (Throughput: ${Math.round(50 / ((endThroughput - startThroughput) / 1000))} msg/sec)`);

  // 4. Read Performance
  console.log('\n3. READ PERFORMANCE (Fetch last 100 messages)...');
  const startRead = Date.now();
  const { data: msgs, error: readError } = await supabase
    .from('messages')
    .select('*')
    .eq('room_id', room.id)
    .order('created_at', { ascending: false })
    .limit(100);
  const endRead = Date.now();
  const results = `
--- STRESS TEST RESULTS ---
Room: ${room.id}
Sequential Latency (20 msgs): ${endLatency - startLatency}ms (Avg: ${(endLatency - startLatency) / 20}ms/msg)
Parallel Throughput (50 msgs): ${endThroughput - startThroughput}ms (${Math.round(50 / ((endThroughput - startThroughput) / 1000))} msg/sec)
Read Performance (100 msgs): ${endRead - startRead}ms
---------------------------
`;
  console.log(results);
  require('fs').writeFileSync('scripts/stress_test_results.txt', results, 'utf8');
}

runStressTest();
