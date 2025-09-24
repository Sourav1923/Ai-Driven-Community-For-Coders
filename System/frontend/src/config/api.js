// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// API endpoints
export const API_ENDPOINTS = {
    // User endpoints
    LOGIN: '/users/login',
    REGISTER: '/users/register',
    LOGOUT: '/users/logout',
    PROFILE: '/users/profile',
    
    // Project endpoints
    PROJECTS: '/projects',
    PROJECT_BY_ID: (id) => `/projects/${id}`,
    
    // AI endpoints
    AI_CHAT: '/ai/chat',
    
    // Message endpoints
    MESSAGES: '/messages',
    MESSAGES_BY_PROJECT: (projectId) => `/messages/${projectId}`,
    
    // Docker endpoints
    DOCKER_RUN: '/api/docker/run',
    DOCKER_STOP: (containerId) => `/api/docker/stop/${containerId}`,
    DOCKER_STATUS: (containerId) => `/api/docker/status/${containerId}`,
    DOCKER_CONTAINERS: '/api/docker/containers',
    DOCKER_RESTART: (containerId) => `/api/docker/restart/${containerId}`,
    DOCKER_LOGS: (containerId) => `/api/docker/logs/${containerId}`,
    DOCKER_UPDATE: (containerId) => `/api/docker/update/${containerId}`,
    DOCKER_PROJECT_TYPES: '/api/docker/project-types'
};

// Request timeout
export const REQUEST_TIMEOUT = 30000; // 30 seconds

// Default headers
export const DEFAULT_HEADERS = {
    'Content-Type': 'application/json'
};

// Auth headers
export const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        ...DEFAULT_HEADERS,
        'Authorization': token ? `Bearer ${token}` : ''
    };
}; 