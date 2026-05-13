---
name: frontend-architecture-decisions
description: 8 locked architectural decisions for the GOComet frontend — re-read before each session
metadata:
  type: project
---

# Frontend Architecture Decisions

## Decision 1: Single Axios Instance with Interceptors

**Chosen:** `src/api/client.ts` exports one axios instance; all API modules import from it.

**Why:** Tenant/region headers must be injected on every request. A central instance is the only
way to guarantee this without repeating the logic in 7+ API modules. The 401 interceptor also
provides a single redirect point on session expiry.

**How to apply:** Never `import axios from 'axios'` in pages or components. Always import
`apiClient` from `src/api/client`.

---

## Decision 2: Auth State in React Context + localStorage

**Chosen:** AuthContext stores `{ user, tenantId, regionId }` in memory; persisted to localStorage
for page refresh survival. Access token NOT stored — it's in an HttpOnly cookie.

**Why:** The backend sets `access_token` as an HttpOnly cookie (path='/'). JS cannot read it.
We only need to track who is logged in (user object) and the tenant/region context for headers.

**How to apply:** `useAuth()` hook for all auth state. `localStorage` holds `authUser`,
`tenantId`, `regionId` keys only.

---

## Decision 3: Tenant + Region Entered on Login Screen

**Chosen:** Login form has two extra fields: Tenant ID and Region ID (UUID inputs).

**Why:** Backend uses multi-tenancy — all auth calls require `x-tenant-id` and `x-region-id`
headers. The demo cannot hardcode these because seed generates random UUIDs each run.
Admin can look up the IDs from the Admin dashboard once authenticated.

**How to apply:** Store in localStorage after successful login. The axios interceptor reads
them from localStorage. Login form pre-fills from localStorage if present.

---

## Decision 4: TanStack Query for All Server State

**Chosen:** `useQuery` + `useMutation` from `@tanstack/react-query` for all API calls.

**Why:** Handles loading/error states, caching, and re-fetching in one place. Avoids manual
`useState` + `useEffect` patterns for data fetching that are error-prone.

**How to apply:** No manual `fetch` or `axios` calls in components. Always go through
TanStack Query hooks. `QueryClient` is initialized in `main.tsx`.

---

## Decision 5: Tabbed Layout for All Dashboards

**Chosen:** Rider, Driver, and Admin dashboards use a horizontal tab bar with local `useState`.

**Why:** Minimal UI — all features are accessible without deep routing. Single-page feel.
Keeps the component tree shallow and easy to navigate for a demo.

**How to apply:** Each dashboard has a `tab` state. Tab bar renders buttons, conditional
section renders the active tab content.

---

## Decision 6: No Maps — Lat/Lng Number Inputs

**Chosen:** Pickup/drop location uses `<input type="number" step="0.0001">` for lat and lng.

**Why:** Demo simplicity. A map integration adds 200KB+ to bundle and requires API keys.
For showing backend functionality, hardcoded coords (Delhi: 28.6139, 77.2090) suffice.

**How to apply:** All location forms use lat/lng number inputs. Provide placeholder values
of real Indian city coordinates so demo works without user knowing exact values.

---

## Decision 7: Idempotency Keys Generated at API Layer

**Chosen:** `src/api/ride.ts::createRide` and `src/api/trip.ts::completeTrip` call `uuidv4()`
and set `X-Idempotency-Key` header inline.

**Why:** The backend requires this header on ride creation and trip completion. Generating
at the API layer keeps components unaware of this backend contract detail.

**How to apply:** Components call `rideApi.createRide(data)` — no idempotency key param needed.

---

## Decision 8: Role-Based Routing After Login

**Chosen:** After successful login, redirect by role: RIDER→/rider, DRIVER→/driver, ADMIN→/admin.
`<ProtectedRoute role="RIDER">` wrapper on each dashboard route.

**Why:** Prevents a driver from accidentally accessing the rider booking flow and vice versa.
Clean separation matches backend role guards.

**How to apply:** `src/App.tsx` wraps each dashboard in `<ProtectedRoute>` with the required role.
`<ProtectedRoute>` redirects to `/login` if unauthenticated, or to `/` if wrong role.
