# /implement-auth-ui

Implements the complete auth module: login, register, AuthContext, axios client.

## What to implement

1. `src/types/index.ts` — UserRole, VehicleType, DriverStatus, RideStatus, TripStatus,
   PaymentMethodType, AuthUser, RiderProfile, DriverProfile, Vehicle, PaymentMethod, Ride,
   Trip, FareEstimate, Tenant, Region, PaginatedResult
2. `src/api/client.ts` — axios instance (baseURL: http://localhost:3000, withCredentials: true),
   request interceptor (inject x-tenant-id, x-region-id from localStorage),
   response interceptor (401 → redirect to /login)
3. `src/api/auth.ts` — riderLogin, driverLogin, adminLogin, riderRegister, driverRegister, logout, refresh
4. `src/context/AuthContext.tsx` — AuthProvider, useAuth hook; persists to localStorage
5. `src/pages/LoginPage.tsx` — 3 tabs (RIDER/DRIVER/ADMIN); email+password fields;
   Tenant ID + Region ID fields (pre-filled from localStorage); role-based redirect after login
6. `src/pages/RegisterPage.tsx` — 2 tabs (RIDER/DRIVER); name+email+phone+password;
   Tenant ID + Region ID fields; redirect to /login after success
7. `src/components/Navbar.tsx` — logo, user email, role badge, logout button
8. `src/components/ErrorAlert.tsx` — extracts axios error message from response.data.message

## Verification
- POST /auth/rider/login with rahul@example.com / Test@1234 → redirects to /rider
- POST /auth/driver/login with suresh@example.com / Test@1234 → redirects to /driver
- POST /auth/admin/login with admin@gocomet.com / Test@1234 → redirects to /admin
- Logout clears localStorage and redirects to /login
- Wrong password shows error below form
