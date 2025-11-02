// Central API configuration
// REACT_APP_API_URL should be the base URL without /api (e.g., https://airport-system-api.onrender.com)
// We add /api here
const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
export const API_URL = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

// Log for debugging
if (process.env.NODE_ENV === 'development') {
  console.log('API_URL configured:', API_URL);
}
