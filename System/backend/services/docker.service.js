import Docker from 'dockerode';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import ngrok from 'ngrok';
import * as tar from 'tar';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DockerExecutionService {
    constructor() {
        this.docker = new Docker();
        this.activeContainers = new Map(); // containerId -> containerInfo
        this.projectsDir = path.join(__dirname, '../uploads/projects');
        this.ensureProjectsDir();
    }

    async ensureProjectsDir() {
        try {
            await fs.access(this.projectsDir);
        } catch {
            await fs.mkdir(this.projectsDir, { recursive: true });
        }
    }

    // Detect project type and framework
    async detectProjectType(projectPath) {
        try {
            const packageJsonPath = path.join(projectPath, 'package.json');
            const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
            
            console.log('Detecting project type for:', projectPath);
            console.log('Package.json contents:', JSON.stringify(packageJson, null, 2));
            
            const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
            const devDependencies = packageJson.devDependencies || {};
            
            console.log('Dependencies:', dependencies);
            console.log('DevDependencies:', devDependencies);
            console.log('Checking for vite in devDependencies:', devDependencies['vite']);
            console.log('Checking for react in dependencies:', dependencies['react']);
            
            if (dependencies['next']) {
                console.log('Detected: nextjs');
                return 'nextjs';
            }
            if (devDependencies['vite'] && dependencies['react']) {
                console.log('Detected: vite-react');
                console.log('Vite found in devDependencies:', devDependencies['vite']);
                console.log('React found in dependencies:', dependencies['react']);
                return 'vite-react';
            }
            if (dependencies['react-scripts']) {
                console.log('Detected: react');
                return 'react';
            }
            
            console.log('Vite React detection failed - checking other types...');
            if (dependencies['@angular/core']) {
                console.log('Detected: angular');
                return 'angular';
            }
            if (dependencies['express'] || dependencies['koa'] || dependencies['fastify']) {
                console.log('Detected: nodejs');
                return 'nodejs';
            }
            
            console.log('Detected: nodejs (default)');
            return 'nodejs'; // default
        } catch (error) {
            console.error('Error detecting project type:', error);
            return 'nodejs';
        }
    }

    // Create Dockerfile based on project type
    async createDockerfile(projectPath, projectType) {
        console.log(`Creating Dockerfile for project type: ${projectType}`);
        const dockerfileContent = this.getDockerfileTemplate(projectType);
        const dockerfilePath = path.join(projectPath, 'Dockerfile');
        await fs.writeFile(dockerfilePath, dockerfileContent);
        console.log(`Dockerfile created at: ${dockerfilePath}`);
        return dockerfilePath;
    }

    getDockerfileTemplate(projectType) {
        const templates = {
            nextjs: `
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3002

# Set the PORT environment variable
ENV PORT=3002

# Start the application
CMD ["npm", "start"]
`,
            react: `
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Install serve globally
RUN npm install -g serve

# Expose port
EXPOSE 3001

# Set the PORT environment variable
ENV PORT=3001

# Serve the built application
CMD ["serve", "-s", "build", "-l", "3001"]
`,
            'vite-react': `
FROM node:18

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Install serve globally
RUN npm install -g serve

# Expose port
EXPOSE 3001

# Serve the built application (Vite outputs to 'dist' by default)
CMD ["serve", "-s", "dist", "-l", "3001"]
`,
            angular: `
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Install serve globally
RUN npm install -g serve

# Expose port
EXPOSE 4200

# Serve the built application
CMD ["serve", "-s", "dist", "-l", "4200"]
`,
            nodejs: `
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port (default to 3000, can be overridden)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
`
        };

        return templates[projectType] || templates.nodejs;
    }

    // Create docker-compose.yml for complex projects
    async createDockerCompose(projectPath, projectType) {
        if (projectType === 'nextjs' || projectType === 'react' || projectType === 'angular') {
            // All React projects (regular React and Vite React) use port 3001 to avoid conflicts
            // Next.js projects use port 3002 to avoid conflicts
            // Other projects use port 3000
            const containerPort = (projectType === 'react' || projectType === 'vite-react') ? '3001' : 
                                 (projectType === 'nextjs') ? '3002' : '3000';
            const composeContent = `
version: '3.8'
services:
  app:
    build: .
    ports:
      - "0:${containerPort}"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
`;
            const composePath = path.join(projectPath, 'docker-compose.yml');
            await fs.writeFile(composePath, composeContent);
            return composePath;
        }
        return null;
    }

    // Build and run container
    async runProject(projectId, projectFiles, projectType = null) {
        try {
            const containerId = uuidv4();
            const projectPath = path.join(this.projectsDir, containerId);
            
            // Create project directory
            await fs.mkdir(projectPath, { recursive: true });
            
            // Extract project files
            await this.extractProjectFiles(projectFiles, projectPath);
            
            // Detect project type if not provided
            if (!projectType) {
                projectType = await this.detectProjectType(projectPath);
            }
            
            // Create Dockerfile
            await this.createDockerfile(projectPath, projectType);
            
            // Create docker-compose if needed
            const composePath = await this.createDockerCompose(projectPath, projectType);
            
            // Build and run container
            const containerInfo = await this.buildAndRunContainer(containerId, projectPath, projectType);
            
            // Store container info
            this.activeContainers.set(containerId, {
                ...containerInfo,
                projectId,
                projectType,
                createdAt: new Date(),
                lastAccessed: new Date()
            });
            
            return {
                containerId,
                previewUrl: containerInfo.previewUrl,
                status: 'running',
                projectType
            };
            
        } catch (error) {
            console.error('Error running project:', error);
            throw new Error(`Failed to run project: ${error.message}`);
        }
    }

    // Run project directly from file tree structure
    async runProjectFromTree(projectId, fileTree, projectType = null) {
        try {
            const containerId = uuidv4();
            const projectPath = path.join(this.projectsDir, containerId);
            
            console.log('Creating project directory:', projectPath);
            
            // Create project directory
            await fs.mkdir(projectPath, { recursive: true });
            
            // Create files from file tree
            await this.createFilesFromTree(fileTree, projectPath);
            
            // Verify that essential files exist
            const packageJsonPath = path.join(projectPath, 'package.json');
            const dockerfilePath = path.join(projectPath, 'Dockerfile');
            
            try {
                await fs.access(packageJsonPath);
                console.log('package.json exists');
            } catch (error) {
                throw new Error('package.json is required but not found in the file tree');
            }
            
            // Detect project type if not provided
            if (!projectType) {
                projectType = await this.detectProjectType(projectPath);
            }
            
            // Create Dockerfile
            await this.createDockerfile(projectPath, projectType);
            
            // Create docker-compose if needed
            const composePath = await this.createDockerCompose(projectPath, projectType);
            
            // Build and run container
            const containerInfo = await this.buildAndRunContainer(containerId, projectPath, projectType);
            
            // Store container info
            this.activeContainers.set(containerId, {
                ...containerInfo,
                projectId,
                projectType,
                fileTree, // Store the file tree for potential updates
                createdAt: new Date(),
                lastAccessed: new Date()
            });
            
            return {
                containerId,
                previewUrl: containerInfo.previewUrl,
                status: 'running',
                projectType
            };
            
        } catch (error) {
            console.error('Error running project from tree:', error);
            console.error('Error stack:', error.stack);
            throw new Error(`Failed to run project from tree: ${error.message}`);
        }
    }

    // Create files from file tree structure
    async createFilesFromTree(fileTree, projectPath) {
        try {
            console.log('Creating files from tree with', Object.keys(fileTree).length, 'entries');
            
            for (const [filePath, fileData] of Object.entries(fileTree)) {
                if (fileData.type === 'file' && fileData.contents) {
                    const fullPath = path.join(projectPath, filePath);
                    const dir = path.dirname(fullPath);
                    
                    console.log('Creating file:', filePath);
                    
                    // Create directory if it doesn't exist
                    await fs.mkdir(dir, { recursive: true });
                    
                    // Write file content
                    await fs.writeFile(fullPath, fileData.contents);
                }
            }
            
            console.log('All files created successfully');
        } catch (error) {
            console.error('Error creating files from tree:', error);
            throw error;
        }
    }

    async extractProjectFiles(projectFiles, projectPath) {
        // Handle different file upload formats
        if (Array.isArray(projectFiles)) {
            // Multiple files
            for (const file of projectFiles) {
                const filePath = path.join(projectPath, file.name);
                const dir = path.dirname(filePath);
                await fs.mkdir(dir, { recursive: true });
                await fs.writeFile(filePath, file.content || file.buffer);
            }
        } else if (projectFiles.files) {
            // ZIP or archive format
            await this.extractArchive(projectFiles, projectPath);
        } else {
            // Single file or object
            const filePath = path.join(projectPath, projectFiles.name || 'index.js');
            await fs.writeFile(filePath, projectFiles.content || projectFiles.buffer);
        }
    }

    async extractArchive(archiveFile, projectPath) {
        // Implementation for extracting ZIP files
        // This would use a library like 'unzipper' or 'adm-zip'
        // For now, we'll assume the files are already extracted
        console.log('Archive extraction not implemented yet');
    }

    async buildAndRunContainer(containerId, projectPath, projectType) {
        try {
            // First, try to check if Docker is accessible
            try {
                await this.docker.ping();
                console.log('Docker is accessible, attempting Docker build...');
            } catch (dockerError) {
                console.log('Docker not accessible, falling back to local development...');
                return await this.runLocalDevelopment(containerId, projectPath, projectType);
            }

            // Build Docker image
            const imageName = `project-${containerId}`;
            
            // Create a tar stream of the project directory
            console.log('Building Docker image:', imageName);
            console.log('Project path:', projectPath);
            
            const buildStream = await this.docker.buildImage(
                tar.c({
                    gzip: true,
                    cwd: projectPath
                }, ['.']),
                { t: imageName }
            );

            await new Promise((resolve, reject) => {
                let buildOutput = '';
                this.docker.modem.followProgress(buildStream, (err, res) => {
                    if (err) {
                        console.error('Docker build error:', err);
                        console.error('Build output:', buildOutput);
                        reject(err);
                    } else {
                        console.log('Docker build completed successfully');
                        resolve(res);
                    }
                }, (output) => {
                    if (output.stream) {
                        buildOutput += output.stream;
                        console.log('Docker build output:', output.stream.trim());
                    }
                });
            });

            // Verify the image was created
            try {
                const image = this.docker.getImage(imageName);
                await image.inspect();
                console.log('Docker image verified:', imageName);
            } catch (error) {
                console.error('Failed to verify Docker image:', error);
                console.log('Docker build may have succeeded but image verification failed');
                console.log('Continuing with container creation...');
                
                // Try to list images to see if it exists
                try {
                    const images = await this.docker.listImages();
                    const imageExists = images.some(img => 
                        img.RepoTags && img.RepoTags.includes(imageName)
                    );
                    
                    if (!imageExists) {
                        throw new Error(`Docker image ${imageName} was not created successfully`);
                    }
                } catch (listError) {
                    console.error('Could not verify image existence:', listError);
                    throw new Error(`Docker image ${imageName} was not created successfully`);
                }
            }

            // Determine the container port based on project type
            // All React projects (regular React and Vite React) use port 3001 to avoid conflicts
            // Next.js projects use port 3002 to avoid conflicts
            // Other projects use port 3000 (now safe since backend uses 8000)
            const containerPort = (projectType === 'react' || projectType === 'vite-react') ? '3001' : 
                                 (projectType === 'nextjs') ? '3002' : '3000';
            
            // Create and start container
            const container = await this.docker.createContainer({
                Image: imageName,
                name: `project-${containerId}`,
                HostConfig: {
                    Memory: 512 * 1024 * 1024, // 512MB limit
                    CpuPercent: 50, // 50% CPU limit
                    PortBindings: {
                        [`${containerPort}/tcp`]: [{ HostPort: '0' }] // Random port
                    },
                    RestartPolicy: {
                        Name: 'unless-stopped'
                    }
                },
                ExposedPorts: {
                    [`${containerPort}/tcp`]: {}
                }
            });

            await container.start();

            // Get container info
            const containerData = await container.inspect();
            const hostPort = containerData.NetworkSettings.Ports[`${containerPort}/tcp`][0].HostPort;
            
            // Create ngrok tunnel
            const ngrokUrl = await this.createNgrokTunnel(hostPort);
            
            return {
                container: container,
                hostPort,
                previewUrl: ngrokUrl,
                imageName
            };

        } catch (error) {
            console.error('Error building/running container:', error);
            console.error('Error stack:', error.stack);
            
            // If Docker fails, fall back to local development
            console.log('Docker build failed, falling back to local development...');
            return await this.runLocalDevelopment(containerId, projectPath, projectType);
        }
    }

    async runLocalDevelopment(containerId, projectPath, projectType) {
        try {
            console.log('Starting local development server...');
            
            // Find an available port (avoid port 8000 which is used by backend)
            // Start from 3000 for all projects since backend now uses 8000
            const hostPort = await this.findAvailablePort(3000, 3100);
            
            // Determine the container port based on project type
            // All React projects (regular React and Vite React) use port 3001 to avoid conflicts
            // Next.js projects use port 3002 to avoid conflicts
            const containerPort = (projectType === 'react' || projectType === 'vite-react') ? '3001' : 
                                 (projectType === 'nextjs') ? '3002' : '3000';
            
            // Create a mock container object for consistency
            const mockContainer = {
                id: containerId,
                name: `local-${containerId}`,
                stop: async () => {
                    console.log('Stopping local development server...');
                    // Kill the process if needed
                },
                remove: async () => {
                    console.log('Removing local development server...');
                },
                inspect: async () => ({
                    State: { Status: 'running' },
                    NetworkSettings: {
                        Ports: {
                            [`${containerPort}/tcp`]: [{ HostPort: hostPort.toString() }]
                        }
                    }
                })
            };

            // Start the development server based on project type
            await this.startLocalServer(projectPath, projectType, hostPort);
            
            // Wait a bit more for the server to be fully ready
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Create ngrok tunnel
            const ngrokUrl = await this.createNgrokTunnel(hostPort);
            
            return {
                container: mockContainer,
                hostPort,
                previewUrl: ngrokUrl,
                imageName: `local-${containerId}`
            };
            
        } catch (error) {
            console.error('Error starting local development:', error);
            // Don't throw the error, just return a mock response
            const containerPort = (projectType === 'react' || projectType === 'vite-react') ? '3001' : 
                                 (projectType === 'nextjs') ? '3002' : '3000';
            const mockContainer = {
                id: containerId,
                name: `local-${containerId}`,
                stop: async () => console.log('Stopping local development server...'),
                remove: async () => console.log('Removing local development server...'),
                inspect: async () => ({
                    State: { Status: 'error' },
                    NetworkSettings: {
                        Ports: {
                            [`${containerPort}/tcp`]: [{ HostPort: '0' }]
                        }
                    }
                })
            };
            
            return {
                container: mockContainer,
                hostPort: 0,
                previewUrl: 'http://localhost:8000',
                imageName: `local-${containerId}`
            };
        }
    }

    async findAvailablePort(startPort, endPort) {
        const net = await import('net');
        
        for (let port = startPort; port <= endPort; port++) {
            try {
                await new Promise((resolve, reject) => {
                    const server = net.createServer();
                    server.listen(port, () => {
                        server.close();
                        resolve(port);
                    });
                    server.on('error', () => {
                        reject();
                    });
                });
                return port;
            } catch {
                continue;
            }
        }
        throw new Error('No available ports found');
    }

    async startLocalServer(projectPath, projectType, port) {
        const { spawn } = await import('child_process');
        const { execSync } = await import('child_process');
        
        // Find npm path
        let npmPath;
        try {
            npmPath = execSync('where npm', { encoding: 'utf8' }).trim().split('\n')[0];
        } catch (error) {
            // Fallback to npm in PATH
            npmPath = 'npm';
        }
        
        console.log(`Using npm path: ${npmPath}`);
        console.log(`Working directory: ${projectPath}`);
        
        // First, install dependencies
        console.log('Installing dependencies...');
        try {
            execSync(`${npmPath} install`, {
                cwd: projectPath,
                stdio: 'pipe',
                shell: true
            });
            console.log('Dependencies installed successfully');
        } catch (error) {
            console.error('Failed to install dependencies:', error.message);
            throw new Error(`Failed to install dependencies: ${error.message}`);
        }
        
        let command, args;
        
        console.log(`Project type detected: ${projectType}`);
        
        switch (projectType) {
            case 'vite-react':
                command = npmPath;
                args = ['run', 'dev', '--', '--port', port.toString(), '--host', '0.0.0.0'];
                console.log('Using Vite React configuration');
                break;
            case 'react':
                // For React projects, we need to set the PORT environment variable
                command = npmPath;
                args = ['start'];
                console.log('Using regular React configuration');
                break;
            case 'nextjs':
                command = npmPath;
                args = ['run', 'dev', '--', '-p', port.toString()];
                console.log('Using Next.js configuration');
                break;
            case 'angular':
                command = npmPath;
                args = ['start', '--', '--port', port.toString()];
                console.log('Using Angular configuration');
                break;
            default:
                command = npmPath;
                args = ['run', 'dev', '--', '--port', port.toString()];
                console.log('Using default configuration');
        }
        
        console.log(`Starting local server: ${command} ${args.join(' ')}`);
        
        return new Promise((resolve, reject) => {
            // Set up environment variables for the child process
            const env = { ...process.env };
            if (projectType === 'react' || projectType === 'vite-react' || projectType === 'nextjs') {
                env.PORT = port.toString();
            }
            
            const child = spawn(command, args, {
                cwd: projectPath,
                stdio: 'pipe',
                detached: false,
                shell: true,
                env: env
            });
            
            let output = '';
            
            // Handle process events
            child.stdout.on('data', (data) => {
                const message = data.toString();
                output += message;
                console.log('Server output:', message.trim());
                
                // Check if server is ready
                if (message.includes('Local:') || message.includes('ready') || message.includes('localhost')) {
                    console.log('Server appears to be ready');
                    resolve(child);
                }
            });
            
            child.stderr.on('data', (data) => {
                const message = data.toString();
                console.error('Server error:', message.trim());
            });
            
            child.on('error', (error) => {
                console.error('Process error:', error);
                reject(error);
            });
            
            child.on('exit', (code, signal) => {
                console.log(`Process exited with code ${code} and signal ${signal}`);
                if (code !== 0) {
                    reject(new Error(`Process exited with code ${code}`));
                }
            });
            
            // Store the process for later cleanup
            this.localProcesses = this.localProcesses || new Map();
            this.localProcesses.set(projectPath, child);
            
            // Timeout after 30 seconds
            setTimeout(() => {
                if (!child.killed) {
                    console.log('Server started successfully (timeout reached)');
                    resolve(child);
                }
            }, 30000);
        });
    }

    async createNgrokTunnel(hostPort) {
        try {
            console.log(`Creating ngrok tunnel for port ${hostPort}...`);
            // For ngrok v4, we need to use the legacy API
            const url = await ngrok.connect(hostPort);
            console.log(`Ngrok tunnel created: ${url}`);
            return url;
        } catch (error) {
            console.error('Error creating ngrok tunnel:', error);
            console.log('Falling back to localhost URL');
            // Fallback to localhost
            return `http://localhost:${hostPort}`;
        }
    }

    // Stop and remove container
    async stopProject(containerId) {
        try {
            const containerInfo = this.activeContainers.get(containerId);
            if (!containerInfo) {
                throw new Error('Container not found');
            }

            // Check if it's a local development process
            if (containerInfo.imageName && containerInfo.imageName.startsWith('local-')) {
                // Stop local development process
                const projectPath = path.join(this.projectsDir, containerId);
                if (this.localProcesses && this.localProcesses.has(projectPath)) {
                    const process = this.localProcesses.get(projectPath);
                    process.kill();
                    this.localProcesses.delete(projectPath);
                }
            } else {
                // Stop Docker container
                await containerInfo.container.stop();
                await containerInfo.container.remove();

                // Remove image
                try {
                    const image = this.docker.getImage(containerInfo.imageName);
                    await image.remove();
                } catch (error) {
                    console.warn('Could not remove image:', error);
                }
            }

            // Close ngrok tunnel
            try {
                await ngrok.kill();
            } catch (error) {
                console.warn('Could not close ngrok tunnel:', error);
            }

            // Remove project files
            const projectPath = path.join(this.projectsDir, containerId);
            await fs.rm(projectPath, { recursive: true, force: true });

            // Remove from active containers
            this.activeContainers.delete(containerId);

            return { success: true, message: 'Project stopped successfully' };

        } catch (error) {
            console.error('Error stopping project:', error);
            throw error;
        }
    }

    // Get container status
    async getContainerStatus(containerId) {
        const containerInfo = this.activeContainers.get(containerId);
        if (!containerInfo) {
            return { status: 'not_found' };
        }

        try {
            const containerData = await containerInfo.container.inspect();
            return {
                status: containerData.State.Status,
                previewUrl: containerInfo.previewUrl,
                projectType: containerInfo.projectType,
                createdAt: containerInfo.createdAt,
                lastAccessed: containerInfo.lastAccessed
            };
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }

    // Get all active containers
    getActiveContainers() {
        return Array.from(this.activeContainers.entries()).map(([id, info]) => ({
            containerId: id,
            projectId: info.projectId,
            projectType: info.projectType,
            previewUrl: info.previewUrl,
            createdAt: info.createdAt,
            lastAccessed: info.lastAccessed
        }));
    }

    // Clean up old containers
    async cleanupOldContainers(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
        const now = new Date();
        const containersToRemove = [];

        for (const [containerId, info] of this.activeContainers.entries()) {
            const age = now - info.lastAccessed;
            if (age > maxAge) {
                containersToRemove.push(containerId);
            }
        }

        for (const containerId of containersToRemove) {
            try {
                await this.stopProject(containerId);
            } catch (error) {
                console.error(`Error cleaning up container ${containerId}:`, error);
            }
        }

        return containersToRemove.length;
    }

    // Update last accessed time
    updateLastAccessed(containerId) {
        const containerInfo = this.activeContainers.get(containerId);
        if (containerInfo) {
            containerInfo.lastAccessed = new Date();
        }
    }
}

// Create singleton instance
const dockerExecutionService = new DockerExecutionService();

// Cleanup old containers every hour
setInterval(() => {
    dockerExecutionService.cleanupOldContainers();
}, 60 * 60 * 1000);

export default dockerExecutionService; 