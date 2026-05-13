import { v4 as uuidv4 } from 'uuid';
import { apiClient } from './client';
import type { Trip } from '../types';

export const tripApi = {
  getActiveTrip: () =>
    apiClient.get<Trip | null>('/trips/me/active').then(r => r.data),
  getTrip: (id: string) =>
    apiClient.get<Trip>(`/trips/${id}`).then(r => r.data),
  driverArriving: (id: string) =>
    apiClient.post<Trip>(`/trips/${id}/driver-arriving`).then(r => r.data),
  driverArrived: (id: string) =>
    apiClient.post<Trip>(`/trips/${id}/driver-arrived`).then(r => r.data),
  startTrip: (id: string) =>
    apiClient.post<Trip>(`/trips/${id}/start`).then(r => r.data),
  completeTrip: (id: string) =>
    apiClient.post<Trip>(`/trips/${id}/complete`, {}, {
      headers: { 'x-idempotency-key': uuidv4() },
    }).then(r => r.data),
  cancelTrip: (id: string, reason?: string) =>
    apiClient.post<Trip>(`/trips/${id}/cancel`, { reason }).then(r => r.data),
};
