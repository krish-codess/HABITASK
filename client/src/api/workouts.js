import api from './client.js';

export const getWorkouts = (params) => api.get('/workouts', { params }).then(r => r.data);
export const createWorkout = (data) => api.post('/workouts', data).then(r => r.data);
export const deleteWorkout = (id) => api.delete(`/workouts/${id}`).then(r => r.data);
export const getWeeklySummary = () => api.get('/workouts/summary/weekly').then(r => r.data);
