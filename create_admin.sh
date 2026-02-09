#!/bin/bash

echo "=================================="
echo "Create Admin User"
echo "=================================="
echo ""

# Check if running in Docker
if docker ps | grep -q precious-vault-backend; then
    echo "Using Docker container..."
    
    # Prompt for details
    read -p "Email: " email
    read -sp "Password: " password
    echo ""
    read -p "First Name (optional): " first_name
    read -p "Last Name (optional): " last_name
    read -p "Make superuser? (y/N): " is_superuser
    
    # Build command
    cmd="python manage.py create_admin $email $password"
    
    if [ ! -z "$first_name" ]; then
        cmd="$cmd --first-name '$first_name'"
    fi
    
    if [ ! -z "$last_name" ]; then
        cmd="$cmd --last-name '$last_name'"
    fi
    
    if [ "$is_superuser" = "y" ] || [ "$is_superuser" = "Y" ]; then
        cmd="$cmd --superuser"
    fi
    
    # Execute command
    docker exec -it precious-vault-backend sh -c "$cmd"
else
    echo "Error: Backend container is not running!"
    echo "Start it with: docker-compose up -d backend"
    exit 1
fi

echo ""
echo "=================================="
echo "Admin user created!"
echo "Login at: http://localhost:3001"
echo "=================================="
