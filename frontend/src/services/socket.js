import { io } from "socket.io-client";

// URL del backend. Usa l'hostname corrente (localhost o IP del server)
const URL = `http://${window.location.hostname}:3000`;

const socket = io(URL, {
    autoConnect: true,
    reconnection: true
});

export default socket;
