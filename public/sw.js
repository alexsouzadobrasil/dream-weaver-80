// Service Worker for Push Notifications — Jerry
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};

  const options = {
    body:    data.body    ?? 'Nova notificação do Jerry',
    icon:    '/icon-192.png',
    badge:   '/badge-72.png',
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
    ? `https://jerry.com.br/dream/${dreamId}`
    : 'https://jerry.com.br';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      const focused = windowClients.find(c => c.focus);
      return focused ? focused.focus() : clients.openWindow(url);
    })
  );
});
