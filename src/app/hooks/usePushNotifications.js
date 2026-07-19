import { useEffect } from 'react';
import { api } from '@/lib/api';

export function usePushNotifications(appName = 'forms') {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check if the browser supports notifications
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notification');
      return;
    }

    const registerToken = async () => {
      try {
        // We use a placeholder FCM token format since Firebase SDK is not configured yet.
        // Once Firebase is set up, this should be replaced with `getToken(messaging)`.
        const placeholderToken = `fcm_placeholder_token_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        
        await api.registerPushToken(placeholderToken, 'web', appName);
        console.log(`[PushNotifications] Registered token for app: ${appName}`);
      } catch (err) {
        console.error(`[PushNotifications] Failed to register token for ${appName}`, err);
      }
    };

    if (Notification.permission === 'granted') {
      registerToken();
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          registerToken();
        }
      });
    }
  }, [appName]);
}
