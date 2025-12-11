import { io } from "socket.io-client";

// In produzione (quando servito da Nginx), usa il percorso relativo (stesso host/porta)
// In sviluppo, usa localhost:3000
const URL = import.meta.env.PROD ? undefined : 'http://localhost:3000';

const socket = io(URL, {
    autoConnect: true,
    reconnection: true
});

export default socket;
