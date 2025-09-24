import { API_BASE_URL } from '../config/api';

class DockerExecutionService {
    constructor() {
        this.baseUrl = `${API_BASE_URL}/api/docker`;
        this.activeContainers = new Map();
    }

    // Helper method for API calls
    async apiCall(endpoint, options = {}) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    ...options.headers
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Docker API call failed:', error);
            throw error;
        }
    }

    // Run a full-stack project
    async runProject(projectId, projectFiles, projectType = null) {
        try {
            const formData = new FormData();
            formData.append('projectId', projectId);
            
            if (projectType) {
                formData.append('projectType', projectType);
            }

            // Add files to form data
            if (Array.isArray(projectFiles)) {
                projectFiles.forEach(file => {
                    formData.append('files', file);
                });
            } else {
                formData.append('files', projectFiles);
            }

            const token = localStorage.getItem('token');
            const response = await fetch(`${this.baseUrl}/run`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            // Store container info locally
            if (result.success && result.data) {
                this.activeContainers.set(result.data.containerId, {
                    ...result.data,
                    projectId,
                    projectType
                });
            }

            return result;
        } catch (error) {
            console.error('Error running project:', error);
            throw error;
        }
    }

    // Run a project directly from file tree structure
    async runProjectFromTree(projectId, fileTree, projectType = null) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.baseUrl}/run-from-tree`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    projectId,
                    fileTree,
                    projectType
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            // Store container info locally
            if (result.success && result.data) {
                this.activeContainers.set(result.data.containerId, {
                    ...result.data,
                    projectId,
                    projectType,
                    fileTree
                });
            }

            return result;
        } catch (error) {
            console.error('Error running project from tree:', error);
            throw error;
        }
    }

    // Stop a running project
    async stopProject(containerId) {
        try {
            const result = await this.apiCall(`/stop/${containerId}`, {
                method: 'DELETE'
            });

            if (result.success) {
                this.activeContainers.delete(containerId);
            }

            return result;
        } catch (error) {
            console.error('Error stopping project:', error);
            throw error;
        }
    }

    // Get container status
    async getContainerStatus(containerId) {
        try {
            const result = await this.apiCall(`/status/${containerId}`);
            return result;
        } catch (error) {
            console.error('Error getting container status:', error);
            throw error;
        }
    }

    // Get all active containers
    async getActiveContainers() {
        try {
            const result = await this.apiCall('/containers');
            
            if (result.success) {
                // Update local cache
                result.data.forEach(container => {
                    this.activeContainers.set(container.containerId, container);
                });
            }

            return result;
        } catch (error) {
            console.error('Error getting active containers:', error);
            throw error;
        }
    }

    // Restart a container
    async restartContainer(containerId) {
        try {
            const result = await this.apiCall(`/restart/${containerId}`, {
                method: 'POST'
            });

            if (result.success && result.data) {
                // Update local cache
                this.activeContainers.set(containerId, {
                    ...this.activeContainers.get(containerId),
                    ...result.data
                });
            }

            return result;
        } catch (error) {
            console.error('Error restarting container:', error);
            throw error;
        }
    }

    // Get container logs
    async getContainerLogs(containerId, tail = 100) {
        try {
            const result = await this.apiCall(`/logs/${containerId}?tail=${tail}`);
            return result;
        } catch (error) {
            console.error('Error getting container logs:', error);
            throw error;
        }
    }

    // Update project files and restart
    async updateProject(containerId, projectFiles) {
        try {
            const formData = new FormData();
            
            // Add files to form data
            if (Array.isArray(projectFiles)) {
                projectFiles.forEach(file => {
                    formData.append('files', file);
                });
            } else {
                formData.append('files', projectFiles);
            }

            const token = localStorage.getItem('token');
            const response = await fetch(`${this.baseUrl}/update/${containerId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success && result.data) {
                // Update local cache
                this.activeContainers.set(containerId, {
                    ...this.activeContainers.get(containerId),
                    ...result.data
                });
            }

            return result;
        } catch (error) {
            console.error('Error updating project:', error);
            throw error;
        }
    }

    // Update project from file tree and restart
    async updateProjectFromTree(containerId, fileTree) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.baseUrl}/update-from-tree/${containerId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fileTree
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success && result.data) {
                // Update local cache
                this.activeContainers.set(containerId, {
                    ...this.activeContainers.get(containerId),
                    ...result.data,
                    fileTree
                });
            }

            return result;
        } catch (error) {
            console.error('Error updating project from tree:', error);
            throw error;
        }
    }

    // Get supported project types
    async getSupportedProjectTypes() {
        try {
            const result = await this.apiCall('/project-types');
            return result;
        } catch (error) {
            console.error('Error getting supported project types:', error);
            throw error;
        }
    }

    // Get local container info
    getLocalContainerInfo(containerId) {
        return this.activeContainers.get(containerId);
    }

    // Get all local containers
    getAllLocalContainers() {
        return Array.from(this.activeContainers.values());
    }

    // Check if container is running locally
    isContainerRunning(containerId) {
        return this.activeContainers.has(containerId);
    }

    // Clear local cache
    clearLocalCache() {
        this.activeContainers.clear();
    }

    // Poll container status
    async pollContainerStatus(containerId, interval = 5000, maxAttempts = 60) {
        let attempts = 0;
        
        return new Promise((resolve, reject) => {
            const poll = async () => {
                try {
                    attempts++;
                    const result = await this.getContainerStatus(containerId);
                    
                    if (result.success) {
                        const status = result.data.status;
                        
                        if (status === 'running') {
                            resolve(result.data);
                        } else if (status === 'exited' || status === 'error') {
                            reject(new Error(`Container ${status}`));
                        } else if (attempts >= maxAttempts) {
                            reject(new Error('Container startup timeout'));
                        } else {
                            setTimeout(poll, interval);
                        }
                    } else {
                        reject(new Error(result.error || 'Failed to get container status'));
                    }
                } catch (error) {
                    if (attempts >= maxAttempts) {
                        reject(error);
                    } else {
                        setTimeout(poll, interval);
                    }
                }
            };
            
            poll();
        });
    }
}

// Create singleton instance
const dockerExecutionService = new DockerExecutionService();
export default dockerExecutionService; 