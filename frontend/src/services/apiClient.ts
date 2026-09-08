import { ApiClientError, type ApiErrorResponse } from '@/types/api';
import { authService } from '@/auth/authService';

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  timeoutMs?: number;
  _isRetry?: boolean;
}

class ApiClient {
  private readonly baseUrl: string;
  private authToken: string | null = null;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081/api/v1';
  }

  public setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  public getAuthToken(): string | null {
    return this.authToken;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined | null>): string {
    let cleanPath = path.startsWith('/') ? path : `/${path}`;
    
    // Normalize if path already includes '/api/v1' and baseUrl ends with '/api/v1'
    if (this.baseUrl.endsWith('/api/v1') && cleanPath.startsWith('/api/v1/')) {
      cleanPath = cleanPath.substring('/api/v1'.length);
    } else if (this.baseUrl.endsWith('/api/v1') && cleanPath === '/api/v1') {
      cleanPath = '';
    }

    const url = new URL(`${this.baseUrl}${cleanPath}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  public async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { params, body, headers, timeoutMs = 15000, signal: customSignal, _isRetry, ...customConfig } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // If an external signal was provided, link its abort to our controller
    if (customSignal) {
      customSignal.addEventListener('abort', () => controller.abort());
    }

    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (this.authToken) {
      defaultHeaders['Authorization'] = `Bearer ${this.authToken}`;
    }

    const config: RequestInit = {
      ...customConfig,
      headers: {
        ...defaultHeaders,
        ...headers,
      },
      signal: controller.signal,
    };

    if (body !== undefined) {
      config.body = JSON.stringify(body);
    }

    try {
      const url = this.buildUrl(path, params);
      const response = await fetch(url, config);

      if (!response.ok) {
        if (response.status === 401 && !_isRetry) {
          try {
            const session = await authService.getSession();
            if (session?.access_token) {
              this.setAuthToken(session.access_token);
              return await this.request<T>(path, { ...options, _isRetry: true });
            }
          } catch {
            // Ignore refresh error and fall through to throw ApiClientError
          }
        }

        let errorData: ApiErrorResponse;
        try {
          errorData = await response.json();
        } catch {
          errorData = {
            status: response.status,
            error: response.statusText || 'HttpError',
            message: `Request failed with status ${response.status}`,
            path,
          };
        }
        throw new ApiClientError(errorData);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      return (await response.json()) as T;
    } catch (error: unknown) {
      if (error instanceof ApiClientError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiClientError({
          status: 408,
          error: 'TimeoutError',
          message: 'Request timed out or was cancelled',
          path,
        });
      }

      throw new ApiClientError({
        status: 0,
        error: 'NetworkError',
        message: error instanceof Error ? error.message : 'A network error occurred',
        path,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  public get<T>(path: string, options?: Omit<RequestOptions, 'body' | 'method'>): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  public post<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body' | 'method'>): Promise<T> {
    return this.request<T>(path, { ...options, method: 'POST', body });
  }

  public put<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body' | 'method'>): Promise<T> {
    return this.request<T>(path, { ...options, method: 'PUT', body });
  }

  public patch<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body' | 'method'>): Promise<T> {
    return this.request<T>(path, { ...options, method: 'PATCH', body });
  }

  public delete<T>(path: string, options?: Omit<RequestOptions, 'body' | 'method'>): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
