import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor - attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('icu_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('icu_token');
      localStorage.removeItem('icu_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error.response?.data || { message: 'Network error. Please try again.' });
  }
);

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  changePassword: (data) => api.put('/auth/change-password', data),
  register: (data) => api.post('/auth/register', data),
};

// Hospitals API
export const hospitalsAPI = {
  getAll: (params) => api.get('/hospitals', { params }),
  getById: (id) => api.get(`/hospitals/${id}`),
  create: (data) => api.post('/hospitals', data),
  update: (id, data) => api.put(`/hospitals/${id}`, data),
  getCities: () => api.get('/hospitals/cities'),
  getCityStats: (cityId) => api.get(`/hospitals/cities/${cityId}/stats`),
};

// Wards API
export const wardsAPI = {
  getByHospital: (hospitalId) => api.get(`/hospitals/${hospitalId}/wards`),
  create: (hospitalId, data) => api.post(`/hospitals/${hospitalId}/wards`, data),
  updateAvailability: (hospitalId, wardId, data) => api.put(`/hospitals/${hospitalId}/wards/${wardId}`, data),
  updateSettings: (hospitalId, wardId, data) => api.patch(`/hospitals/${hospitalId}/wards/${wardId}/settings`, data),
  getBeds: (hospitalId, wardId) => api.get(`/hospitals/${hospitalId}/wards/${wardId}/beds`),
};

// Patients API
export const patientsAPI = {
  getByHospital: (hospitalId, params) => api.get(`/hospitals/${hospitalId}/patients`, { params }),
  admit: (hospitalId, data) => api.post(`/hospitals/${hospitalId}/patients/admit`, data),
  discharge: (hospitalId, patientId, data) => api.put(`/hospitals/${hospitalId}/patients/${patientId}/discharge`, data),
  getById: (hospitalId, patientId) => api.get(`/hospitals/${hospitalId}/patients/${patientId}`),
};

// Dashboard API
export const dashboardAPI = {
  getHospitalDashboard: (hospitalId) => api.get(`/dashboard/hospital/${hospitalId}`),
  getSuperAdminDashboard: () => api.get('/dashboard/super-admin'),
  getAllHospitals: () => api.get('/dashboard/hospitals-list'),
  getAllUsers: () => api.get('/dashboard/users'),
  toggleUserStatus: (userId) => api.patch(`/dashboard/users/${userId}/toggle`),
};

export default api;
