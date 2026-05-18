// Central API configuration — reads from VITE_API_URL env variable
// In development: ${import.meta.env.VITE_API_URL || "http://localhost:8000"}
// In production: your Railway backend URL
const API_BASE = import.meta.env.VITE_API_URL || '${import.meta.env.VITE_API_URL || "http://localhost:8000"}';

export default API_BASE;
