import api from './axios.js';

// Auth
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/users/me');

// Halls
export const getHalls = () => api.get('/halls');
export const getRooms = (hallId) => api.get(`/halls/${hallId}/rooms`);
export const createHall = (data) => api.post('/halls', data);
export const updateHall = (id, data) => api.patch(`/halls/${id}`, data);
export const deleteHall = (id) => api.delete(`/halls/${id}`);
export const createRoom = (hallId, data) => api.post(`/halls/${hallId}/rooms`, data);
export const updateRoom = (hallId, roomId, data) => api.patch(`/halls/${hallId}/rooms/${roomId}`, data);
export const deleteRoom = (hallId, roomId) => api.delete(`/halls/${hallId}/rooms/${roomId}`);

// Complaints
export const getComplaints = () => api.get('/complaints');
export const getMyComplaints = () => api.get('/complaints/mine');
export const getComplaint = (id) => api.get(`/complaints/${id}`);
export const createComplaint = (data) => api.post('/complaints', data);
export const updateComplaintStatus = (id, data) =>
  api.patch(`/complaints/${id}/status`, data);
export const getComplaintHistory = (id) => api.get(`/complaints/${id}/history`);
export const addComment = (id, data) => api.post(`/complaints/${id}/comments`, data);
export const assignComplaint = (id, data) => api.patch(`/complaints/${id}/assign`, data);
export const previewAI = (data) => api.post('/complaints/ai-preview', data);
export const contestComplaint = (id, data) => api.post(`/complaints/${id}/contest`, data);
export const searchAssets = (params) => api.get('/assets/search', { params });

// Assets
export const getAssets = (params) => api.get('/assets', { params });
export const getDueAssets = () => api.get('/assets/due');
export const createAsset = (data) => api.post('/assets', data);
export const updateAsset = (id, data) => api.patch(`/assets/${id}`, data);
export const deleteAsset = (id) => api.delete(`/assets/${id}`);

// Users
export const getOfficers = (params) => api.get('/users/officers', { params });
export const getAllUsers = () => api.get('/users');
export const getUser = (id) => api.get(`/users/${id}`);
export const createUser = (data) => api.post('/users', data);
export const updateUser = (id, data) => api.patch(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);

// AI Config
export const getAIConfig = () => api.get('/admin/ai-config');
export const saveAIConfig = (data) => api.post('/admin/ai-config', data);
export const testAIConfig = (data) => api.post('/admin/ai-config/test', data);
