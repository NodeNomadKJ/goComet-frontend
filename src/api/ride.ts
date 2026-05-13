import { v4 as uuidv4 } from 'uuid';
import { apiClient } from './client';
import type { Ride, FareEstimate, VehicleType } from '../types';

interface LocationInput { pickupLat: number; pickupLng: number; dropLat: number; dropLng: number }

export const rideApi = {
  fareEstimate: (d: LocationInput & { vehicleType?: VehicleType }) =>
    apiClient.post<FareEstimate>('/rides/fare-estimate', d).then(r => r.data),

  createRide: (d: LocationInput & {
    pickupAddress: string;
    dropAddress: string;
    vehicleType?: VehicleType;
    paymentMethodId?: string;
  }) =>
    apiClient.post<Ride>('/rides', d, {
      headers: { 'x-idempotency-key': uuidv4() },
    }).then(r => r.data),

  getActiveRide: () =>
    apiClient.get<Ride | null>('/rides/me/active').then(r => r.data),

  getRide: (rideId: string) =>
    apiClient.get<Ride>(`/rides/${rideId}`).then(r => r.data),

  cancelRide: (rideId: string, reason: string) =>
    apiClient.delete<Ride>(`/rides/${rideId}/cancel`, { data: { reason } }).then(r => r.data),
};
