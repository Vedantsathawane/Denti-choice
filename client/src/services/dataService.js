import api from './api';

export const doctorService = {
  getAll: (params) => api.get('/doctors', { params }),
  getById: (id) => api.get(`/doctors/${id}`),
  create: (data) => api.post('/doctors', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/doctors/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/doctors/${id}`)
};

export const serviceService = {
  getAll: (params) => api.get('/services', { params }),
  getById: (id) => api.get(`/services/${id}`),
  create: (data) => api.post('/services', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/services/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/services/${id}`)
};

export const appointmentService = {
  getAll: (params) => api.get('/appointments', { params }),
  getById: (id) => api.get(`/appointments/${id}`),
  book: (data) => api.post('/appointments', data),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  updateStatus: (id, data) => api.patch(`/appointments/${id}/status`, data),
  delete: (id) => api.delete(`/appointments/${id}`),
  getSlots: (doctorId, date) => api.get('/appointments/slots', { params: { doctor_id: doctorId, date } }),
  getToday: () => api.get('/appointments/today')
};

export const testimonialService = {
  getAll: (params) => api.get('/testimonials', { params }),
  getById: (id) => api.get(`/testimonials/${id}`),
  create: (data) => api.post('/testimonials', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/testimonials/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  toggleVisibility: (id) => api.patch(`/testimonials/${id}/visibility`),
  delete: (id) => api.delete(`/testimonials/${id}`)
};

export const contactService = {
  submit: (data) => api.post('/contact', data),
  getAll: (params) => api.get('/contact', { params }),
  getById: (id) => api.get(`/contact/${id}`),
  markAsRead: (id) => api.patch(`/contact/${id}/read`),
  reply: (id, data) => api.post(`/contact/${id}/reply`, data),
  delete: (id) => api.delete(`/contact/${id}`)
};

export const settingService = {
  getAll: () => api.get('/settings'),
  update: (data) => api.put('/settings', data)
};

export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
  getRecent: () => api.get('/dashboard/recent'),
  getChartData: (year) => api.get('/dashboard/chart-data', { params: { year } })
};

export const notificationService = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`)
};

export const authService = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  changePassword: (data) => api.put('/auth/password', data)
};
