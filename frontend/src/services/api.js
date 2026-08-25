import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for JWT token attachment
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pr_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Auth APIs
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

// PR APIs
export const prAPI = {
  list: (params) => api.get('/prs', { params }),
  get: (id) => api.get(`/prs/${id}`),
  create: (data) => api.post('/prs', data),
  update: (id, data) => api.put(`/prs/${id}`, data),
  action: (id, data) => api.post(`/prs/${id}/action`, data),
  addComment: (id, data) => api.post(`/prs/${id}/comments`, data),
  uploadAttachment: (id, formData) => api.post(`/prs/${id}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => api.delete(`/prs/${id}`),
};

// Analytics & Dashboard APIs
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
};

// Users APIs
export const userAPI = {
  list: () => api.get('/users'),
};

export default api;
