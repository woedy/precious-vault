#!/bin/bash

echo "🚀 Starting Fortress Vault Platform..."
echo ""

# Build and start infrastructure
echo "📦 Starting database and cache..."
docker-compose up -d postgres redis

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 5

# Build backend
echo "🔨 Building backend..."
docker-compose build backend

# Start backend
echo "🌐 Starting backend API..."
docker-compose up -d backend

# Wait for backend to be ready
echo "⏳ Waiting for backend..."
sleep 3

# Run migrations
echo "📊 Running database migrations..."
docker-compose exec -T backend python manage.py migrate

# Seed data
echo "🌱 Seeding database..."
docker-compose exec -T backend python manage.py seed_data

# Start background workers
echo "⚙️  Starting Celery workers..."
docker-compose up -d celery celery-beat channels

# Build and start frontend
echo "🎨 Building and starting frontend..."
docker-compose build frontend
docker-compose up -d frontend

echo ""
echo "✅ All services started successfully!"
echo ""
echo "📍 Access Points:"
echo "   Frontend:    http://localhost"
echo "   Backend API: http://localhost:8000/api"
echo "   Admin Panel: http://localhost:8000/admin"
echo "   WebSocket:   ws://localhost:9000/ws"
echo ""
echo "📝 View logs: docker-compose logs -f"
echo "🛑 Stop all:  docker-compose down"
echo ""
