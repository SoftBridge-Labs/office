importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: 'AIzaSyCelxav5h3wzZfBHXqnNvFQ6KaXnNjm9bA',
  projectId: 'softbridge-labs',
  messagingSenderId: '743183545439',
  appId: '1:743183545439:web:3240fb171da210875b17ea'
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification.',
    icon: '/icon.png', // Assuming there's a default icon in public folder
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
