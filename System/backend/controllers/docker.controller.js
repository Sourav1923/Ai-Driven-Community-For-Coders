import dockerExecutionService from '../services/docker.service.js';
import { validationResult } from 'express-validator';

class DockerController {
    // Run a full-stack project in Docker
    async runProject(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    success: false, 
                    errors: errors.array() 
                });
            }

            const { projectId, projectType } = req.body;
            const projectFiles = req.files || req.body.files;

            if (!projectFiles) {
                return res.status(400).json({
                    success: false,
                    error: 'Project files are required'
                });
            }

            // Run the project
            const result = await dockerExecutionService.runProject(
                projectId, 
                projectFiles, 
                projectType
            );

            res.status(200).json({
                success: true,
                data: result
            });

        } catch (error) {
            console.error('Error in runProject:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to run project'
            });
        }
    }

    // Run a project directly from file tree structure
    async runProjectFromTree(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    success: false, 
                    errors: errors.array() 
                });
            }

            const { projectId, projectType, fileTree } = req.body;

            if (!fileTree || typeof fileTree !== 'object') {
                return res.status(400).json({
                    success: false,
                    error: 'File tree is required'
                });
            }

            // Run the project from file tree
            const result = await dockerExecutionService.runProjectFromTree(
                projectId, 
                fileTree, 
                projectType
            );

            res.status(200).json({
                success: true,
                data: result
            });

        } catch (error) {
            console.error('Error in runProjectFromTree:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to run project from tree',
                details: error.stack
            });
        }
    }

    // Stop a running project
    async stopProject(req, res) {
        try {
            const { containerId } = req.params;

            if (!containerId) {
                return res.status(400).json({
                    success: false,
                    error: 'Container ID is required'
                });
            }

            const result = await dockerExecutionService.stopProject(containerId);

            res.status(200).json({
                success: true,
                data: result
            });

        } catch (error) {
            console.error('Error in stopProject:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to stop project'
            });
        }
    }

    // Get container status
    async getContainerStatus(req, res) {
        try {
            const { containerId } = req.params;

            if (!containerId) {
                return res.status(400).json({
                    success: false,
                    error: 'Container ID is required'
                });
            }

            const status = await dockerExecutionService.getContainerStatus(containerId);

            // Update last accessed time
            dockerExecutionService.updateLastAccessed(containerId);

            res.status(200).json({
                success: true,
                data: status
            });

        } catch (error) {
            console.error('Error in getContainerStatus:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to get container status'
            });
        }
    }

    // Get all active containers
    async getActiveContainers(req, res) {
        try {
            const containers = dockerExecutionService.getActiveContainers();

            res.status(200).json({
                success: true,
                data: containers
            });

        } catch (error) {
            console.error('Error in getActiveContainers:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to get active containers'
            });
        }
    }

    // Restart a container
    async restartContainer(req, res) {
        try {
            const { containerId } = req.params;

            if (!containerId) {
                return res.status(400).json({
                    success: false,
                    error: 'Container ID is required'
                });
            }

            // Get current container info
            const containerInfo = dockerExecutionService.activeContainers.get(containerId);
            if (!containerInfo) {
                return res.status(404).json({
                    success: false,
                    error: 'Container not found'
                });
            }

            // Stop the container
            await dockerExecutionService.stopProject(containerId);

            // Restart with the same configuration
            const result = await dockerExecutionService.runProject(
                containerInfo.projectId,
                containerInfo.projectFiles,
                containerInfo.projectType
            );

            res.status(200).json({
                success: true,
                data: result
            });

        } catch (error) {
            console.error('Error in restartContainer:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to restart container'
            });
        }
    }

    // Get container logs
    async getContainerLogs(req, res) {
        try {
            const { containerId } = req.params;
            const { tail = 100 } = req.query;

            if (!containerId) {
                return res.status(400).json({
                    success: false,
                    error: 'Container ID is required'
                });
            }

            const containerInfo = dockerExecutionService.activeContainers.get(containerId);
            if (!containerInfo) {
                return res.status(404).json({
                    success: false,
                    error: 'Container not found'
                });
            }

            const logs = await containerInfo.container.logs({
                stdout: true,
                stderr: true,
                tail: parseInt(tail)
            });

            res.status(200).json({
                success: true,
                data: {
                    logs: logs.toString(),
                    containerId
                }
            });

        } catch (error) {
            console.error('Error in getContainerLogs:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to get container logs'
            });
        }
    }

    // Update project files and restart
    async updateProject(req, res) {
        try {
            const { containerId } = req.params;
            const projectFiles = req.files || req.body.files;

            if (!projectFiles) {
                return res.status(400).json({
                    success: false,
                    error: 'Project files are required'
                });
            }

            const containerInfo = dockerExecutionService.activeContainers.get(containerId);
            if (!containerInfo) {
                return res.status(404).json({
                    success: false,
                    error: 'Container not found'
                });
            }

            // Stop current container
            await dockerExecutionService.stopProject(containerId);

            // Start new container with updated files
            const result = await dockerExecutionService.runProject(
                containerInfo.projectId,
                projectFiles,
                containerInfo.projectType
            );

            res.status(200).json({
                success: true,
                data: result
            });

        } catch (error) {
            console.error('Error in updateProject:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to update project'
            });
        }
    }

    // Update project from file tree and restart
    async updateProjectFromTree(req, res) {
        try {
            const { containerId } = req.params;
            const { fileTree } = req.body;

            if (!fileTree || typeof fileTree !== 'object') {
                return res.status(400).json({
                    success: false,
                    error: 'File tree is required'
                });
            }

            const containerInfo = dockerExecutionService.activeContainers.get(containerId);
            if (!containerInfo) {
                return res.status(404).json({
                    success: false,
                    error: 'Container not found'
                });
            }

            // Stop current container
            await dockerExecutionService.stopProject(containerId);

            // Start new container with updated file tree
            const result = await dockerExecutionService.runProjectFromTree(
                containerInfo.projectId,
                fileTree,
                containerInfo.projectType
            );

            res.status(200).json({
                success: true,
                data: result
            });

        } catch (error) {
            console.error('Error in updateProjectFromTree:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to update project from tree'
            });
        }
    }

    // Get supported project types
    async getSupportedProjectTypes(req, res) {
        try {
            const projectTypes = [
                {
                    id: 'nextjs',
                    name: 'Next.js',
                    description: 'React framework for production',
                    port: 3002,
                    buildCommand: 'npm run build',
                    startCommand: 'npm start'
                },
                {
                    id: 'react',
                    name: 'React',
                    description: 'JavaScript library for building user interfaces',
                    port: 3001,
                    buildCommand: 'npm run build',
                    startCommand: 'npm start'
                },
                {
                    id: 'angular',
                    name: 'Angular',
                    description: 'Platform for building mobile and desktop web applications',
                    port: 4200,
                    buildCommand: 'npm run build',
                    startCommand: 'npm start'
                },
                {
                    id: 'nodejs',
                    name: 'Node.js',
                    description: 'JavaScript runtime for server-side applications',
                    port: 3000,
                    buildCommand: 'npm install',
                    startCommand: 'npm start'
                }
            ];

            res.status(200).json({
                success: true,
                data: projectTypes
            });

        } catch (error) {
            console.error('Error in getSupportedProjectTypes:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to get supported project types'
            });
        }
    }
}

export default new DockerController(); 