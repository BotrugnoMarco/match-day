import { io } from "socket.io-client";

// In produzione usa l'URL del server reale, altrimenti localhost
const URL = import.meta.env.PROD ? 'https://matchday.botrugno.dev' : 'http://localhost:3000';

const socket = io(URL, {
    autoConnect: true,
    reconnection: true,
    transports: ['websocket', 'polling'] // Forza prima websocket, poi polling
});

export default socket;
