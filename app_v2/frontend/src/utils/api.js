/**
 * API Utility
 * Handles all HTTP requests to the backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('biolink_token');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    },
    ...options
  };
  
  // Don't stringify body if it's FormData
  if (options.body && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }
  
  // Remove Content-Type for FormData (browser sets it with boundary)
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  
  const response = await fetch(url, config);
  return response;
}

export const api = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  
  post: (endpoint, body) => request(endpoint, { 
    method: 'POST', 
    body 
  }),
  
  put: (endpoint, body) => request(endpoint, { 
    method: 'PUT', 
    body 
  }),
  
  patch: (endpoint, body) => request(endpoint, { 
    method: 'PATCH', 
    body 
  }),
  
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
  
  upload: (endpoint, formData) => request(endpoint, {
    method: 'POST',
    body: formData
  })
};


