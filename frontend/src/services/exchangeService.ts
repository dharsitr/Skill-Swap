import { apiClient } from './apiClient';
import type {
  CreateExchangeRequestParams,
  ExchangeRequest,
  ExchangeRequestStatus,
  PageResponse,
} from '@/types/api';

export const exchangeService = {
  async createExchangeRequest(params: CreateExchangeRequestParams): Promise<ExchangeRequest> {
    return apiClient.post<ExchangeRequest>('/exchange-requests', params);
  },

  async getExchangeRequest(id: string): Promise<ExchangeRequest> {
    return apiClient.get<ExchangeRequest>(`/exchange-requests/${id}`);
  },

  async getIncomingRequests(params: {
    status?: ExchangeRequestStatus;
    page?: number;
    size?: number;
  } = {}): Promise<PageResponse<ExchangeRequest>> {
    return apiClient.get<PageResponse<ExchangeRequest>>('/exchange-requests/incoming', {
      params: {
        status: params.status || undefined,
        page: params.page !== undefined ? params.page : undefined,
        size: params.size !== undefined ? params.size : undefined,
      },
    });
  },

  async getOutgoingRequests(params: {
    status?: ExchangeRequestStatus;
    page?: number;
    size?: number;
  } = {}): Promise<PageResponse<ExchangeRequest>> {
    return apiClient.get<PageResponse<ExchangeRequest>>('/exchange-requests/outgoing', {
      params: {
        status: params.status || undefined,
        page: params.page !== undefined ? params.page : undefined,
        size: params.size !== undefined ? params.size : undefined,
      },
    });
  },

  async acceptExchangeRequest(id: string): Promise<ExchangeRequest> {
    return apiClient.post<ExchangeRequest>(`/exchange-requests/${id}/accept`);
  },

  async rejectExchangeRequest(id: string): Promise<ExchangeRequest> {
    return apiClient.post<ExchangeRequest>(`/exchange-requests/${id}/reject`);
  },

  async cancelExchangeRequest(id: string): Promise<ExchangeRequest> {
    return apiClient.post<ExchangeRequest>(`/exchange-requests/${id}/cancel`);
  },
};
