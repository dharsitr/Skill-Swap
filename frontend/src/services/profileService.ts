import { apiClient } from './apiClient';
import type { ProfileResponse, UpdateProfileRequest } from '@/types/api';

export const profileService = {
  async getCurrentProfile(): Promise<ProfileResponse> {
    return apiClient.get<ProfileResponse>('/profile/me');
  },

  async updateProfile(request: UpdateProfileRequest): Promise<ProfileResponse> {
    return apiClient.put<ProfileResponse>('/profile/me', request);
  },
};
