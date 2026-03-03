import { useState, useEffect, useCallback } from 'react';

// TODO: Replace with actual VAPID public key from server admin
const VAPID_PUBLIC_KEY = 'SUA_VAPID_PUBLIC_KEY_AQUI';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export type PushPermissionStatus = 'default' | 'granted' | 'denied' | 'unsupported';

export function usePushNotifications() {
  const [status, setStatus] = useState<PushPermissionStatus>('default');

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported');
    } else {
      setStatus(Notification.permission as 'default' | 'granted' | 'denied');
    }
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (status === 'unsupported') return false;

    try {
      const permission = await Notification.requestPermission();
      setStatus(permission as PushPermissionStatus);
      if (permission !== 'granted') return false;

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const subscription = await (registration as any).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const { endpoint, keys } = subscription.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };

      const apiKey = localStorage.getItem('jerry_api_key') ?? '';
      const response = await fetch('https://api.jerry.com.br/api/push/subscribe.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
        },
        body: JSON.stringify({ endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } }),
      });

      const result = await response.json();
      return result.success === true;
    } catch (err) {
      console.warn('Push subscription failed:', err);
      return false;
    }
  }, [status]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      if (!registration) return false;

      const subscription = await (registration as any).pushManager.getSubscription();
      if (!subscription) return false;

      const apiKey = localStorage.getItem('jerry_api_key') ?? '';
      await fetch('https://api.jerry.com.br/api/push/unsubscribe.php', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
        },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });

      await subscription.unsubscribe();
      setStatus('default');
      return true;
    } catch {
      return false;
    }
  }, []);

  return { status, subscribe, unsubscribe };
}
