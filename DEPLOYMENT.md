# Deployment Guide

## Docker Configuration

### Services Overview

The Precious Vault platform consists of the following Docker services:

1. **postgres** - PostgreSQL database (port 5432)
2. **redis** - Redis cache and message broker (port 6379)
3. **backend** - Django REST API (port 8000)
4. **celery** - Background task worker
5. **celery-beat** - Task scheduler
6. **channels** - WebSocket server (port 9000)
7. **frontend** - Main user frontend (port 80)
8. **admin-frontend** - Admin management interface (port 3001)

### Quick Start

```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Individual Service Management

```bash
# Build specific service
docker-compose build admin-frontend

# Start specific service
docker-compose up -d admin-frontend

# View service logs
docker logs precious-vault-admin

# Restart service
docker-compose restart admin-frontend
```

### Admin Frontend Access

- **URL**: http://localhost:3001
- **API Backend**: http://localhost:8000/api/admin/
- **Authentication**: JWT tokens (same as main platform)

### Environment Variables

The admin frontend uses the following environment variables:

- `VITE_API_URL` - Backend API URL (default: http://localhost:8000/api)

### CORS Configuration

The backend is configured to allow requests from:
- http://localhost:5173 (Vite dev server)
- http://localhost:3000 (Alternative frontend port)
- http://localhost:3001 (Admin frontend)
- http://localhost:80 (Production frontend)
- http://localhost (Default)
- http://127.0.0.1 (Localhost IP)

### Build Details

#### Admin Frontend Dockerfile

The admin frontend uses a multi-stage build:

1. **Build Stage** (Node 20 Alpine)
   - Installs dependencies with `npm ci`
   - Builds production assets with Vite
   - TypeScript compilation with test files excluded

2. **Production Stage** (Nginx Alpine)
   - Serves static files from `/usr/share/nginx/html`
   - Configured for React Router (SPA routing)
   - Gzip compression enabled
   - Security headers configured
   - Static asset caching (1 year)

#### Backend Configuration

The backend is configured to:
- Accept requests from admin frontend origin
- Provide admin API endpoints under `/api/admin/`
- Require JWT authentication with staff/superuser permissions
- Log all admin actions to audit trail

### Troubleshooting

#### Container won't start

```bash
# Check container logs
docker logs precious-vault-admin

# Check all containers
docker ps -a

# Remove and rebuild
docker-compose down
docker-compose build admin-frontend
docker-compose up -d admin-frontend
```

#### Port conflicts

If port 3001 is already in use, modify `docker-compose.yml`:

```yaml
admin-frontend:
  ports:
    - "3002:80"  # Change external port
```

#### Build failures

Common issues:
- **Node version**: Ensure Dockerfile uses Node 20+
- **Test files**: Ensure test files are excluded from build
- **Dependencies**: Clear node_modules and package-lock.json if needed

```bash
# Clean build
docker-compose build --no-cache admin-frontend
```

### Production Deployment

For production deployment:

1. Update environment variables in `.env.prod`
2. Use `docker-compose.prod.yml` configuration
3. Enable HTTPS with reverse proxy (Nginx/Caddy)
4. Set secure SECRET_KEY and database credentials
5. Configure proper CORS origins
6. Enable rate limiting and security headers

```bash
# Production build
docker-compose -f docker-compose.prod.yml build

# Production start
docker-compose -f docker-compose.prod.yml up -d
```

### Health Checks

The following services have health checks:
- **postgres**: `pg_isready` command
- **redis**: `redis-cli ping` command

Backend and frontend services depend on healthy database and cache services.

### Monitoring

```bash
# View all container stats
docker stats

# View specific container stats
docker stats precious-vault-admin

# Check container health
docker inspect precious-vault-admin | grep -A 10 Health
```

## Next Steps

1. Access admin frontend at http://localhost:3001
2. Login with staff/superuser credentials
3. Verify all admin endpoints are accessible
4. Test KYC, transaction, user, and delivery management features
5. Check audit log for all admin actions
