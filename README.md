# GOComet Ride Hailing — Frontend

React 19 frontend for the GOComet ride-hailing platform. Provides three role-based dashboards — Rider, Driver, and Admin — with real-time ride status updates via WebSocket, live driver location tracking, and a full trip state machine UI.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 19 |
| Build Tool | Vite 6 |
| Language | TypeScript 5.8 (strict) |
| Styling | Tailwind CSS 4 |
| Routing | React Router 7 |
| Data Fetching | TanStack Query 5 (React Query) |
| HTTP Client | Axios |
| Realtime | Socket.IO Client 4 |
| Auth | JWT via HTTP-only cookies |

---

## Project Structure

```
src/
├── api/
│   ├── client.ts        # Axios instance + request/response interceptors
│   ├── auth.ts          # Login, register, logout, refresh
│   ├── rider.ts         # Profile, payment methods, ride history
│   ├── ride.ts          # Fare estimate, create ride, cancel ride
│   ├── driver.ts        # Profile, vehicles, availability, location, earnings
│   ├── trip.ts          # Trip state machine actions
│   └── admin.ts         # Tenant and region management
├── components/
│   ├── Navbar.tsx        # Top nav with role badge and logout
│   ├── StatusBadge.tsx   # Colored status pill for ride/trip states
│   └── ErrorAlert.tsx    # Axios error display
├── context/
│   └── AuthContext.tsx   # Global auth state, role, tenantId, regionId
├── hooks/
│   ├── useRiderSocket.ts # Socket.IO hook for rider live updates
│   └── useDriverSocket.ts# Socket.IO hook for driver offers + location
├── pages/
│   ├── LoginPage.tsx     # 3-tab login (Rider / Driver / Admin)
│   ├── RegisterPage.tsx  # 2-tab register (Rider / Driver)
│   ├── RiderDashboard.tsx# 4-tab rider dashboard
│   ├── DriverDashboard.tsx# 5-tab driver dashboard
│   └── AdminDashboard.tsx# 2-tab admin dashboard
├── types/
│   └── index.ts          # All shared TypeScript interfaces
├── App.tsx               # Route definitions + ProtectedRoute
└── main.tsx              # QueryClientProvider + AuthProvider + BrowserRouter
```

---

## Pages & Features

### Login / Register

- **Login** (`/login`) — 3 tabs: Rider, Driver, Admin
  - Requires Tenant ID + Region ID (copy from Admin dashboard)
  - Credentials stored in `AuthContext`, tokens in HTTP-only cookies
- **Register** (`/register`) — 2 tabs: Rider, Driver

---

### Rider Dashboard (`/rider`)

| Tab | Features |
|---|---|
| **Profile** | View and edit name, email, phone. Shows total rides and rating. |
| **Book Ride** | Enter pickup/drop coordinates and address, vehicle type. Shows fare breakdown with surge multiplier. Confirms booking with idempotency key. Live status polling after booking. |
| **Payment Methods** | List saved cards/UPI. Add new method. Set default. |
| **Ride History** | Paginated list of completed/cancelled rides with status badges. |

**Realtime** (`useRiderSocket`):
- Connects to `/rider` Socket.IO namespace on booking
- Joins `ride:{rideId}` room via `join:ride` event
- Receives `ride:status` events — status badge updates live without page refresh
- Receives `driver:location` — shows driver coordinates while en route

---

### Driver Dashboard (`/driver`)

| Tab | Features |
|---|---|
| **Profile** | View and edit profile. Shows total trips, rating, and earnings. |
| **Vehicles** | List registered vehicles. Add new vehicle with make/model/type/plate. |
| **Availability** | Toggle online (AVAILABLE) / offline. Sends current GPS coordinates on go-online. Location update button for manual push. |
| **Active Trip** | Polls for assigned trip. Full state machine buttons: Driver Arriving → Arrived → Start Trip → Complete Trip → Cancel. Each action calls the corresponding backend endpoint with idempotency key on completion. |
| **Trip History** | Paginated list of past trips. |

