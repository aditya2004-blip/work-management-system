import axios from "axios";

// Create Axios instance with base API URL
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

// Request interceptor: attach JWT token to headers
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// Response interceptor: handle unauthorized errors
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem('token'); // Clear invalid token
            window.location.href = '/login';  // Redirect to login
        }
        return Promise.reject(err);
    }
);

export default api;