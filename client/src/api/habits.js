import api from './client.js';

export const getHabits = () => api.get('/habits').then(r => r.data);
export const createHabit = (data) => api.post('/habits', data).then(r => r.data);
export const updateHabit = (id, data) => api.put(`/habits/${id}`, data).then(r => r.data);
export const deleteHabit = (id) => api.delete(`/habits/${id}`).then(r => r.data);
export const getHabitLogs = (date) => api.get('/habits/logs', { params: { date } }).then(r => r.data);
export const toggleHabitLog = (habitId, date) => api.post(`/habits/logs/${habitId}/toggle`, { date }).then(r => r.data);
export const getHeatmap = () => api.get('/habits/heatmap').then(r => r.data);
export const getStreak = (habitId) => api.get(`/habits/${habitId}/streak`).then(r => r.data);
