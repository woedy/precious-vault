@echo off
echo 🚀 Starting Precious Vault Platform...
echo.

REM Build and start infrastructure
echo 📦 Starting database and cache...
docker-compose up -d postgres redis

REM Wait for services to be healthy
echo ⏳ Waiting for services to be ready...
timeout /t 5 /nobreak >nul

REM Build backend
echo 🔨 Building backend...
docker-compose build backend

REM Start backend
echo 🌐 Starting backend API...
docker-compose up -d backend

REM Wait for backend to be ready
echo ⏳ Waiting for backend...
timeout /t 3 /nobreak >nul

REM Run migrations
echo 📊 Running database migrations...
docker-compose exec -T backend python manage.py migrate

REM Seed data
echo 🌱 Seeding database...
docker-compose exec -T backend python manage.py seed_data

REM Start background workers
echo ⚙️  Starting Celery workers...
docker-compose up -d celery celery-beat channels

REM Build and start frontend
echo 🎨 Building and starting frontend...
docker-compose build frontend
docker-compose up -d frontend

echo.
echo ✅ All services started successfully!
echo.
echo 📍 Access Points:
echo    Frontend:    http://localhost
echo    Backend API: http://localhost:8000/api
echo    Admin Panel: http://localhost:8000/admin
echo    WebSocket:   ws://localhost:9000/ws
echo.
echo 📝 View logs: docker-compose logs -f
echo 🛑 Stop all:  docker-compose down
echo.
pause
