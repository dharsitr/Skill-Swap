import { apiClient } from './apiClient';
import type {
  DisputeStatus,
  ModerationDisputeDetailResponse,
  ModerationReportDetailResponse,
  PageResponse,
  ReportStatus,
  UpdateDisputeStatusRequest,
  UpdateReportStatusRequest,
} from '@/types/api';

export const moderationService = {
  async getReports(status?: ReportStatus, page = 0, size = 20): Promise<PageResponse<ModerationReportDetailResponse>> {
    return apiClient.get<PageResponse<ModerationReportDetailResponse>>('/moderation/reports', {
      params: {
        status: status || undefined,
        page,
        size,
      },
    });
  },

  async getReportById(id: string): Promise<ModerationReportDetailResponse> {
    return apiClient.get<ModerationReportDetailResponse>(`/moderation/reports/${id}`);
  },

  async updateReportStatus(id: string, request: UpdateReportStatusRequest): Promise<ModerationReportDetailResponse> {
    return apiClient.patch<ModerationReportDetailResponse>(`/moderation/reports/${id}/status`, request);
  },

  async getDisputes(status?: DisputeStatus, page = 0, size = 20): Promise<PageResponse<ModerationDisputeDetailResponse>> {
    return apiClient.get<PageResponse<ModerationDisputeDetailResponse>>('/moderation/disputes', {
      params: {
        status: status || undefined,
        page,
        size,
      },
    });
  },

  async getDisputeById(id: string): Promise<ModerationDisputeDetailResponse> {
    return apiClient.get<ModerationDisputeDetailResponse>(`/moderation/disputes/${id}`);
  },

  async updateDisputeStatus(id: string, request: UpdateDisputeStatusRequest): Promise<ModerationDisputeDetailResponse> {
    return apiClient.patch<ModerationDisputeDetailResponse>(`/moderation/disputes/${id}/status`, request);
  },
};
