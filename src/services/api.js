// services/api.js
import axios from 'axios';

const BASE_URL = '/api';

export const register = (username, password) =>
    axios.post(`${BASE_URL}/auth/register`, { username, password });

export const login = (username, password) =>
    axios.post(`${BASE_URL}/auth/login`, { username, password });