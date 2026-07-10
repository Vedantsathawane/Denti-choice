import api from './api';

export const doctorService = {
  getAll: (data) => api.post('/doctors/all', data),
  getById: (id) => api.post(`/doctors/by-id`, { id }),
  create: (data) => api.post('/doctors', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => {
    if (data instanceof FormData) {
      if (!data.has('id')) data.append('id', id);
    } else {
      data = { id, ...data };
    }
    return api.put(`/doctors/update`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  delete: (id) => api.delete(`/doctors/delete`, { data: { id } })
};

export const serviceService = {
  getAll: (data) => api.post('/services/all', data),
  getById: (id) => api.post(`/services/by-id`, { id }),
  create: (data) => api.post('/services', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => {
    if (data instanceof FormData) {
      if (!data.has('id')) data.append('id', id);
    } else {
      data = { id, ...data };
    }
    return api.put(`/services/update`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  delete: (id) => api.delete(`/services/delete`, { data: { id } })
};

export const appointmentService = {
  getAll: (data) => api.post('/appointments/all', data),
  getById: (id) => api.post(`/appointments/by-id`, { id }),
  book: (data) => api.post('/appointments', data),
  update: (id, data) => api.put(`/appointments/update`, { id, ...data }),
  updateStatus: (id, data) => api.patch(`/appointments/update-status`, { id, ...data }),
  delete: (id) => api.delete(`/appointments/delete`, { data: { id } }),
  getSlots: (doctorId, date) => api.get('/appointments/slots', { params: { doctor_id: doctorId, date } }),
  getToday: () => api.post('/appointments/today')
};

export const reminderService = {
  getUpcoming: () => api.get('/reminders/upcoming'),
  getPending: () => api.get('/reminders/pending'),
  sendReminder: (id) => api.post('/reminders/send', { id }),
  sendAll: () => api.post('/reminders/send-all')
};

export const testimonialService = {
  getAll: (data) => api.post('/testimonials/all', data),
  getById: (id) => api.post(`/testimonials/by-id`, { id }),
  create: (data) => api.post('/testimonials', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => {
    if (data instanceof FormData) {
      if (!data.has('id')) data.append('id', id);
    } else {
      data = { id, ...data };
    }
    return api.put(`/testimonials/update`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  toggleVisibility: (id) => api.patch(`/testimonials/visibility`, { id }),
  delete: (id) => api.delete(`/testimonials/delete`, { data: { id } })
};

export const contactService = {
  submit: (data) => api.post('/contact', data),
  getAll: (data) => api.post('/contact/all', data),
  getById: (id) => api.post(`/contact/by-id`, { id }),
  markAsRead: (id) => api.patch(`/contact/read`, { id }),
  reply: (id, data) => api.post(`/contact/reply`, { id, ...data }),
  delete: (id) => api.delete(`/contact/delete`, { data: { id } })
};

export const settingService = {
  getAll: () => api.post('/settings/all'),
  update: (data) => api.put('/settings/update', data)
};

export const dashboardService = {
  getStats: () => api.post('/dashboard/stats'),
  getRecent: () => api.post('/dashboard/recent'),
  getChartData: (year) => api.post('/dashboard/chart-data', { year })
};

export const notificationService = {
  getAll: (data) => api.post('/notifications/all', data),
  getUnreadCount: () => api.post('/notifications/unread-count'),
  markAsRead: (id) => api.patch(`/notifications/read`, { id }),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/delete`, { data: { id } })
};

export const authService = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  changePassword: (data) => api.put('/auth/password', data)
};
