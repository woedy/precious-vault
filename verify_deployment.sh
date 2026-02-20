#!/bin/bash

echo "==================================="
echo "Fortress Vault Deployment Verification"
echo "==================================="
echo ""

# Check if containers are running
echo "1. Checking Docker containers..."
echo "-----------------------------------"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep fortress-vault
echo ""

# Check backend health
echo "2. Checking backend API..."
echo "-----------------------------------"
curl -s http://localhost:8000/api/ > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ Backend API is accessible at http://localhost:8000"
else
    echo "✗ Backend API is not accessible"
fi
echo ""

# Check admin frontend
echo "3. Checking admin frontend..."
echo "-----------------------------------"
curl -s http://localhost:3001 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ Admin frontend is accessible at http://localhost:3001"
else
    echo "✗ Admin frontend is not accessible"
fi
echo ""

# Check main frontend
echo "4. Checking main frontend..."
echo "-----------------------------------"
curl -s http://localhost:80 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ Main frontend is accessible at http://localhost:80"
else
    echo "✗ Main frontend is not accessible"
fi
echo ""

# Check database
echo "5. Checking database..."
echo "-----------------------------------"
docker exec fortress-vault-db pg_isready -U postgres > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ PostgreSQL database is healthy"
else
    echo "✗ PostgreSQL database is not healthy"
fi
echo ""

# Check redis
echo "6. Checking Redis..."
echo "-----------------------------------"
docker exec fortress-vault-redis redis-cli ping > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ Redis cache is healthy"
else
    echo "✗ Redis cache is not healthy"
fi
echo ""

echo "==================================="
echo "Verification Complete!"
echo "==================================="
echo ""
echo "Access Points:"
echo "  - Main Frontend:  http://localhost:80"
echo "  - Admin Frontend: http://localhost:3001"
echo "  - Backend API:    http://localhost:8000/api/"
echo "  - Admin API:      http://localhost:8000/api/admin/"
echo ""
