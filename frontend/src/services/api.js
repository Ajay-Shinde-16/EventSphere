import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://eventsphere-backend-y02n.onrender.com/api',
  timeout: 45000, // 45s — Render free tier can take ~30-50s to wake from a cold start
});

API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('eventsphere_user') || 'null');
  if (user?.token) config.headers.Authorization = `Bearer ${user.token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('eventsphere_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = (data) => API.post('/auth/login', data);
export const register = (data) => API.post('/auth/register', data);
export const registerAdmin = (data) => API.post('/auth/register-admin', data);
export const getProfile = () => API.get('/auth/me');
export const updateProfile = (data) => API.put('/auth/me', data);
export const forgotPassword = (email) => API.post('/auth/forgot-password', { email });
export const resetPassword  = (token, password) => API.post(`/auth/reset-password/${token}`, { password });

// Events
export const getEvents = (params) => API.get('/events', { params });
export const getEvent = (id) => API.get(`/events/${id}`);
export const getMyEvents = () => API.get('/events/my');
export const createEvent = (data) => API.post('/events', data);
export const updateEvent = (id, data) => API.put(`/events/${id}`, data);
export const deleteEvent = (id) => API.delete(`/events/${id}`);
export const joinWaitlist = (id) => API.post(`/events/${id}/waitlist`);
export const rateEvent = (id, data) => API.post(`/events/${id}/rate`, data);
export const getEventRatings = (id) => API.get(`/events/${id}/ratings`);
export const getWaitlistDetails = (id) => API.get(`/events/${id}/waitlist/details`);

// Bookings
export const createBooking = (data) => API.post('/bookings', data);
export const emailTicketImage = (bookingId, base64File, format = 'png') =>
  API.post(`/bookings/${bookingId}/email-ticket-image`, { base64File, format });
export const getMyBookings = () => API.get('/bookings/my');
export const getEventBookings = (id) => API.get(`/bookings/event/${id}`);
export const broadcastToAttendees = (eventId, data) => API.post(`/bookings/event/${eventId}/broadcast`, data);
export const checkIn = (code, eventId) => API.put(`/bookings/checkin/${code}`, { eventId });
export const cancelBooking = (id) => API.put(`/bookings/cancel/${id}`);

// Admin
export const getAdminStats = () => API.get('/admin/stats');
export const getAdminEvents = (params) => API.get('/admin/events', { params });
export const updateEventStatus = (id, status) => API.put(`/admin/events/${id}/status`, { status });
export const getAdminUsers = () => API.get('/admin/users');
export const toggleUserStatus = (id) => API.put(`/admin/users/${id}/status`);
export const getAdminBookings = () => API.get('/admin/bookings');

// Notifications
export const getNotifications = () => API.get('/notifications');
export const markNotificationRead = (id) => API.put(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => API.put('/notifications/read-all');

// Payments
export const createPaymentOrder = (data) => API.post('/payments/create-order', data);

export default API;