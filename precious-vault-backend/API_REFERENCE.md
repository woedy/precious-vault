# API Endpoints Quick Reference

## Base URL
- Local: `http://localhost:8000/api`
- WebSocket: `ws://localhost:9000/ws`

## Authentication
```bash
# Register
POST /api/auth/users/
{
  "email": "user@example.com",
  "username": "user",
  "password": "securepass123",
  "password2": "securepass123",
  "first_name": "John",
  "last_name": "Doe"
}

# Login
POST /api/auth/jwt/create/
{
  "email": "user@example.com",
  "password": "securepass123"
}

# Refresh Token
POST /api/auth/jwt/refresh/
{
  "refresh": "your_refresh_token"
}
```

## User Profile
```bash
# Get current user
GET /api/users/profile/me/

# Submit KYC
POST /api/users/profile/submit_kyc/
{
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "+1234567890",
  "street": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zip_code": "10001",
  "country": "United States"
}

# Enable 2FA
POST /api/users/profile/enable_2fa/
{
  "enabled": true
}
```

## Trading
```bash
# List metals
GET /api/trading/metals/

# List products
GET /api/trading/products/

# Get dashboard
GET /api/trading/portfolio/dashboard/

# Buy metal
POST /api/trading/trade/buy/
{
  "product_id": "uuid",
  "quantity": 1,
  "delivery_method": "vault",
  "vault_id": "uuid"
}

# Sell metal
POST /api/trading/trade/sell/
{
  "portfolio_item_id": "uuid",
  "amount_oz": "1.0000"
}

# Convert to cash
POST /api/trading/trade/convert/
{
  "portfolio_item_id": "uuid",
  "amount_oz": "1.0000"
}

# Transaction history
GET /api/trading/transactions/
```

## Vaults
```bash
# List vaults
GET /api/vaults/

# Get my vaulted assets
GET /api/vaults/my_assets/

# Set preferred vault
POST /api/vaults/set_preferred/
{
  "vault_id": "uuid"
}
```

## Delivery
```bash
# List deliveries
GET /api/delivery/

# Request delivery
POST /api/delivery/
{
  "items": [
    {
      "portfolio_item_id": "uuid",
      "quantity": "1"
    }
  ],
  "carrier": "fedex",
  "destination_address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip_code": "10001",
    "country": "United States"
  }
}

# Get tracking history
GET /api/delivery/{id}/tracking/
```

## Headers
All authenticated requests require:
```
Authorization: Bearer {access_token}
Content-Type: application/json
```
