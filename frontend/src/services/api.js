import axios from 'axios';
import router from '../router';

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

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.data.error === 'Invalid token.')) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // Redirect to login if not already there
            if (router.currentRoute.value.path !== '/login') {
                router.push('/login');
                // Optional: You could trigger a toast here via a global event bus or similar mechanism
                // but router push is the critical part.
            }
        }
        return Promise.reject(error);
    }
);

export default api;
