import api from './client.js';

export const scanBarcode = (code) => api.get(`/barcode/${code}`).then(r => r.data);
export const addScannedFood = (data) => api.post('/barcode/add', data).then(r => r.data);
