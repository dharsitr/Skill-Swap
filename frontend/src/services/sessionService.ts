import { apiClient } from './apiClient';
import type {
  PageResponse,
  Session,
  SessionStatus,
} from '@/types/api';

export const sessionService = {
  async getSessions(params: {
    status?: SessionStatus;
    page?: number;
    size?: number;
  } = {}): Promise<PageResponse<Session>> {
    return apiClient.get<PageResponse<Session>>('/sessions', {
      params: {
        status: params.status || undefined,
        page: params.page !== undefined ? params.page : undefined,
        size: params.size !== undefined ? params.size : undefined,
      },
    });
  },

  async getSession(id: string): Promise<Session> {
    return apiClient.get<Session>(`/sessions/${id}`);
  },

  async startSession(id: string): Promise<Session> {
    return apiClient.post<Session>(`/sessions/${id}/start`);
  },

  async completeSession(id: string): Promise<Session> {
    return apiClient.post<Session>(`/sessions/${id}/complete`);
  },

  async cancelSession(id: string): Promise<Session> {
    return apiClient.post<Session>(`/sessions/${id}/cancel`);
  },

  async getCallAccess(id: string): Promise<import('@/types/webrtc').SessionCallAccessResponse> {
    return apiClient.get<import('@/types/webrtc').SessionCallAccessResponse>(`/sessions/${id}/call/access`);
  },
};
