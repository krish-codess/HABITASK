import api from './client.js';

export const getWater = (date) => api.get('/water', { params: { date } }).then(r => r.data);
export const addWater = (amount, date) => api.post('/water', { amount, date }).then(r => r.data);
export const deleteWater = (id) => api.delete(`/water/${id}`).then(r => r.data);
