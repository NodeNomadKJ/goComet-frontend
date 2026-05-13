import { apiClient } from './client';
import type { AuthUser } from '../types';

interface LoginPayload { email: string; password: string }
interface RegisterPayload { name: string; email: string; phone: string; password: string }
interface AuthResponse { user: AuthUser; expiresIn: number }

export const authApi = {
  riderLogin: (d: LoginPayload) =>
    apiClient.post<AuthResponse>('/auth/rider/login', d).then(r => r.data),
  driverLogin: (d: LoginPayload) =>
    apiClient.post<AuthResponse>('/auth/driver/login', d).then(r => r.data),
  adminLogin: (d: LoginPayload) =>
    apiClient.post<AuthResponse>('/auth/admin/login', d).then(r => r.data),
  riderRegister: (d: RegisterPayload) =>
    apiClient.post<AuthResponse>('/auth/rider/register', d).then(r => r.data),
  driverRegister: (d: RegisterPayload) =>
    apiClient.post<AuthResponse>('/auth/driver/register', d).then(r => r.data),
  logout: () =>
    apiClient.post('/auth/logout').then(r => r.data),
};
