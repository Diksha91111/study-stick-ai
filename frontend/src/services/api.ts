import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

let inMemoryAccessToken: string | null = null;

export const setInMemoryAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
};

export const getInMemoryAccessToken = (): string | null => {
  return inMemoryAccessToken;
};

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dedicated client for refresh requests that does NOT have the retry interceptor
const refreshClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach in-memory bearer token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (inMemoryAccessToken && config.headers) {
      config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Single-flight refresh token state
let refreshPromise: Promise<string> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      // If already retried, do not retry again to prevent infinite loops
      if (originalRequest._retry) {
        return Promise.reject(error);
      }

      // Do not attempt to refresh if the request was login, register, refresh, or logout
      const requestUrl = originalRequest.url || '';
      if (
        requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/register') ||
        requestUrl.includes('/auth/refresh') ||
        requestUrl.includes('/auth/logout')
      ) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      // Start single-flight refresh if not already active
      if (!refreshPromise) {
        refreshPromise = (async () => {
          try {
            const { data } = await refreshClient.post('/auth/refresh');
            const newAccessToken = data.data?.accessToken;
            if (!newAccessToken) {
              throw new Error('No access token returned from refresh endpoint');
            }
            setInMemoryAccessToken(newAccessToken);
            return newAccessToken;
          } catch (refreshErr) {
            setInMemoryAccessToken(null);
            window.dispatchEvent(new Event('session-expired'));
            throw refreshErr;
          } finally {
            refreshPromise = null;
          }
        })();
      }

      try {
        const newAccessToken = await refreshPromise;
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return api(originalRequest);
      } catch (refreshErr) {
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
