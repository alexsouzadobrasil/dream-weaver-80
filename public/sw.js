// Service Worker for Push Notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};

  const options = {
    body:    data.body    ?? 'Nova notificação do Jerry',
    icon:    '/favicon.ico',
    badge:   '/favicon.ico',
    tag:     `jerry-${data.type ?? 'general'}`,
    data:    { dreamId: data.dreamId, type: data.type },
    actions: data.dreamId ? [
      { action: 'open', title: 'Ver sonho' },
      { action: 'close', title: 'Fechar' },
    ] : [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Jerry', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const dreamId = event.notification.data?.dreamId;
  const url = dreamId
    ? `/?dream=${dreamId}`
    : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      const focused = windowClients.find(c => c.focus);
      return focused ? focused.focus() : clients.openWindow(url);
    })
  );
});
