# Precious Vault Backend

Django backend for the Precious Vault platform - a gold/precious metals trading and vault storage system.

## Features

- **User Authentication** - JWT-based auth with KYC verification
- **Trading** - Buy, sell, and convert precious metals
- **Vault Management** - Global vault storage locations
- **Physical Delivery** - Request and track shipments
- **Real-time Updates** - WebSocket support for prices and tracking
- **Background Tasks** - Celery for price updates and notifications

## Tech Stack

- **Django 5.0** + Django REST Framework
- **PostgreSQL** - Database
- **Redis** - Caching & message broker
- **Celery** - Background tasks
- **Channels** - WebSockets
- **Docker** - Containerization

## Quick Start

### Local Development

1. **Clone and setup**:
   ```bash
   cd precious-vault-backend
   python -m venv venv
   .\venv\Scripts\activate  # Windows
   # source venv/bin/activate  # Linux/Mac
   pip install -r requirements.txt
   ```

2. **Configure environment**:
   ```bash
   copy .env.example .env
   # Edit .env with your settings
   ```

3. **Run migrations**:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

4. **Create superuser**:
   ```bash
   python manage.py createsuperuser
   ```

5. **Run development server**:
   ```bash
   python manage.py runserver
   ```

### Docker Development

1. **Start all services**:
   ```bash
   docker-compose up --build
   ```

2. **Run migrations**:
   ```bash
   docker-compose exec web python manage.py migrate
   ```

3. **Create superuser**:
   ```bash
   docker-compose exec web python manage.py createsuperuser
   ```

4. **Access**:
   - API: http://localhost:8000
   - WebSockets: ws://localhost:9000
   - Admin: http://localhost:8000/admin

### Production (Coolify)

1. **Use production compose**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Set environment variables** in Coolify dashboard

3. **Run migrations**:
   ```bash
   docker-compose -f docker-compose.prod.yml exec web python manage.py migrate
   ```

## API Endpoints

### Authentication
- `POST /api/auth/users/` - Register
- `POST /api/auth/jwt/create/` - Login
- `POST /api/auth/jwt/refresh/` - Refresh token

### Trading
- `GET /api/trading/metals/` - List metals
- `GET /api/trading/products/` - List products
- `POST /api/trading/buy/` - Buy metals
- `POST /api/trading/sell/` - Sell metals

### Vaults
- `GET /api/vaults/` - List vaults
- `GET /api/vaults/my-assets/` - User's vaulted assets

### Delivery
- `POST /api/delivery/request/` - Request delivery
- `GET /api/delivery/` - List deliveries
- `GET /api/delivery/{id}/tracking/` - Tracking history

## WebSocket Endpoints

- `/ws/prices/` - Real-time metal prices
- `/ws/portfolio/` - Portfolio updates
- `/ws/delivery/{id}/` - Delivery tracking

## Project Structure

```
precious-vault-backend/
├── config/              # Django settings & configuration
├── users/               # User authentication & profiles
├── trading/             # Metals, products, transactions
├── vaults/              # Vault locations
├── delivery/            # Physical delivery system
├── requirements.txt     # Python dependencies
├── Dockerfile           # Docker image
├── docker-compose.yml   # Local development
└── docker-compose.prod.yml  # Production
```

## Development

### Running Tests
```bash
pytest
```

### Code Quality
```bash
black .
flake8
```

### Celery Tasks
```bash
# Start worker
celery -A config worker -l info

# Start beat scheduler
celery -A config beat -l info
```

## Environment Variables

See `.env.example` for all required environment variables.

## License

Proprietary - Precious Vault Platform
