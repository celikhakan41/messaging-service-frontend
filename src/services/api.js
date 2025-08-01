// src/services/api.js
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.MODE === 'production' 
    ? 'https://messaging-service-atux.onrender.com/api'
    : 'http://localhost:8080/api');

console.log("BASE_URL:", BASE_URL);
console.log("MODE:", import.meta.env.MODE);

export const register = (username, password) =>
  axios.post(`${BASE_URL}/auth/register`, { username, password });

export const login = (username, password) =>
  axios.post(`${BASE_URL}/auth/login`, { username, password });