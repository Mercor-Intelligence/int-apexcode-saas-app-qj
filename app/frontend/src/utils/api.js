const BASE_URL = '/api'

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('biolink_token')
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config)
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }
  
  return response.json()
}

export const api = {
  get: (endpoint) => request(endpoint),
  post: (endpoint, data) => request(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: (endpoint, data) => request(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
  upload: async (endpoint, formData) => {
    const token = localStorage.getItem('biolink_token')
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }))
      throw new Error(error.error || 'Upload failed')
    }
    return response.json()
  },
}

