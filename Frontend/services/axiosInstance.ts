import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export const axiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include token automatically
axiosInstance.interceptors.request.use(
  (config:any) => {
    const token = localStorage.getItem('authToken'); 
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
    return config;
  },
  (error) => Promise.reject(error)
);
