# Docker Execution Engine

## Overview

The Docker Execution Engine is a powerful addition to your code execution platform that allows users to run full-stack server-side projects (Node.js, React, Next.js, Angular) inside isolated Docker containers. This extends beyond Judge0's single-file capabilities to support complete project execution with live preview URLs.

## Features

### 🚀 **Full-Stack Project Support**
- **Next.js**: React framework for production
- **React**: JavaScript library for building user interfaces  
- **Angular**: Platform for building mobile and desktop web applications
- **Node.js**: JavaScript runtime for server-side applications

### 🔒 **Isolated Execution**
- Each project runs in its own Docker container
- Resource limits (512MB RAM, 50% CPU)
- Automatic cleanup after 24 hours of inactivity
- Secure sandboxed environment

### 🌐 **Live Preview**
- Automatic ngrok tunnel creation for public URLs
- Real-time preview of running applications
- Accessible from anywhere on the internet

### 📊 **Container Management**
- Start, stop, restart containers
- View real-time logs
- Monitor container status
- Download project files

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Docker Engine │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (Dockerode)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   MongoDB       │    │   ngrok         │
                       │   (Database)    │    │   (Tunneling)   │
                       └─────────────────┘    └─────────────────┘
```

## API Endpoints

### Project Execution
- `POST /api/docker/run` - Run a full-stack project
- `DELETE /api/docker/stop/:containerId` - Stop a running project
- `POST /api/docker/restart/:containerId` - Restart a container

### Container Management
- `GET /api/docker/containers` - Get all active containers
- `GET /api/docker/status/:containerId` - Get container status
- `GET /api/docker/logs/:containerId` - Get container logs

### Project Updates
- `PUT /api/docker/update/:containerId` - Update project files and restart
- `GET /api/docker/project-types` - Get supported project types

## Setup Instructions

### 1. Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ 
- MongoDB (or use the provided Docker setup)
- Redis (or use the provided Docker setup)

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
# Backend Configuration
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://localhost:27017/code_execution
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key

# Docker Configuration
NGROK_AUTH_TOKEN=your-ngrok-auth-token  # Optional, for custom domains

# Frontend Configuration
VITE_API_BASE_URL=http://localhost:3000
VITE_RAPIDAPI_KEY=your-judge0-api-key
```

### 3. Installation

#### Option A: Using Docker Compose (Recommended)

```bash
# Clone the repository
git clone <your-repo>
cd <your-repo>

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

#### Option B: Manual Installation

```bash
# Backend setup
cd backend
npm install
npm start

# Frontend setup (in another terminal)
cd frontend
npm install
npm run dev
```

### 4. Verify Installation

- Backend API: http://localhost:3000
- Frontend: http://localhost:5173
- MongoDB: mongodb://localhost:27017
- Redis: redis://localhost:6379

## Usage

### 1. Running a Project

#### Via Frontend UI
1. Navigate to the Docker Execution tab
2. Select project type (Next.js, React, Angular, Node.js)
3. Upload project files
4. Click "Run Project"
5. Wait for container to start
6. Click "Open Preview" to view the live application

#### Via API
```bash
curl -X POST http://localhost:3000/api/docker/run \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "projectId=your-project-id" \
  -F "projectType=nextjs" \
  -F "files=@your-project.zip"
```

### 2. Managing Containers

#### View Active Containers
```bash
curl http://localhost:3000/api/docker/containers \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Stop a Container
```bash
curl -X DELETE http://localhost:3000/api/docker/stop/CONTAINER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### View Container Logs
```bash
curl http://localhost:3000/api/docker/logs/CONTAINER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Project Types and Templates

#### Next.js Project
```json
{
  "id": "nextjs",
  "name": "Next.js",
  "description": "React framework for production",
  "port": 3000,
  "buildCommand": "npm run build",
  "startCommand": "npm start"
}
```

#### React Project
```json
{
  "id": "react",
  "name": "React",
  "description": "JavaScript library for building user interfaces",
  "port": 3000,
  "buildCommand": "npm run build",
  "startCommand": "npm start"
}
```

#### Angular Project
```json
{
  "id": "angular",
  "name": "Angular",
  "description": "Platform for building mobile and desktop web applications",
  "port": 4200,
  "buildCommand": "npm run build",
  "startCommand": "npm start"
}
```

#### Node.js Project
```json
{
  "id": "nodejs",
  "name": "Node.js",
  "description": "JavaScript runtime for server-side applications",
  "port": 3000,
  "buildCommand": "npm install",
  "startCommand": "npm start"
}
```

## Security Features

### Resource Limits
- **Memory**: 512MB per container
- **CPU**: 50% CPU usage limit
- **Disk**: Temporary storage only
- **Network**: Isolated network namespace

### Container Isolation
- Each project runs in its own container
- No access to host system
- Temporary file system
- Automatic cleanup

### Access Control
- JWT-based authentication
- Project-level permissions
- Container ownership tracking

## Monitoring and Logging

### Container Health Checks
- Automatic health monitoring
- Restart on failure
- Resource usage tracking

### Log Management
- Real-time log streaming
- Log retention policies
- Error tracking and reporting

### Performance Metrics
- Container startup time
- Resource utilization
- Response time monitoring

## Troubleshooting

### Common Issues

#### Container Won't Start
1. Check Docker daemon is running
2. Verify project files are valid
3. Check container logs for errors
4. Ensure sufficient system resources

#### Preview URL Not Working
1. Verify ngrok is configured
2. Check container is running
3. Verify port mapping is correct
4. Check firewall settings

#### High Resource Usage
1. Monitor active containers
2. Set stricter resource limits
3. Implement container cleanup
4. Scale horizontally if needed

### Debug Commands

```bash
# View all containers
docker ps -a

# View container logs
docker logs CONTAINER_ID

# Inspect container
docker inspect CONTAINER_ID

# View resource usage
docker stats

# Clean up unused containers
docker container prune
```

## Performance Optimization

### Container Optimization
- Use multi-stage builds
- Optimize base images
- Implement layer caching
- Minimize image size

### Resource Management
- Implement container pooling
- Use resource quotas
- Monitor and scale automatically
- Implement cleanup policies

### Caching Strategies
- Cache npm dependencies
- Cache build artifacts
- Use CDN for static assets
- Implement browser caching

## Production Deployment

### Scaling Considerations
- Use load balancers
- Implement horizontal scaling
- Use container orchestration (Kubernetes)
- Monitor and auto-scale

### Security Hardening
- Use non-root containers
- Implement network policies
- Use secrets management
- Regular security updates

### Monitoring and Alerting
- Set up monitoring dashboards
- Configure alerting rules
- Log aggregation
- Performance tracking

## Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Testing
```bash
# Run backend tests
cd backend && npm test

# Run frontend tests
cd frontend && npm test

# Run integration tests
npm run test:integration
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Join our community Discord
- Email: support@yourproject.com 