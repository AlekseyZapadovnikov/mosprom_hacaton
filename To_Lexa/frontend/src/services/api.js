import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({ baseURL: API_BASE_URL, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- API АВТОРИЗАЦИИ ---
export const authAPI = { register: (data) => api.post('/api/auth/register', data), login: (data) => api.post('/api/auth/login', data) };

// --- API СТУДЕНТОВ ---
export const studentsAPI = { createProfile: (data) => api.post('/api/students/profile', data), getProfile: (userId) => api.get(`/api/students/profile/${userId}`), updateProfile: (userId, data) => api.put(`/api/students/profile/${userId}`, data) };

// --- API РЕЗЮМЕ ---
export const resumesAPI = {
    create: (data) => api.post('/api/resumes', data),
    getByStudent: (studentId) => api.get(`/api/resumes/student/${studentId}`),
    updateResume: (id, data) => api.put(`/api/resumes/${id}`, data),
};

// --- API КОМПАНИЙ ---
export const companiesAPI = {
    createProfile: (data) => api.post('/api/companies/profile', data),
    getProfile: (userId) => api.get(`/api/companies/profile/${userId}`)
    };

// --- API ВАКАНСИЙ (ИСПРАВЛЕННЫЙ БЛОК) ---
export const vacanciesAPI = {
  create: (data) => api.post('/api/vacancies', data),
  getAll: (params) => api.get('/api/vacancies', { params }),
  getById: (id) => api.get(`/api/vacancies/${id}`),
  getMyCompanyVacancies: () => api.get('/api/companies/my-vacancies'),
  createVacancyResponse: (data) => api.post('/api/vacancy_touches', data),
  getVacancyWithResponses: (id) => api.get(`/api/vacancies/${id}/responses`),
  generateAISummary: (touchId) => api.post(`/api/vacancy_touch/${touchId}/generate_summary`),
};

// --- ОСТАЛЬНЫЕ API ---
export const universitiesAPI = { createProfile: (data) => api.post('/api/universities/profile', data), getProfile: (userId) => api.get(`/api/universities/profile/${userId}`) };
export const appointmentsAPI = { create: (data) => api.post('/api/appointments', data), getByStudent: (studentId) => api.get(`/api/appointments/student/${studentId}`) };
export const chatAPI = { sendMessage: (data) => api.post('/api/chat/messages', data), getMessages: (userId, limit=100) => api.get(`/api/chat/messages/${userId}`, { params: { limit } }) };
export const aiChatAPI = { sendQuery: (data) => api.post('/api/ai/chat', data) };

export const analyticsAPI = {
  getOverview: () => {
    return api.get('api/analytics/overview');
  },

  getVacancyStatsByTime: (granularity = 'day') => {
    const params = new URLSearchParams({ granularity });
    return api.get(`/api/vacancies/stats/by-time?${params.toString()}`);
  },

  getStudentRegistrationStats: (granularity = 'day') => {
    const params = new URLSearchParams({ granularity });
    return api.get(`/api/users/stats/by-time?${params.toString()}`);
  },

  getCompanyActivityStats: (limit = 10) => {
    return api.get(`/api/analytics/company-activity?limit=${limit}`);
  },

  getWordCloudData: (limit = 50) => {
    return api.get(`/api/analytics/word-cloud?limit=${limit}`);
  }
};

// --- API КАНДИДАТОВ ---
export const candidatesAPI = {
  search: (filters) => api.get('/api/candidates/search', { params: filters }),
};

// --- API МОДЕРАТОРА ---
export const moderatorAPI = {
  getAllUsers: () => api.get('/api/moderator/users'),
  getAllVacancies: () => api.get('/api/moderator/vacancies'),
  getAllUniversities: () => api.get('/api/moderator/universities'),
  getDetailedAnalytics: () => api.get('/api/moderator/analytics/detailed'),
  approveVacancy: (vacancyId) => api.post(`/api/moderator/vacancies/${vacancyId}/approve`),
  deleteVacancy: (vacancyId) => api.delete(`/api/moderator/vacancies/${vacancyId}`),
};

export default api;