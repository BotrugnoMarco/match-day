import { io } from "socket.io-client";

// URL del backend. In sviluppo è spesso localhost:3000.
// In produzione dovresti usare una variabile d'ambiente.
const URL = "http://localhost:3000";

const socket = io(URL, {
    autoConnect: true,
    reconnection: true
});

export default socket;
