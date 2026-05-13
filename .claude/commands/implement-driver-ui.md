# /implement-driver-ui

Implements the Driver Dashboard with 5 tabs.

## What to implement

1. `src/api/driver.ts` — getProfile, updateProfile, setAvailability, updateLocation,
   addVehicle, getVehicles, getTripHistory, getEarnings
2. `src/api/trip.ts` — getActiveTrip, getTrip, driverArriving, driverArrived, startTrip,
   completeTrip (generates X-Idempotency-Key), cancelTrip
3. `src/pages/DriverDashboard.tsx` — tabbed layout with 5 tabs:

### Tab: Profile
- Displays: status badge, rating, totalTrips, earnings (totalEarnings + currency)
- Edit form: name, phone

### Tab: Vehicles
- List vehicles: make, model, year, licensePlate, type, color, isActive badge
- Add vehicle form: make, model, year, licensePlate, type (select), color

### Tab: Availability
- Current status badge (AVAILABLE/OFFLINE/ON_TRIP)
- Go Online: lat input (default 28.6139), lng input (default 77.2090), vehicleId select (from vehicles)
- Go Offline button
- "Update Location" button: sends lat/lng to POST /drivers/location

### Tab: Active Trip
- Polls GET /trips/me/active every 3s
- If no active trip: "No active trip" message
- If trip found: shows trip ID, status badge, ride details
- Action buttons per current status:
  - DRIVER_ASSIGNED → "I'm on the way" (→ DRIVER_ARRIVING)
  - DRIVER_ARRIVING → "I've Arrived" (→ DRIVER_ARRIVED)
  - DRIVER_ARRIVED → "Start Ride" (→ RIDE_STARTED)
  - RIDE_STARTED → "Complete Trip" (→ COMPLETED, uses idempotency key)
  - Any active state → "Cancel Trip" (opens reason input)

### Tab: Trip History
- Table: trip ID, status badge, fare, completedAt
- Paginated

## Verification
- GET /drivers/me returns profile
- Add vehicle → appears in list
- Go online with vehicle → status changes to AVAILABLE
- Update location → 204 response
- Active trip tab polls and shows correct state buttons
- Full state machine walkthrough from DRIVER_ASSIGNED → COMPLETED
