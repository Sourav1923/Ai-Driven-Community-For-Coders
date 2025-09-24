@echo off
REM Docker Execution Engine Dependencies Installer for Windows
REM This script installs all necessary dependencies for the Docker Execution Engine

echo 🚀 Installing Docker Execution Engine Dependencies...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    echo Visit: https://docs.docker.com/desktop/install/windows/
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    echo Visit: https://docs.docker.com/compose/install/
    pause
    exit /b 1
)

echo ✅ Docker and Docker Compose are installed

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
call npm install dockerode multer ngrok@4.3.3 uuid
echo ✅ Backend dependencies installed

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd ..\frontend
call npm install lucide-react
echo ✅ Frontend dependencies installed

REM Create necessary directories
echo 📁 Creating necessary directories...
cd ..
if not exist "backend\uploads\projects" mkdir backend\uploads\projects
if not exist "logs" mkdir logs

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo 📝 Creating .env file...
    (
        echo # Backend Configuration
        echo NODE_ENV=development
        echo PORT=3000
        echo MONGODB_URI=mongodb://localhost:27017/code_execution
        echo REDIS_URL=redis://localhost:6379
        echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
        echo.
        echo # Docker Configuration
        echo NGROK_AUTH_TOKEN=
        echo.
        echo # Frontend Configuration
        echo VITE_API_BASE_URL=http://localhost:3000
        echo VITE_RAPIDAPI_KEY=your-judge0-api-key-here
    ) > .env
    echo ✅ .env file created. Please update it with your actual values.
)

echo.
echo 🎉 Installation complete!
echo.
echo Next steps:
echo 1. Update the .env file with your actual configuration values
echo 2. Start the services with: docker-compose up -d
echo 3. Access the application at: http://localhost:5173
echo.
echo For more information, see: DOCKER_EXECUTION_ENGINE.md
pause 