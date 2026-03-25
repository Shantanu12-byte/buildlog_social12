/* eslint-disable no-restricted-globals */
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const { title, body, icon, url } = data;

  const options = {
    body: body || 'You have a new update on Buildlog!',
    icon: icon || '/favicon.ico', // Fallback to favicon
    badge: '/favicon.ico',
    data: { url: url || '/' },
    vibrate: [100, 50, 100],
  };

  event.waitUntil(
    self.registration.showNotification(title || 'Buildlog', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window open and focus it
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
