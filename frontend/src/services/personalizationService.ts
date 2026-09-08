import { apiClient } from './apiClient';
import type {
  DashboardSummaryResponse,
  RecommendedStudentResponse,
  RecommendedSkillResponse,
  RecentlyViewedProfileResponse,
  SearchHistoryResponse,
  RecordProfileViewRequest,
  RecordSearchRequest,
  UserActivityResponse,
} from '@/types/api';

export const personalizationService = {
  async getDashboardSummary(): Promise<DashboardSummaryResponse> {
    return apiClient.get<DashboardSummaryResponse>('/dashboard');
  },

  async getRecommendedStudents(limit = 10): Promise<RecommendedStudentResponse[]> {
    return apiClient.get<RecommendedStudentResponse[]>('/recommendations/students', {
      params: { limit },
    });
  },

  async getRecommendedSkills(limit = 10): Promise<RecommendedSkillResponse[]> {
    return apiClient.get<RecommendedSkillResponse[]>('/recommendations/skills', {
      params: { limit },
    });
  },

  async getRecentlyViewedProfiles(limit = 20): Promise<RecentlyViewedProfileResponse[]> {
    return apiClient.get<RecentlyViewedProfileResponse[]>('/history/profiles', {
      params: { limit },
    });
  },

  async recordProfileView(request: RecordProfileViewRequest): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }>('/history/profiles', request);
  },

  async clearProfileHistory(): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>('/history/profiles');
  },

  async getSearchHistory(limit = 10): Promise<SearchHistoryResponse[]> {
    return apiClient.get<SearchHistoryResponse[]>('/history/searches', {
      params: { limit },
    });
  },

  async recordSearch(request: RecordSearchRequest): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }>('/history/searches', request);
  },

  async clearSearchHistory(): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>('/history/searches');
  },

  async getRecentActivity(limit = 10): Promise<UserActivityResponse[]> {
    return apiClient.get<UserActivityResponse[]>('/activity/recent', {
      params: { limit },
    });
  },
};
