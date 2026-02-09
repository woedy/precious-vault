# Technology Stack

## Backend (Django)

**Framework**: Django 5.0 + Django REST Framework  
**Database**: PostgreSQL  
**Cache/Queue**: Redis  
**Background Tasks**: Celery + Celery Beat  
**WebSockets**: Django Channels + Daphne  
**Authentication**: JWT (djangorestframework-simplejwt) + Djoser

### Key Libraries
- `django-cors-headers` - CORS handling
- `django-environ` - Environment configuration
- `channels-redis` - WebSocket channel layer
- `Pillow` - Image processing
- `whitenoise` - Static file serving

### Testing
- `pytest` + `pytest-django` + `pytest-asyncio`
- `factory-boy` + `faker` for test data

## Frontend (React)

**Framework**: React 18 + TypeScript  
**Build Tool**: Vite  
**Styling**: Tailwind CSS + shadcn/ui components  
**Routing**: React Router v6  
**State/Data**: TanStack Query (React Query)  
**HTTP Client**: Axios  
**Forms**: React Hook Form + Zod validation

### UI Components
- shadcn/ui (Radix UI primitives)
- Recharts for data visualization
- Lucide React for icons
- Sonner for toast notifications

### Testing
- Vitest + jsdom
- Testing Library (React)

## Infrastructure

**Containerization**: Docker + Docker Compose  
**Web Server**: Nginx (frontend), Gunicorn (backend), Daphne (WebSockets)  
**Services**: 7 containers (postgres, redis, backend, celery, celery-beat, channels, frontend)

## Common Commands

### Development (Full Stack)
```bash
# Start all services
docker-compose up --build

# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Seed database
docker-compose exec backend python manage.py seed_data

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Backend Only
```bash
cd precious-vault-backend

# Local development
python manage.py runserver

# Run tests
pytest

# Celery worker
celery -A config worker -l info

# Celery beat scheduler
celery -A config beat -l info

# Make migrations
python manage.py makemigrations
python manage.py migrate
```

### Frontend Only
```bash
cd precious-vault-frontend

# Development server
npm run dev

# Build
npm run build

# Run tests
npm test

# Watch tests
npm run test:watch

# Lint
npm run lint
```

## Environment Configuration

Backend uses `.env` file with `django-environ`  
Frontend uses Vite environment variables (import.meta.env)

## API Structure

Base URL: `/api/`
- `/api/auth/` - Authentication (Djoser + JWT)
- `/api/users/` - User management
- `/api/trading/` - Metals, products, transactions
- `/api/vaults/` - Vault locations and assets
- `/api/delivery/` - Physical delivery requests

WebSocket: `ws://localhost:9000/ws/`
- `/ws/prices/` - Real-time metal prices
- `/ws/portfolio/` - Portfolio updates
- `/ws/delivery/{id}/` - Delivery tracking
