export type UserRole = 'RIDER' | 'DRIVER' | 'ADMIN';
export type VehicleType = 'ECONOMY' | 'PREMIUM' | 'XL' | 'AUTO' | 'BIKE' | 'ANY';
export type DriverStatus = 'AVAILABLE' | 'OFFLINE' | 'ON_TRIP';
export type RideStatus =
  | 'REQUESTED' | 'MATCHING' | 'DRIVER_ASSIGNED' | 'DRIVER_ARRIVING'
  | 'DRIVER_ARRIVED' | 'RIDE_STARTED' | 'COMPLETED'
  | 'PAYMENT_PENDING' | 'PAYMENT_COMPLETED' | 'CANCELLED' | 'FAILED';
export type TripStatus = RideStatus;
export type PaymentMethodType = 'CARD' | 'WALLET' | 'UPI' | 'CASH';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface RiderProfile {
  id: string;
  userId: string;
  rating: number;
  totalRides: number;
  preferences: {
    defaultVehicleType: VehicleType;
    defaultPaymentMethodId: string | null;
  };
}

export interface DriverProfile {
  id: string;
  userId: string;
  status: DriverStatus;
  rating: number;
  totalTrips: number;
  activeVehicleId: string | null;
  lastLocationLat: number | null;
  lastLocationLng: number | null;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  type: VehicleType;
  color: string | null;
  isActive: boolean;
}

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  provider: string | null;
  maskedDetails: string | null;
  isDefault: boolean;
}

export interface Ride {
  id: string;
  riderId: string;
  driverId: string | null;
  status: RideStatus;
  pickupAddress: string;
  dropAddress: string;
  pickupLat: string;
  pickupLng: string;
  dropLat: string;
  dropLng: string;
  vehicleType: VehicleType;
  fareEstimate: string;     // TypeORM decimal → always string from API
  surgeMultiplier: string;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Trip {
  id: string;
  rideId: string;
  status: TripStatus;
  driverId: string;
  riderId: string;
  finalFare: number | null;
  currency: string;
  startedAt: string | null;
  completedAt: string | null;
  durationSecs: number | null;
  distanceKm: number | null;
  cancellationReason: string | null;
}

export interface FareEstimate {
  total: number;
  basefare: number;
  distanceFare: number;
  distanceKm: number;
  surgeMultiplier: number;
  currency: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  isActive: boolean;
}

export interface Region {
  id: string;
  name: string;
  countryCode: string;
  timezone: string;
  isActive: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
