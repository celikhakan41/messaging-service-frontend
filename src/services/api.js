// src/services/api.js
import axios from 'axios';

export const BASE_URL = import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.MODE === 'production'
    ? 'https://messaging-service-atux.onrender.com/api'
    : 'http://localhost:8080/api');

export const WS_URL = import.meta.env.VITE_WS_BASE_URL ||
  (import.meta.env.MODE === 'production'
    ? 'https://messaging-service-atux.onrender.com'
    : 'http://localhost:8080');

const apiClient = axios.create({
  baseURL: BASE_URL,
});

// Request interceptor - token'ı tüm isteklere ekle
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor - 401 hatalarını yakala
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication - Bu fonksiyonlar token gerektirmediği için axios kullanıyor
export const register = (username, password) =>
  axios.post(`${BASE_URL}/auth/register`, { username, password });

export const login = (username, password) =>
  axios.post(`${BASE_URL}/auth/login`, { username, password });

// Cache Management
export const clearCache = (cacheName) =>
  apiClient.post(`/debug/cache/clear/${cacheName}`);

// API Key Management
export const getApiKeys = () => apiClient.get('/keys/list');
export const generateApiKey = () => apiClient.post('/keys/generate');
export const deleteApiKey = (keyId) => apiClient.delete(`/keys/${keyId}`);
export const getApiKeyCount = () => apiClient.get('/tenant/apikeys/count');

// Tenant Management
export const getTenantInfo = () => apiClient.get('/tenant');
export const updateTenantPlan = (planType) => apiClient.put('/tenant/plan', { planType });

// Invoice Management
export const getInvoices = (status) => apiClient.get('/invoices', { params: { status } });
export const getInvoiceById = (id) => apiClient.get(`/invoices/${id}`);
export const payInvoice = (invoiceId) => apiClient.post(`/invoices/${invoiceId}/pay`);

// Message Management
export const getMessageCount = () => apiClient.get('/messages/count');
export const getDailyUsage = () => apiClient.get('/tenant/daily-usage');
export const sendMessage = (to, content) => apiClient.post('/messages/send', { to, content });
export const getMessageHistory = (withUser) => apiClient.get('/messages/history', { params: { with: withUser } });

// Payment Management (Stripe)
export const createPaymentIntent = (invoiceId) => 
  apiClient.post(`/invoices/${invoiceId}/payment-intent`);

export const createSubscription = (planType, tenantId) => 
  apiClient.post('/subscriptions', { planType, tenantId });

export const checkPaymentStatus = (invoiceId) => 
  apiClient.get(`/invoices/${invoiceId}`);