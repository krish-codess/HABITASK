import api from './client.js';

export const getAnalyticsSummary = (days = 30) =>
  api.get('/analytics/summary', { params: { days } }).then(r => r.data);

export const getAnalyticsHeatmap = () =>
  api.get('/analytics/heatmap').then(r => r.data);

export const getAnalyticsInsights = () =>
  api.get('/analytics/insights').then(r => r.data);
