import { apiClient } from './apiClient';
import type {
  DiscoveryCandidate,
  DiscoveryFilterParams,
  PageResponse,
  PublicProfile,
} from '@/types/api';

export const discoveryService = {
  async discoverStudents(params: DiscoveryFilterParams = {}): Promise<PageResponse<DiscoveryCandidate>> {
    return apiClient.get<PageResponse<DiscoveryCandidate>>('/discover', {
      params: {
        mode: params.mode || undefined,
        search: params.search || undefined,
        skillId: params.skillId || undefined,
        categoryId: params.categoryId || undefined,
        proficiency: params.proficiency || undefined,
        page: params.page !== undefined ? params.page : undefined,
        size: params.size !== undefined ? params.size : undefined,
        sort: params.sort || undefined,
      },
    });
  },

  async getRecommendedStudents(page = 0, size = 6): Promise<PageResponse<DiscoveryCandidate>> {
    return apiClient.get<PageResponse<DiscoveryCandidate>>('/discover/recommended', {
      params: { page, size },
    });
  },

  async getPublicProfile(userId: string): Promise<PublicProfile> {
    return apiClient.get<PublicProfile>(`/users/${userId}/public-profile`);
  },
};
