import axios from 'axios';

// VITE_API_BASE_URL can be set per environment (see .env.production).
// Falls back to '/api' so the Vite dev-server proxy works without any config.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT from localStorage on every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global 401 handler — clear auth and redirect to login
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // BASE_URL is '/' in dev, '/session-logger/' in production
      window.location.href = `${import.meta.env.BASE_URL}login`;
    }
    return Promise.reject(err);
  },
);

export default apiClient;
