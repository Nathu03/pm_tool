import axios from 'axios';
import { useAuthStore } from '../store/auth.store';

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1' });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) { useAuthStore.getState().logout(); window.location.href = '/login'; }
    return Promise.reject(err);
  },
);

export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }).then((r) => r.data),
  register: (data: any) => api.post('/auth/register', data).then((r) => r.data),
};
export const dashboardApi = { getStats: (projectId?: string) => api.get('/dashboard/stats', { params: { projectId } }).then((r) => r.data) };
export const projectsApi = { list: () => api.get('/projects').then((r) => r.data), get: (id: string) => api.get(`/projects/${id}`).then((r) => r.data), create: (data: any) => api.post('/projects', data).then((r) => r.data) };
export const tasksApi = {
  list: (projectId: string, params?: any) => api.get(`/projects/${projectId}/tasks`, { params }).then((r) => r.data),
  get: (id: string) => api.get(`/tasks/${id}`).then((r) => r.data),
  create: (projectId: string, data: any) => api.post(`/projects/${projectId}/tasks`, data).then((r) => r.data),
  update: (projectId: string, id: string, data: any) => api.patch(`/projects/${projectId}/tasks/${id}`, data).then((r) => r.data),
};
export const aiApi = {
  chat: (message: string, taskId?: string) => api.post('/ai/chat', { message, taskId }).then((r) => r.data),
  queueReview: (taskId: string) => api.post(`/ai/review/${taskId}`).then((r) => r.data),
  generateTestCases: (taskId: string) => api.post(`/ai/test-cases/${taskId}`).then((r) => r.data),
};
export const usersApi = { list: (search?: string) => api.get('/users', { params: { search } }).then((r) => r.data) };