**Realtime** (`useDriverSocket`):
- Connects to `/driver` Socket.IO namespace when online
- Receives `ride:offer` — displays accept/decline banner (auto-expires)
- Emits `offer:response` on driver decision
- Emits `location:update` every 3 seconds while online

---

### Admin Dashboard (`/admin`)

| Tab | Features |
|---|---|
| **Tenants** | List all tenants. Create new tenant (name, slug, plan). Copy Tenant ID to clipboard for sharing with riders/drivers. |
| **Regions** | Select a tenant, list its regions. Create new region (name, country code, timezone). Copy Region ID. |

---

## Auth Flow

```
User submits login form
  └─► POST /auth/{role}/login  { tenantId, regionId, email, password }
  └─► Backend sets HTTP-only cookies: access_token (15m), refresh_token (7d)
  └─► AuthContext stores: { user, role, tenantId, regionId }
  └─► React Router redirects to /rider | /driver | /admin

Token expiry (401 response)
  └─► Axios interceptor catches 401
  └─► POST /auth/refresh  (sends refresh_token cookie)
  └─► Retries original request with new token
  └─► If refresh fails → logout → redirect /login
```

---

## WebSocket Architecture

```
Rider connects to /rider namespace
  └─► Authenticates via JWT cookie on handshake
  └─► Emits: join:ride { rideId }   → joins room ride:{rideId}
  └─► Listens: ride:status          → live status badge update
  └─► Listens: driver:location      → driver coordinates while en route
  └─► Listens: ride:completed       → final fare display

Driver connects to /driver namespace
  └─► Authenticates via JWT cookie on handshake
  └─► Listens: ride:offer           → accept/decline banner (6s TTL)
  └─► Emits: offer:response         → { rideId, accepted: true/false }
  └─► Emits: location:update        → { lat, lng } every 3s while online
```

---

## Local Development

### Prerequisites
- Node.js 18+
- Backend running at `http://localhost:3000`

### Setup

```bash
# Clone the repo
git clone https://github.com/NodeNomadKJ/goComet-frontend.git
cd goComet-frontend

# Install dependencies
npm install

# Copy env
cp .env.example .env

# Start dev server
npm run dev
```

App runs at `http://localhost:5173`

### Environment Variables

```bash
# .env
VITE_API_URL=http://localhost:3000
```

### Commands

```bash
npm run dev       # Start dev server (port 5173)
npm run build     # TypeScript check + Vite build → dist/
npm run preview   # Preview production build locally
```

---

## Test Credentials

Seed the backend first (`pnpm --filter @gocomet/api seed`), then get the Tenant ID and Region ID from the Admin dashboard.

| Role | Email | Password |
|---|---|---|
| Rider | rahul@example.com | Test@1234 |
| Driver | suresh@example.com | Test@1234 |
| Admin | admin@gocomet.com | Test@1234 |

> Tenant ID and Region ID are required on the login form. Get them from the Admin dashboard or from `GET /config` on the backend.

---

## Backend Connection

This frontend connects to the [GOComet Backend](https://github.com/NodeNomadKJ/goComet-backend).

| Backend Service | URL |
|---|---|
| REST API | `http://localhost:3000` |
| WebSocket | `ws://localhost:3000` |
| Swagger Docs | `http://localhost:3000/docs` |

---

## Completion Status

```
Phase 1 — Project Scaffold   ████████████  100%   Vite, React 19, Tailwind 4, routing
Phase 2 — Auth Module        ████████████  100%   Login, register, AuthContext, interceptors
Phase 3 — Rider Dashboard    ████████████  100%   Profile, booking, payment methods, history
Phase 4 — Driver Dashboard   ████████████  100%   Profile, vehicles, availability, trip FSM
Phase 5 — Admin Dashboard    ████████████  100%   Tenant + region management
```
