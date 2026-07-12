import api from './client.js';

export const getFriends = () => api.get('/friends').then(r => r.data);
export const sendFriendRequest = (receiverId) => api.post('/friends/request', { receiverId }).then(r => r.data);
export const getPendingRequests = () => api.get('/friends/requests/pending').then(r => r.data);
export const acceptRequest = (id) => api.put(`/friends/request/${id}/accept`).then(r => r.data);
export const rejectRequest = (id) => api.put(`/friends/request/${id}/reject`).then(r => r.data);
export const unfriend = (id) => api.delete(`/friends/${id}`).then(r => r.data);
export const searchUsers = (q) => api.get('/users/search', { params: { q } }).then(r => r.data);
export const getFeed = () => api.get('/feed').then(r => r.data);
export const getLeaderboard = () => api.get('/feed/leaderboard').then(r => r.data);
export const vote = (activityId, value) => api.post('/votes', { activityId, value }).then(r => r.data);
