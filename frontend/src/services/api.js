import axios from 'axios';

const API = axios.create({ 
  baseURL: import.meta.env.VITE_API_URL || 'https://eventsphere-backend-y02n.onrender.com/api'
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

// Bookings
export const createBooking = (data) => API.post('/bookings', data);
export const getMyBookings = () => API.get('/bookings/my');
export const getEventBookings = (id) => API.get(`/bookings/event/${id}`);
export const checkIn = (code) => API.put(`/bookings/checkin/${code}`);
export const cancelBooking = (id) => API.put(`/bookings/cancel/${id}`);

// Admin
export const getAdminStats = () => API.get('/admin/stats');
export const getAdminEvents = (params) => API.get('/admin/events', { params });
export const updateEventStatus = (id, status) => API.put(`/admin/events/${id}/status`, { status });
export const getAdminUsers = () => API.get('/admin/users');
export const toggleUserStatus = (id) => API.put(`/admin/users/${id}/status`);
export const getAdminBookings = () => API.get('/admin/bookings');

export default API;