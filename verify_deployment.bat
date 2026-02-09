@echo off
echo ===================================
echo Precious Vault Deployment Verification
echo ===================================
echo.

REM Check if containers are running
echo 1. Checking Docker containers...
echo -----------------------------------
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | findstr precious-vault
echo.

REM Check backend health
echo 2. Checking backend API...
echo -----------------------------------
curl -s http://localhost:8000/api/ >nul 2>&1
if %errorlevel% equ 0 (
    echo [32m✓ Backend API is accessible at http://localhost:8000[0m
) else (
    echo [31m✗ Backend API is not accessible[0m
)
echo.

REM Check admin frontend
echo 3. Checking admin frontend...
echo -----------------------------------
curl -s http://localhost:3001 >nul 2>&1
if %errorlevel% equ 0 (
    echo [32m✓ Admin frontend is accessible at http://localhost:3001[0m
) else (
    echo [31m✗ Admin frontend is not accessible[0m
)
echo.

REM Check main frontend
echo 4. Checking main frontend...
echo -----------------------------------
curl -s http://localhost:80 >nul 2>&1
if %errorlevel% equ 0 (
    echo [32m✓ Main frontend is accessible at http://localhost:80[0m
) else (
    echo [31m✗ Main frontend is not accessible[0m
)
echo.

REM Check database
echo 5. Checking database...
echo -----------------------------------
docker exec precious-vault-db pg_isready -U postgres >nul 2>&1
if %errorlevel% equ 0 (
    echo [32m✓ PostgreSQL database is healthy[0m
) else (
    echo [31m✗ PostgreSQL database is not healthy[0m
)
echo.

REM Check redis
echo 6. Checking Redis...
echo -----------------------------------
docker exec precious-vault-redis redis-cli ping >nul 2>&1
if %errorlevel% equ 0 (
    echo [32m✓ Redis cache is healthy[0m
) else (
    echo [31m✗ Redis cache is not healthy[0m
)
echo.

echo ===================================
echo Verification Complete!
echo ===================================
echo.
echo Access Points:
echo   - Main Frontend:  http://localhost:80
echo   - Admin Frontend: http://localhost:3001
echo   - Backend API:    http://localhost:8000/api/
echo   - Admin API:      http://localhost:8000/api/admin/
echo.
pause
