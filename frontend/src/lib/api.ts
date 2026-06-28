import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach JWT token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          }
          return api(originalRequest);
        }
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// ─── Auth API ────────────────────────────────────────────────
export const authAPI = {
  register: (data: { email: string; password: string; name: string; phone?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  googleAuth: (data: { googleId: string; email: string; name: string; avatar?: string }) =>
    api.post('/auth/google', data),
  requestOTP: (email: string) =>
    api.post('/auth/otp/request', { email }),
  verifyOTP: (data: { email: string; otp: string }) =>
    api.post('/auth/otp/verify', data),
  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  getMe: () =>
    api.get('/auth/me'),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (data: { email: string; otp: string; newPassword: string }) =>
    api.post('/auth/reset-password', data),
};

// ─── Complaints API ──────────────────────────────────────────
export const complaintsAPI = {
  getAll: (params?: Record<string, any>) =>
    api.get('/complaints', { params }),
  getById: (id: string) =>
    api.get(`/complaints/${id}`),
  create: (data: any) =>
    api.post('/complaints', data),
  getMy: (params?: Record<string, any>) =>
    api.get('/complaints/my', { params }),
  getNearby: (params: { latitude: number; longitude: number; radius?: number }) =>
    api.get('/complaints/nearby', { params }),
  updateStatus: (id: string, data: { status: string; note?: string }) =>
    api.patch(`/complaints/${id}/status`, data),
  assign: (id: string, officerId: string) =>
    api.patch(`/complaints/${id}/assign`, { officerId }),
  uploadImages: (id: string, formData: FormData) =>
    api.post(`/complaints/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  analyzeImage: (formData: FormData) =>
    api.post('/complaints/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getStats: () =>
    api.get('/complaints/stats'),
  getHeatmap: () =>
    api.get('/complaints/heatmap'),
};

// ─── Votes API ───────────────────────────────────────────────
export const votesAPI = {
  vote: (complaintId: string, type: 'VERIFY' | 'REJECT' | 'FLAG') =>
    api.post(`/votes/${complaintId}`, { type }),
  getVotes: (complaintId: string) =>
    api.get(`/votes/${complaintId}`),
};

// ─── Comments API ────────────────────────────────────────────
export const commentsAPI = {
  create: (complaintId: string, content: string) =>
    api.post(`/comments/${complaintId}`, { content }),
  getByComplaint: (complaintId: string, params?: Record<string, any>) =>
    api.get(`/comments/${complaintId}`, { params }),
  delete: (id: string) =>
    api.delete(`/comments/${id}`),
};

// ─── Notifications API ───────────────────────────────────────
export const notificationsAPI = {
  getAll: (params?: Record<string, any>) =>
    api.get('/notifications', { params }),
  getUnreadCount: () =>
    api.get('/notifications/unread-count'),
  markRead: (id: string) =>
    api.patch(`/notifications/${id}/read`),
  markAllRead: () =>
    api.patch('/notifications/read-all'),
};

// ─── Users API ───────────────────────────────────────────────
export const usersAPI = {
  getProfile: () =>
    api.get('/users/profile'),
  getProfileById: (id: string) =>
    api.get(`/users/profile/${id}`),
  updateProfile: (data: any) =>
    api.patch('/users/profile', data),
  getLeaderboard: (params?: { period?: string; limit?: number }) =>
    api.get('/users/leaderboard', { params }),
  getAchievements: () =>
    api.get('/users/achievements'),
  getChallenges: () =>
    api.get('/users/challenges'),
  getBadges: () =>
    api.get('/users/badges'),
  getActivity: () =>
    api.get('/users/activity'),
};

// ─── Admin API ───────────────────────────────────────────────
export const adminAPI = {
  getUsers: (params?: Record<string, any>) =>
    api.get('/admin/users', { params }),
  updateUser: (id: string, data: any) =>
    api.patch(`/admin/users/${id}`, data),
  getDepartments: () =>
    api.get('/admin/departments'),
  createDepartment: (data: any) =>
    api.post('/admin/departments', data),
  updateDepartment: (id: string, data: any) =>
    api.patch(`/admin/departments/${id}`, data),
  getStats: () =>
    api.get('/admin/stats'),
  getLogs: (params?: Record<string, any>) =>
    api.get('/admin/logs', { params }),
  getSettings: () =>
    api.get('/admin/settings'),
  updateSettings: (data: Record<string, any>) =>
    api.patch('/admin/settings', data),
};

// ─── Analytics API ───────────────────────────────────────────
export const analyticsAPI = {
  getDashboard: () =>
    api.get('/analytics/dashboard'),
  getCategories: () =>
    api.get('/analytics/categories'),
  getStatuses: () =>
    api.get('/analytics/statuses'),
  getTrends: (days?: number) =>
    api.get('/analytics/trends', { params: { days } }),
  getDepartments: () =>
    api.get('/analytics/departments'),
  getAreas: () =>
    api.get('/analytics/areas'),
  getMonthly: (params?: { year?: number; month?: number }) =>
    api.get('/analytics/monthly', { params }),
  getPredictions: () =>
    api.get('/analytics/predictions'),
  getTopAreas: () =>
    api.get('/analytics/top-areas'),
  getTopContributors: () =>
    api.get('/analytics/top-contributors'),
};

// ─── Chat API ────────────────────────────────────────────────
export const chatAPI = {
  sendMessage: (data: { message: string; sessionId?: string }) =>
    api.post('/chat/send', data),
  getSessions: () =>
    api.get('/chat/sessions'),
  getHistory: (sessionId: string) =>
    api.get(`/chat/history/${sessionId}`),
  clearHistory: (sessionId: string) =>
    api.delete(`/chat/history/${sessionId}`),
};

export default api;
