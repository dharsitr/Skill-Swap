import { apiClient } from './apiClient';
import type {
  BlockStatusResponse,
  BlockUserRequest,
  CreateDisputeRequest,
  CreateReportRequest,
  DisputeResponse,
  PageResponse,
  ReportResponse,
  UserBlockResponse,
} from '@/types/api';

export const safetyService = {
  // Blocking
  async blockUser(blockedUserId: string): Promise<UserBlockResponse> {
    return apiClient.post<UserBlockResponse>('/blocks', { blockedUserId } as BlockUserRequest);
  },

  async unblockUser(blockedUserId: string): Promise<void> {
    return apiClient.delete<void>(`/blocks/${blockedUserId}`);
  },

  async getBlockedUsers(page = 0, size = 20): Promise<PageResponse<UserBlockResponse>> {
    return apiClient.get<PageResponse<UserBlockResponse>>('/blocks', {
      params: { page, size },
    });
  },

  async getBlockStatus(userId: string): Promise<BlockStatusResponse> {
    return apiClient.get<BlockStatusResponse>(`/blocks/status/${userId}`);
  },

  // Reporting
  async createReport(request: CreateReportRequest): Promise<ReportResponse> {
    return apiClient.post<ReportResponse>('/reports', request);
  },

  async getMyReports(page = 0, size = 10): Promise<PageResponse<ReportResponse>> {
    return apiClient.get<PageResponse<ReportResponse>>('/reports/my', {
      params: { page, size },
    });
  },

  // Disputes
  async createDispute(request: CreateDisputeRequest): Promise<DisputeResponse> {
    return apiClient.post<DisputeResponse>('/disputes', request);
  },

  async getMyDisputes(page = 0, size = 10): Promise<PageResponse<DisputeResponse>> {
    return apiClient.get<PageResponse<DisputeResponse>>('/disputes/my', {
      params: { page, size },
    });
  },

  async getDisputeForSession(sessionId: string): Promise<DisputeResponse | null> {
    try {
      return await apiClient.get<DisputeResponse>(`/disputes/session/${sessionId}`);
    } catch {
      return null;
    }
  },
};
