import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from './apiClient';
import { ApiClientError } from '@/types/api';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Centralized ApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('performs GET request and parses JSON response successfully', async () => {
    const mockData = { status: 'UP' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockData,
    });

    const result = await apiClient.get<{ status: string }>('/health');
    expect(result).toEqual(mockData);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/health'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }),
      })
    );
  });

  it('handles query parameters cleanly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ count: 5 }),
    });

    await apiClient.get('/test', { params: { query: 'react', limit: 10 } });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/test\?query=react&limit=10$/),
      expect.anything()
    );
  });

  it('throws ApiClientError when response is not ok', async () => {
    const errorResponse = {
      status: 404,
      error: 'Not Found',
      message: 'Resource not found',
      path: '/api/v1/unknown',
    };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => errorResponse,
    });

    await expect(apiClient.get('/unknown')).rejects.toThrow(ApiClientError);
  });

  it('handles network failure properly', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    try {
      await apiClient.get('/health');
      expect.fail('Should have thrown an error');
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(ApiClientError);
      const apiErr = err as ApiClientError;
      expect(apiErr.status).toBe(0);
      expect(apiErr.error).toBe('NetworkError');
    }
  });
});
