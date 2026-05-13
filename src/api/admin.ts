import { apiClient } from './client';
import type { Tenant, Region } from '../types';

export const adminApi = {
  getTenants: () =>
    apiClient.get<Tenant[]>('/admin/tenants').then(r => r.data),
  createTenant: (d: { name: string; slug: string; plan?: string }) =>
    apiClient.post<Tenant>('/admin/tenants', d).then(r => r.data),
  getRegions: (tenantId: string) =>
    apiClient.get<Region[]>(`/admin/tenants/${tenantId}/regions`).then(r => r.data),
  createRegion: (tenantId: string, d: { name: string; countryCode: string; timezone?: string }) =>
    apiClient.post<Region>(`/admin/tenants/${tenantId}/regions`, d).then(r => r.data),
};
