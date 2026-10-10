'use client';

import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { api } from '@/lib/api';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCelxav5h3wzZfBHXqnNvFQ6KaXnNjm9bA',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'softbridge-labs',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '743183545439',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:743183545439:web:3240fb171da210875b17ea'
};

export default function PushNotificationManager() {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('Notification' in window)) return;
    
    if (Notification.permission === 'default' && !localStorage.getItem('sb_push_prompted')) {
      setShowModal(true);
    } else if (Notification.permission === 'granted') {
      setupPushNotifications();
    }
  }, []);

  const setupPushNotifications = async () => {
    try {
      const app = initializeApp(firebaseConfig);
      const messaging = getMessaging(app);

      // Explicitly register the service worker to resolve Firebase "failed-service-worker-registration" errors
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      await navigator.serviceWorker.ready;

      const tokenOptions = { serviceWorkerRegistration: registration };
      if (process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY) {
        tokenOptions.vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      }
      
      const token = await getToken(messaging, tokenOptions);
      
      if (token) {
        await api.ping.registerPushToken({
          token,
          deviceType: 'web',
          app: 'ping'
        }).catch(e => console.error('Failed to register push token:', e));
      }

      onMessage(messaging, (payload) => {
        console.log('[PushNotificationManager] Received foreground message:', payload);
      });
    } catch (err) {
      console.error('[PushNotificationManager] Firebase messaging error:', err);
    }
  };

  const handleAllow = async () => {
    localStorage.setItem('sb_push_prompted', 'true');
    setShowModal(false);
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setupPushNotifications();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('sb_push_prompted', 'true');
    setShowModal(false);
  };

  if (!showModal) return null;

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', zIndex: 9999, maxWidth: 300, fontFamily: 'Inter, sans-serif' }}>
      <h3 style={{ margin: '0 0 10px', fontSize: '1rem', color: '#111827', fontWeight: 600 }}>Enable Notifications</h3>
      <p style={{ margin: '0 0 15px', fontSize: '0.85rem', color: '#4b5563', lineHeight: '1.4' }}>Stay up to date with new messages and mentions by allowing push notifications for Ping.</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={handleSkip} style={{ background: 'none', border: '1px solid #e5e7eb', color: '#374151', padding: '6px 12px', borderRadius: 4, fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500 }}>Not now</button>
        <button onClick={handleAllow} style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500 }}>Allow Notifications</button>
      </div>
    </div>
  );
}
