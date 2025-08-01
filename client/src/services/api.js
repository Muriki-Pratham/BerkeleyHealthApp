import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
);

// Survey API calls
export const createUser = async (dormName) => {
  return await api.post('/surveys/user', { dormName });
};

export const checkSurveyStatus = async (userId) => {
  return await api.get(`/surveys/check/${userId}`);
};

export const submitSurvey = async (userId, symptoms, severityLevel) => {
  return await api.post('/surveys/submit', {
    userId,
    symptoms,
    severityLevel,
  });
};

export const getSurveyStats = async () => {
  return await api.get('/surveys/stats');
};

// Analytics API calls
export const getHealthTrends = async (weeks = 4) => {
  return await api.get(`/analytics/trends?weeks=${weeks}`);
};

export const getCurrentWeekAnalytics = async () => {
  return await api.get('/analytics/current-week');
};

export const getSymptomTrends = async (weeks = 4) => {
  return await api.get(`/analytics/symptoms?weeks=${weeks}`);
};

export const getDormAnalytics = async (dormName, weeks = 8) => {
  return await api.get(`/analytics/dorm/${dormName}?weeks=${weeks}`);
};

export const getRiskLevels = async () => {
  return await api.get('/analytics/risk-levels');
};

// Notifications API calls
export const getNotifications = async (dormName) => {
  return await api.get(`/notifications/${dormName}`);
};

export const getAllNotifications = async () => {
  return await api.get('/notifications');
};

export const createNotification = async (dormName, message, severity) => {
  return await api.post('/notifications', {
    dormName,
    message,
    severity,
  });
};

export const deactivateNotification = async (notificationId) => {
  return await api.put(`/notifications/${notificationId}/deactivate`);
};

export const generateAlerts = async () => {
  return await api.post('/notifications/generate-alerts');
};

export const getNotificationStats = async () => {
  return await api.get('/notifications/stats/overview');
};

// Health check
export const healthCheck = async () => {
  return await api.get('/health');
};

export default api;