const autocannon = require('autocannon');

const run = async () => {
  const result = await autocannon({
    url: 'https://buildlog-social12.onrender.com/api/chat/clean',
    connections: 10,
    duration: 5,
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({ text: 'This is a test message to clean!' })
  });

  console.log(autocannon.printResult(result));
};

run();
