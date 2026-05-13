# /implement-rider-ui

Implements the Rider Dashboard with 4 tabs.

## What to implement

1. `src/api/rider.ts` — getProfile, updateProfile, getPaymentMethods, addPaymentMethod,
   setDefaultPaymentMethod, getRideHistory
2. `src/api/ride.ts` — fareEstimate, createRide (generates X-Idempotency-Key), getRide, cancelRide
3. `src/components/StatusBadge.tsx` — colored badge per RideStatus / DriverStatus
4. `src/pages/RiderDashboard.tsx` — tabbed layout with 4 tabs:

### Tab: Profile
- Displays: rating, totalRides, preferences (defaultVehicleType)
- Shows user name/email from authContext
- Edit form: name, phone, defaultVehicleType (select)

### Tab: Book Ride
- Form: pickupLat, pickupLng, pickupAddress, dropLat, dropLng, dropAddress, vehicleType select
- Pre-fill lat/lng with Delhi coords (28.6139, 77.2090 and 28.7041, 77.1025) as defaults
- "Get Estimate" button → shows fare card (amount, distance, duration, surge)
- "Book Ride" button → POST /rides → shows confirmation with ride ID and status
- After booking: poll GET /rides/:id every 3s and show live status badge
- Cancel button if status is REQUESTED or MATCHING

### Tab: Payment Methods
- List current methods (type, provider, maskedDetails, isDefault badge)
- "Add" form: type select (CARD/WALLET/UPI/CASH), provider, maskedDetails
- "Set Default" button on each method

### Tab: Ride History
- Paginated table: pickup→drop, vehicleType, status badge, fare, date
- Prev/Next pagination buttons

## Verification
- GET /riders/me returns profile
- POST /rides/fare-estimate shows estimated fare
- POST /rides creates ride with status REQUESTED
- Status polling updates badge every 3s
- Payment method list + add flow works
