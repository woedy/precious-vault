# Project Structure

## Monorepo Layout

```
precious-vault/
├── .kiro/                          # Kiro AI configuration
│   ├── specs/                      # Feature specifications
│   └── steering/                   # Project guidelines
├── precious-vault-backend/         # Django backend
├── precious-vault-frontend/        # React frontend
├── docker-compose.yml              # Development orchestration
├── docker-compose.prod.yml         # Production configuration
└── README.md                       # Main documentation
```

## Backend Structure

```
precious-vault-backend/
├── config/                         # Django project settings
│   ├── settings.py                 # Main configuration
│   ├── urls.py                     # Root URL routing
│   ├── asgi.py                     # ASGI application (WebSockets)
│   ├── wsgi.py                     # WSGI application
│   ├── celery.py                   # Celery configuration
│   └── routing.py                  # WebSocket routing
├── users/                          # User authentication & profiles
│   ├── models.py                   # Custom User model
│   ├── serializers.py              # API serializers
│   ├── views.py                    # API views
│   ├── consumers.py                # WebSocket consumers
│   ├── signals.py                  # Django signals
│   └── urls.py                     # URL routing
├── trading/                        # Metals & trading logic
│   ├── models.py                   # Metal, Product, Transaction models
│   ├── serializers.py              # API serializers
│   ├── views.py                    # Trading endpoints
│   ├── tasks.py                    # Celery tasks (price updates)
│   ├── consumers.py                # WebSocket consumers
│   └── management/commands/        # Custom management commands
├── vaults/                         # Vault locations
│   ├── models.py                   # Vault, VaultAsset models
│   ├── serializers.py              # API serializers
│   ├── views.py                    # Vault endpoints
│   └── urls.py                     # URL routing
├── delivery/                       # Physical delivery system
│   ├── models.py                   # Shipment, ShipmentEvent models
│   ├── serializers.py              # API serializers
│   ├── views.py                    # Delivery endpoints
│   ├── tasks.py                    # Celery tasks (notifications)
│   └── urls.py                     # URL routing
├── media/                          # User uploads (identity docs)
├── staticfiles/                    # Collected static files
├── requirements.txt                # Python dependencies
├── Dockerfile                      # Backend container
└── manage.py                       # Django CLI
```

### Django App Pattern

Each app follows Django's standard structure:
- `models.py` - Database models
- `serializers.py` - DRF serializers
- `views.py` - API views/viewsets
- `urls.py` - URL routing
- `admin.py` - Django admin configuration
- `tasks.py` - Celery background tasks (if needed)
- `consumers.py` - WebSocket consumers (if needed)
- `migrations/` - Database migrations

## Frontend Structure

```
precious-vault-frontend/
├── src/
│   ├── components/                 # React components
│   │   ├── ui/                     # shadcn/ui components
│   │   ├── layout/                 # Layout components (Header, Footer)
│   │   ├── buy/                    # Buy flow components
│   │   ├── delivery/               # Delivery components
│   │   └── cards/                  # Reusable card components
│   ├── pages/                      # Route pages
│   │   ├── DashboardPage.tsx       # Main dashboard
│   │   ├── BuyPage.tsx             # Buy metals
│   │   ├── SellPage.tsx            # Sell metals
│   │   ├── VaultsPage.tsx          # Vault management
│   │   ├── DeliveryPage.tsx        # Delivery requests
│   │   ├── TrackingPage.tsx        # Shipment tracking
│   │   ├── LoginPage.tsx           # Authentication
│   │   ├── SignupPage.tsx          # Registration
│   │   ├── legal/                  # Legal pages
│   │   └── company/                # Company pages
│   ├── hooks/                      # Custom React hooks
│   │   ├── useTrading.ts           # Trading operations
│   │   ├── useVaults.ts            # Vault operations
│   │   ├── useShipments.ts         # Delivery operations
│   │   ├── useDashboardData.ts     # Dashboard data
│   │   └── useRealTimeData.ts      # WebSocket data
│   ├── context/                    # React context providers
│   │   └── AuthContext.tsx         # Authentication state
│   ├── lib/                        # Utilities
│   │   ├── api.ts                  # Axios API client
│   │   └── utils.ts                # Helper functions
│   ├── data/                       # Static/mock data
│   ├── test/                       # Test files
│   ├── App.tsx                     # Main app component
│   ├── main.tsx                    # Entry point
│   └── index.css                   # Global styles
├── public/                         # Static assets
├── dist/                           # Build output
├── package.json                    # Dependencies
├── vite.config.ts                  # Vite configuration
├── tailwind.config.ts              # Tailwind configuration
├── tsconfig.json                   # TypeScript configuration
├── vitest.config.ts                # Test configuration
└── Dockerfile                      # Frontend container
```

### Frontend Patterns

- **Pages**: Top-level route components in `src/pages/`
- **Components**: Reusable UI components organized by feature
- **Hooks**: Custom hooks for data fetching and state management
- **Context**: Global state (auth, theme) via React Context
- **API Client**: Centralized in `src/lib/api.ts` using Axios
- **Styling**: Tailwind utility classes + shadcn/ui components
- **Path Alias**: `@/` maps to `src/` directory

## Key Conventions

### Backend
- Custom User model in `users` app (AUTH_USER_MODEL)
- JWT authentication for all API endpoints
- WebSocket consumers for real-time features
- Celery tasks for background processing
- Django admin enabled for all models

### Frontend
- TypeScript strict mode
- Component files use PascalCase (e.g., `DashboardPage.tsx`)
- Hooks use camelCase with `use` prefix (e.g., `useTrading.ts`)
- shadcn/ui components in `src/components/ui/`
- TanStack Query for server state management
- React Router for navigation

### API Design
- RESTful endpoints under `/api/`
- JWT Bearer token authentication
- Consistent error responses
- WebSocket endpoints under `/ws/`
