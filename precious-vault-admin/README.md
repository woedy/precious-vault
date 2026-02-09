# Precious Vault Admin

Admin management system for the Precious Vault platform.

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- React Router v6
- TanStack Query (React Query)
- Axios
- React Hook Form + Zod

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/       # React components
│   └── ui/          # shadcn/ui components
├── context/         # React context providers
├── hooks/           # Custom React hooks
├── lib/             # Utilities and API client
├── pages/           # Route pages
├── App.tsx          # Main app component
└── main.tsx         # Entry point
```

## Path Alias

The project uses `@/` as an alias for the `src/` directory.

Example:
```typescript
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
```

## Features

- KYC Management
- Transaction Management
- User Management
- Delivery Management
- Dashboard & Metrics
- Audit Log

## API

The admin frontend communicates with the backend API at `/api/admin/`.

Authentication is handled via JWT tokens.
