# Fortress Vault - Monorepo

Full-stack precious metals trading platform with Django backend and React frontend.

## Quick Start

### Option 1: Use Startup Script (Recommended)

**Windows:**
```bash
start.bat
```

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

This will automatically:
- Start all services
- Run migrations
- Seed the database
- Display access URLs

### Option 2: Manual Docker Compose

```bash
# Start all services (frontend, backend, database, redis, celery, websockets)
docker-compose up --build

# Run in detached mode
docker-compose up -d --build
```

**Access:**
- Frontend: http://localhost
- Backend API: http://localhost:8000/api
- WebSocket: ws://localhost:9000/ws
- Admin Panel: http://localhost:8000/admin

### First Time Setup

1. **Run migrations:**
   ```bash
   docker-compose exec backend python manage.py migrate
   ```

2. **Create superuser:**
   ```bash
   docker-compose exec backend python manage.py createsuperuser
   ```

3. **Seed database:**
   ```bash
   docker-compose exec backend python manage.py seed_data
   ```

### Stop Services

```bash
docker-compose down

# Remove volumes (clean slate)
docker-compose down -v
```

## Project Structure

```
fortress-vault/
├── docker-compose.yml          # Main orchestration file
├── fortress-vault-frontend/    # React + TypeScript frontend
│   ├── Dockerfile
│   ├── nginx.conf
│   └── src/
└── fortress-vault-backend/     # Django REST API backend
    ├── Dockerfile
    ├── config/                 # Django settings
    ├── users/                  # User management
    ├── trading/                # Metals & trading
    ├── vaults/                 # Vault locations
    └── delivery/               # Physical delivery
```

## Services

- **postgres** - PostgreSQL database (port 5432)
- **redis** - Redis cache & message broker (port 6379)
- **backend** - Django REST API (port 8000)
- **celery** - Background task worker
- **celery-beat** - Task scheduler
- **channels** - WebSocket server (port 9000)
- **frontend** - React app with Nginx (port 80)


## Live Pricing Configuration

To enable live metal pricing jobs (instead of simulated fallback), configure backend environment variables in `fortress-vault-backend/.env`:

```env
# Use exchangerate.host for both FX and metals
METAL_PRICE_API_PROVIDER=exchangerate_host
FX_API_KEY=your_exchangerate_host_key
FX_BASE_URL=https://api.exchangerate.host
# Optional: custom metal icon base URL (your CDN/static host)
# Do NOT point this to exchangerate.host (it does not serve metal icons)
FX_METAL_IMAGE_BASE_URL=https://your-cdn.example.com/metals

# Optional: if using metals-api.com instead
# METAL_PRICE_API_PROVIDER=metalsapi
# METAL_PRICE_API_KEY=your_metals_api_key
# METAL_PRICE_API_URL=https://metals-api.com/api/latest
```

Then restart `backend`, `celery`, and `celery-beat` services so workers load new env values.

`image_url` for each metal uses `FX_METAL_IMAGE_BASE_URL` when set to a valid custom host. If `FX_METAL_IMAGE_BASE_URL` points to `exchangerate.host` (or is unset), the API returns built-in fallback metal icons instead.

## Development

### Backend Only
```bash
cd fortress-vault-backend
docker-compose up
```

### Frontend Only
```bash
cd fortress-vault-frontend
npm install
npm run dev
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Rebuild Services
```bash
# Rebuild all
docker-compose build

# Rebuild specific service
docker-compose build backend
docker-compose build frontend
```

## API Documentation

See `fortress-vault-backend/API_REFERENCE.md` for complete API documentation.

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- React Router
- TanStack Query

### Backend
- Django 5.0
- Django REST Framework
- PostgreSQL
- Redis
- Celery
- Channels (WebSocket)
- JWT Authentication

## License

Proprietary - Fortress Vault Platform
