import { apiClient } from './apiClient';
import type { HealthResponse, VersionResponse } from '@/types/api';

export const healthService = {
  getHealth: async (): Promise<HealthResponse> => {
    return apiClient.get<HealthResponse>('/health');
  },

  getVersion: async (): Promise<VersionResponse> => {
    return apiClient.get<VersionResponse>('/version');
  },
};
