import { apiClient } from './apiClient';
import type {
  CreateReviewRequest,
  ReviewResponse,
  RatingSummaryResponse,
  SessionReviewStatusResponse,
  PageResponse,
} from '@/types/api';

export const reviewService = {
  async createReview(request: CreateReviewRequest): Promise<ReviewResponse> {
    return apiClient.post<ReviewResponse>('/reviews', request);
  },

  async getUserReviews(userId: string, page = 0, size = 10): Promise<PageResponse<ReviewResponse>> {
    return apiClient.get<PageResponse<ReviewResponse>>(`/reviews/profile/${userId}`, {
      params: { page, size },
    });
  },

  async getUserRatingSummary(userId: string): Promise<RatingSummaryResponse> {
    return apiClient.get<RatingSummaryResponse>(`/reviews/summary/${userId}`);
  },

  async getSessionReviewStatus(sessionId: string): Promise<SessionReviewStatusResponse> {
    return apiClient.get<SessionReviewStatusResponse>(`/reviews/session/${sessionId}/status`);
  },
};
