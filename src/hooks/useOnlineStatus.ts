import { useState, useEffect } from 'react';
import { onConnectivityChange } from '@/lib/offlineQueue';

export function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    return onConnectivityChange(setOnline);
  }, []);

  return online;
}
