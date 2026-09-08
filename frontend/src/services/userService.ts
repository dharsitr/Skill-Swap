import { apiClient } from './apiClient';
import type { UserResponse } from '@/types/api';

export const userService = {
  async getCurrentUser(): Promise<UserResponse> {
    return apiClient.get<UserResponse>('/users/me');
  },

  async deleteAccount(): Promise<void> {
    return apiClient.delete<void>('/users/me');
  },
};
