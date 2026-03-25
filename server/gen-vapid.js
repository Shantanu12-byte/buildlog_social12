const fs = require('fs');
const webpush = require('web-push');
const vapidKeys = webpush.generateVAPIDKeys();
fs.writeFileSync('vapid.json', JSON.stringify(vapidKeys, null, 2));
console.log('VAPID keys saved to vapid.json');
