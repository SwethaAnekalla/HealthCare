import axios from 'axios';
import { ApiResponse } from '@caresync/shared';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or unauthorized
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export const apiClient = {
  get: <T = any>(url: string, config?: any) =>
    api.get<ApiResponse<T>>(url, config),
  post: <T = any>(url: string, data?: any, config?: any) =>
    api.post<ApiResponse<T>>(url, data, config),
  patch: <T = any>(url: string, data?: any, config?: any) =>
    api.patch<ApiResponse<T>>(url, data, config),
  put: <T = any>(url: string, data?: any, config?: any) =>
    api.put<ApiResponse<T>>(url, data, config),
  delete: <T = any>(url: string, config?: any) =>
    api.delete<ApiResponse<T>>(url, config),
};
