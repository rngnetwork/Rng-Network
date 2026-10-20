import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import { ApiResponse, ProblemDetails, ApiHttpError } from './types';

const rawEnvBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
export const API_ROOT_URL = rawEnvBase.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
export const API_BASE_URL = `${API_ROOT_URL}/api/v1`;

export const refreshClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export function getStoredAccessToken(): string {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem('rng_access_token') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('token') ||
    ''
  );
}

export function setStoredAccessToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('rng_access_token', token);
  localStorage.setItem('accessToken', token);
  localStorage.setItem('token', token);
}

export function clearStoredAccessToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('rng_access_token');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('token');
}

export function withTokenConfig(
  token?: string,
  config?: AxiosRequestConfig
): AxiosRequestConfig {
  if (!token) return config || {};
  return {
    ...config,
    headers: {
      ...(config?.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  };
}

export class HttpClient {
  private instance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: AxiosError | Error) => void;
  }> = [];

  constructor(customInstance?: AxiosInstance) {
    this.instance =
      customInstance ||
      axios.create({
        baseURL: API_BASE_URL,
        timeout: 15000,
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      });

    this.setupInterceptors();
  }

  public getAxiosInstance(): AxiosInstance {
    return this.instance;
  }

  private processQueue(error: AxiosError | Error | null, token: string | null = null): void {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else if (token) {
        prom.resolve(token);
      }
    });
    this.failedQueue = [];
  }

  private setupInterceptors(): void {
    this.instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      if (typeof window !== 'undefined' && config.headers && !config.headers.Authorization) {
        const token = getStoredAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    });

    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse<unknown>>) => response,
      async (error: AxiosError<ProblemDetails & { message?: string }>) => {
        const originalRequest = error.config as
          | (InternalAxiosRequestConfig & { _retry?: boolean })
          | undefined;

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          if (this.isRefreshing) {
            originalRequest._retry = true;
            return new Promise<AxiosResponse>((resolve, reject) => {
              this.failedQueue.push({
                resolve: (token: string) => {
                  if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                  }
                  resolve(this.instance(originalRequest));
                },
                reject: (err) => reject(err),
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshRes = await refreshClient.post<ApiResponse<{ accessToken: string }>>(
              '/auth/refresh'
            );
            const newToken = refreshRes.data?.data?.accessToken;

            if (newToken) {
              setStoredAccessToken(newToken);
              this.instance.defaults.headers.common.Authorization = `Bearer ${newToken}`;
              this.processQueue(null, newToken);
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
              }
              return this.instance(originalRequest);
            }
            throw new Error('Token refresh payload missing accessToken');
          } catch (refreshErr) {
            const normalizedErr =
              refreshErr instanceof Error ? refreshErr : new Error('Token refresh failed');
            this.processQueue(normalizedErr, null);
            if (typeof window !== 'undefined') {
              const currentPath =
                (window.location?.pathname || '/') + (window.location?.search || '');
              const returnToUrl = `/auth/login?returnTo=${encodeURIComponent(currentPath)}`;
              window.dispatchEvent(
                new CustomEvent('rng:session-expired', {
                  detail: { returnTo: returnToUrl },
                })
              );
              clearStoredAccessToken();
              const isJsdom =
                typeof navigator !== 'undefined' &&
                typeof navigator.userAgent === 'string' &&
                navigator.userAgent.toLowerCase().includes('jsdom');
              if (!currentPath.startsWith('/auth') && !isJsdom) {
                window.open(returnToUrl, '_self');
              }
            }
            return Promise.reject(normalizedErr);
          } finally {
            this.isRefreshing = false;
          }
        }

        if (error.response) {
          const status = error.response.status;
          const payload = error.response.data;
          const message =
            payload?.detail ||
            payload?.message ||
            payload?.title ||
            error.message ||
            `Request failed with status ${status}`;
          const problemDetails: ProblemDetails | undefined =
            payload && typeof payload === 'object' && 'title' in payload
              ? {
                  type: payload.type || 'about:blank',
                  title: payload.title || 'Error',
                  status,
                  detail: payload.detail || message,
                  instance: payload.instance,
                  invalidParams: payload.invalidParams,
                }
              : undefined;
          return Promise.reject(new ApiHttpError(message, status, payload, problemDetails));
        }

        return Promise.reject(error);
      }
    );
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const res = await this.instance.get<ApiResponse<T>>(url, config);
    return res.data;
  }

  public async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const res = await this.instance.post<ApiResponse<T>>(url, data, config);
    return res.data;
  }

  public async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const res = await this.instance.put<ApiResponse<T>>(url, data, config);
    return res.data;
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const res = await this.instance.delete<ApiResponse<T>>(url, config);
    return res.data;
  }
}

export const httpClient = new HttpClient();
