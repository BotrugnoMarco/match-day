import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import api from "./api";

// DEVI SOSTITUIRE QUESTO OGGETTO CON LA TUA CONFIGURAZIONE FIREBASE (La stessa del service worker)
const firebaseConfig = {
    apiKey: "AIzaSyDRswmlK92bWJjzhnaEzGL7jParA-eF024",
    authDomain: "match-day-20e17.firebaseapp.com",
    projectId: "match-day-20e17",
    storageBucket: "match-day-20e17.firebasestorage.app",
    messagingSenderId: "1679408604",
    appId: "1:1679408604:web:5caf0f642b15c13744e319",
    measurementId: "G-M62YTC9ZF3"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestNotificationPermission = async () => {
    if (Capacitor.isNativePlatform()) {
        // --- NATIVE (Android/iOS) ---
        try {
            const permission = await PushNotifications.requestPermissions();
            if (permission.receive === 'granted') {
                // Register with Apple / Google to receive push via APNS/FCM
                await PushNotifications.register();
            } else {
                console.log("Push notification permission denied");
            }
        } catch (e) {
            console.error("Error requesting native permissions", e);
        }
    } else {
        // --- WEB ---
        try {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
                console.log("Notification permission granted.");

                // Get FCM Token
                const token = await getToken(messaging, {
                    vapidKey: "BCjZkD0mr6RHMK7uTh7wiHd_h8jw2MnIqN9juPVzGCnPyjc8ATiNyt1ySKjOatBPyF2WaRX-5x7QKC6UizbcOR0" // Generata dalla console Firebase (Web Push Certificate)
                });

                if (token) {
                    // console.log("FCM Token (Web):", token);
                    await api.post('/notifications/token', { token, device_type: 'web' });
                }
            }
        } catch (error) {
            console.error("An error occurred while retrieving token. ", error);
        }
    }
};

// Initialize listeners (Call this in App.vue onMounted)
export const initPushListeners = () => {
    if (Capacitor.isNativePlatform()) {
        // --- NATIVE LISTENERS ---

        // On success registration
        PushNotifications.addListener('registration', async (token) => {
            console.log('Push registration success, token: ' + token.value);
            // Send token to backend
            await api.post('/notifications/token', {
                token: token.value,
                device_type: Capacitor.getPlatform() // 'android' or 'ios'
            });
        });

        // On registration error
        PushNotifications.addListener('registrationError', (error) => {
            console.error('Error on registration: ' + JSON.stringify(error));
        });

        // On notification received (Foreground)
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('Push received: ', notification);
            // You can emit an event or show a local toast here
        });

        // On notification action performed (Background/Tap)
        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            console.log('Push action performed: ', notification);
            // Handle navigation based on data
            // const data = notification.notification.data;
            // if (data.url) router.push(data.url);
        });

    } else {
        // --- WEB LISTENERS ---
        onMessage(messaging, (payload) => {
            console.log('Message received (Web Foreground): ', payload);
            // Mostra una notifica visiva (Toast) quando l'app è aperta
            const notificationTitle = payload.notification.title;
            const notificationOptions = {
                body: payload.notification.body,
                icon: '/pwa-192x192.png'
            };

            // Se il browser supporta le notifiche e sono permesse, mostrala
            if (Notification.permission === "granted") {
                new Notification(notificationTitle, notificationOptions);
            }
        });
    }
};

// Deprecated: use initPushListeners instead
export const onForegroundMessage = () => {
    return new Promise((resolve) => {
        if (!Capacitor.isNativePlatform()) {
            onMessage(messaging, (payload) => {
                resolve(payload);
            });
        }
    });
};
