import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL as string,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const tenantId = localStorage.getItem('tenantId');
  const regionId = localStorage.getItem('regionId');
  if (tenantId) config.headers['x-tenant-id'] = tenantId;
  if (regionId) config.headers['x-region-id'] = regionId;
  return config;
});

apiClient.interceptors.response.use(
  (res) => {
    // Backend wraps all responses as { data: <payload> } — unwrap transparently
    if (res.data !== null && typeof res.data === 'object' && 'data' in res.data) {
      res.data = (res.data as { data: unknown }).data;
    }
    return res;
  },
  (err: unknown) => {
    const status = (err as { response?: { status?: number } }).response?.status;
    if (status === 401) {
      localStorage.removeItem('authUser');
      localStorage.removeItem('tenantId');
      localStorage.removeItem('regionId');
      window.location.href = '/login';
    }
    return Promise.reject(err as Error);
  },
);
