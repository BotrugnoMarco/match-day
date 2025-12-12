import axios from 'axios';

// Use relative path if served from the same domain/port (via Nginx)
// Or construct the URL dynamically based on the window location but pointing to port 80 (implied)
const api = axios.create({
    baseURL: `https://matchday.botrugno.dev/api`, // This assumes the frontend is served from the same origin as the API proxy
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add a request interceptor to inject the token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
