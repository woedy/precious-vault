@echo off
echo ==================================
echo Create Admin User
echo ==================================
echo.

REM Check if backend container is running
docker ps | findstr precious-vault-backend >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Backend container is not running!
    echo Start it with: docker-compose up -d backend
    pause
    exit /b 1
)

echo Using Docker container...
echo.

REM Prompt for details
set /p email="Email: "
set /p password="Password: "
set /p first_name="First Name (optional): "
set /p last_name="Last Name (optional): "
set /p is_superuser="Make superuser? (y/N): "

REM Build command
set cmd=python manage.py create_admin %email% %password%

if not "%first_name%"=="" (
    set cmd=%cmd% --first-name "%first_name%"
)

if not "%last_name%"=="" (
    set cmd=%cmd% --last-name "%last_name%"
)

if /i "%is_superuser%"=="y" (
    set cmd=%cmd% --superuser
)

REM Execute command
docker exec -it precious-vault-backend sh -c "%cmd%"

echo.
echo ==================================
echo Admin user created!
echo Login at: http://localhost:3001
echo ==================================
echo.
pause
