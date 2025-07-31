// src/services/api.js
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

console.log("BASE_URL:", BASE_URL);

export const register = (username, password) =>
  axios.post(`${BASE_URL}/auth/register`, { username, password });

export const login = (username, password) =>
  axios.post(`${BASE_URL}/auth/login`, { username, password });