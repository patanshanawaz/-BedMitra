import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
  timeout: 10000,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('icu_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('icu_token');
      localStorage.removeItem('icu_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me'),
  register: (data) => API.post('/auth/register', data),
  changePassword: (data) => API.put('/auth/change-password', data),
  getStaff: (params) => API.get('/auth/staff', { params }),
};

export const hospitalAPI = {
  getAll: (params) => API.get('/hospitals', { params }),
  getById: (id) => API.get(`/hospitals/${id}`),
  create: (data) => API.post('/hospitals', data),
  update: (id, data) => API.put(`/hospitals/${id}`, data),
  getCities: () => API.get('/hospitals/cities'),
  getCityStats: (cityId) => API.get(`/hospitals/cities/${cityId}/stats`),
};

export const wardAPI = {
  getAll: (hospitalId) => API.get(`/hospitals/${hospitalId}/wards`),
  create: (hospitalId, data) => API.post(`/hospitals/${hospitalId}/wards`, data),
  update: (hospitalId, wardId, data) => API.put(`/hospitals/${hospitalId}/wards/${wardId}`, data),
  updateBedCount: (hospitalId, wardId, data) => API.patch(`/hospitals/${hospitalId}/wards/${wardId}/bed-count`, data),
};

export const bedAPI = {
  getAll: (wardId) => API.get(`/wards/${wardId}/beds`),
  getAvailable: (wardId) => API.get(`/wards/${wardId}/beds/available`),
  updateStatus: (wardId, bedId, data) => API.patch(`/wards/${wardId}/beds/${bedId}/status`, data),
};

export const patientAPI = {
  getAll: (hospitalId, params) => API.get(`/hospitals/${hospitalId}/patients`, { params }),
  getById: (hospitalId, patientId) => API.get(`/hospitals/${hospitalId}/patients/${patientId}`),
  admit: (hospitalId, data) => API.post(`/hospitals/${hospitalId}/patients/admit`, data),
  discharge: (hospitalId, patientId, data) => API.patch(`/hospitals/${hospitalId}/patients/${patientId}/discharge`, data),
};

export const dashboardAPI = {
  getHospital: (id) => API.get(`/dashboard/hospital/${id || ''}`),
  getSuperAdmin: () => API.get('/dashboard/admin'),
};

export default API;
