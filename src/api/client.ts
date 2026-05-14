import axios, { type InternalAxiosRequestConfig } from 'axios';

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

let isRefreshing = false;
let refreshQueue: Array<(retry: boolean) => void> = [];

function flushQueue(retry: boolean) {
  refreshQueue.forEach((resolve) => resolve(retry));
  refreshQueue = [];
}

function logout() {
  localStorage.removeItem('authUser');
  localStorage.removeItem('tenantId');
  localStorage.removeItem('regionId');
  window.location.href = '/login';
}

apiClient.interceptors.response.use(
  (res) => {
    // Backend wraps all responses as { data: <payload> } — unwrap transparently
    if (res.data !== null && typeof res.data === 'object' && 'data' in res.data) {
      res.data = (res.data as { data: unknown }).data;
    }
    return res;
  },
  async (err: unknown) => {
    const axiosErr = err as { response?: { status?: number }; config?: InternalAxiosRequestConfig & { _retried?: boolean } };
    const status = axiosErr.response?.status;
    const config = axiosErr.config;

    // Don't retry the refresh call itself — avoids infinite loop
    if (status !== 401 || !config || config._retried) {
      return Promise.reject(err as Error);
    }

    if (isRefreshing) {
      // Another request already triggered refresh — queue this one
      return new Promise((resolve, reject) => {
        refreshQueue.push((retry) => {
          if (retry) resolve(apiClient(config));
          else reject(err as Error);
        });
      });
    }

    config._retried = true;
    isRefreshing = true;

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL as string}/auth/refresh`,
        {},
        { withCredentials: true },
      );
      flushQueue(true);
      return apiClient(config);
    } catch {
      flushQueue(false);
      logout();
      return Promise.reject(err as Error);
    } finally {
      isRefreshing = false;
    }
  },
);
