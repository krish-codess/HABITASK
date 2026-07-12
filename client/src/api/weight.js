import api from './client.js';

export const getWeightLogs = () => api.get('/weight').then(r => r.data);
export const addWeight = (weight, date) => api.post('/weight', { weight, date }).then(r => r.data);
export const deleteWeight = (id) => api.delete(`/weight/${id}`).then(r => r.data);
