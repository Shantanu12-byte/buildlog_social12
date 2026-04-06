import { supabase } from './supabase';
import { Platform } from 'react-native';

const VAPID_PUBLIC_KEY = 'BPCZ_tRb3cxK0dKea6HD_i1fNgkrfh_K3fUrOt31utrcpvQrwBw4HZ88QMX7ayPaqgfNwQDHOtbU2osEPPipulk';
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://buildlog-social12.onrender.com';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerPushNotifications(userId: string) {
  if (Platform.OS !== 'web') return;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js');

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return;
    }

    const subscribeOptions = {
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    };

    const subscription = await registration.pushManager.subscribe(subscribeOptions);

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const response = await fetch(`${BACKEND_URL}/api/user/push/subscribe`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        userId,
        subscription,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save subscription on server');
    }
  } catch {
    // Push registration failed silently
  }
}
