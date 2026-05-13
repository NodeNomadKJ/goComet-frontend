import { apiClient } from './client';
import type { RiderProfile, PaymentMethod, Ride, PaginatedResult, VehicleType, PaymentMethodType } from '../types';

export const riderApi = {
  getProfile: () =>
    apiClient.get<RiderProfile>('/riders/me').then(r => r.data),
  updateProfile: (d: { name?: string; phone?: string; defaultVehicleType?: VehicleType }) =>
    apiClient.patch<RiderProfile>('/riders/me', d).then(r => r.data),
  getPaymentMethods: () =>
    apiClient.get<PaymentMethod[]>('/riders/me/payment-methods').then(r => r.data),
  addPaymentMethod: (d: { type: PaymentMethodType; provider?: string; maskedDetails?: string }) =>
    apiClient.post<PaymentMethod>('/riders/me/payment-methods', d).then(r => r.data),
  setDefaultPaymentMethod: (methodId: string) =>
    apiClient.post(`/riders/me/payment-methods/${methodId}/default`).then(r => r.data),
  getRideHistory: (page = 1, limit = 20) =>
    apiClient.get<PaginatedResult<Ride>>('/rides', { params: { page, limit } }).then(r => r.data),
};
