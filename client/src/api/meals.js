import api from './client.js';

export const getMeals = (date) => api.get('/meals', { params: { date } }).then(r => r.data);
export const addFoodToMeal = (data) => api.post('/meals/add', data).then(r => r.data);
export const removeMealEntry = (id) => api.delete(`/meals/entry/${id}`).then(r => r.data);
export const getDailyCalories = (date) => api.get('/meals/calories/daily', { params: { date } }).then(r => r.data);
export const getCalorieTrend = () => api.get('/meals/calories/trend').then(r => r.data);
export const searchFoods = (q) => api.get('/foods/search', { params: { q } }).then(r => r.data);
export const createCustomFood = (data) => api.post('/foods', data).then(r => r.data);
