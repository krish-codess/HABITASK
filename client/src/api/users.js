import api from './client.js';

export const getProfile = () => api.get('/users/profile').then(r => r.data);
export const updateProfile = (data) => api.put('/users/profile', data).then(r => r.data);
export const updateGoals = (data) => api.put('/users/goals', data).then(r => r.data);
