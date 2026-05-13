import type { AxiosResponse } from 'axios';
import { apiClient } from './client';
import type { DriverProfile, Vehicle, PaginatedResult, VehicleType, Trip } from '../types';

const get = <T>(r: AxiosResponse<T>) => r.data;

export const driverApi = {
  getProfile: () =>
    apiClient.get<DriverProfile>('/drivers/me').then(get),
  updateProfile: (d: { name?: string; phone?: string }) =>
    apiClient.patch<DriverProfile>('/drivers/me', d).then(get),
  setAvailability: (d: { status: 'AVAILABLE' | 'OFFLINE'; lat?: number; lng?: number; vehicleId?: string }) =>
    apiClient.post<{ status: string; activeVehicleId: string | null }>('/drivers/me/availability', d).then(get),
  updateLocation: (d: { lat: number; lng: number; heading?: number }) =>
    apiClient.post<void>('/drivers/location', d).then(get),
  addVehicle: (d: { make: string; model: string; year: number; licensePlate: string; type: VehicleType; color?: string }) =>
    apiClient.post<Vehicle>('/drivers/me/vehicles', d).then(get),
  getVehicles: () =>
    apiClient.get<Vehicle[]>('/drivers/me/vehicles').then(get),
  getTripHistory: (page = 1, limit = 20) =>
    apiClient.get<PaginatedResult<Trip>>('/trips/me/history', { params: { page, limit } }).then(get),
  getEarnings: () =>
    apiClient.get<{ totalEarnings: number; currency: string }>('/drivers/me/earnings').then(get),
};
