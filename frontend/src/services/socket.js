import { io } from "socket.io-client";

// URL del server Socket.io
// Deve corrispondere all'URL utilizzato in api.js per garantire che i messaggi inviati tramite API
// vengano ricevuti tramite lo stesso server socket.
const URL = 'https://matchday.botrugno.dev';

const socket = io(URL, {
    autoConnect: true,
    reconnection: true,
    transports: ['websocket', 'polling']
});

export default socket;
