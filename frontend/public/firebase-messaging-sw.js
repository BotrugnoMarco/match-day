// Scripts for firebase messaging
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
// DEVI SOSTITUIRE QUESTO OGGETTO CON LA TUA CONFIGURAZIONE FIREBASE
firebase.initializeApp({
    apiKey: "AIzaSyDRswmlK92bWJjzhnaEzGL7jParA-eF024",
    authDomain: "match-day-20e17.firebaseapp.com",
    projectId: "match-day-20e17",
    storageBucket: "match-day-20e17.firebasestorage.app",
    messagingSenderId: "1679408604",
    appId: "1:1679408604:web:5caf0f642b15c13744e319",
    measurementId: "G-M62YTC9ZF3"
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Customize notification here
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/pwa-192x192.png', // Assicurati di avere un'icona
        data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function (event) {
    console.log('[firebase-messaging-sw.js] Notification click Received.', event);
    event.notification.close();

    // Open the app or specific URL
    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(windowClients => {
            // Check if there is already a window/tab open with the target URL
            for (var i = 0; i < windowClients.length; i++) {
                var client = windowClients[i];
                // If so, just focus it.
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, then open the target URL in a new window/tab.
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
