#!/bin/bash

# Docker Execution Engine Dependencies Installer
# This script installs all necessary dependencies for the Docker Execution Engine

echo "🚀 Installing Docker Execution Engine Dependencies..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install dockerode multer ngrok@4.3.3 uuid
echo "✅ Backend dependencies installed"

# Install frontend dependencies (if needed)
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install lucide-react
echo "✅ Frontend dependencies installed"

# Create necessary directories
echo "📁 Creating necessary directories..."
cd ..
mkdir -p backend/uploads/projects
mkdir -p logs

# Set permissions
echo "🔐 Setting permissions..."
chmod -R 755 backend/uploads

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Backend Configuration
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/code_execution
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Docker Configuration
NGROK_AUTH_TOKEN=

# Frontend Configuration
VITE_API_BASE_URL=http://localhost:3000
VITE_RAPIDAPI_KEY=your-judge0-api-key-here
EOF
    echo "✅ .env file created. Please update it with your actual values."
fi

echo ""
echo "🎉 Installation complete!"
echo ""
echo "Next steps:"
echo "1. Update the .env file with your actual configuration values"
echo "2. Start the services with: docker-compose up -d"
echo "3. Access the application at: http://localhost:5173"
echo ""
echo "For more information, see: DOCKER_EXECUTION_ENGINE.md" 