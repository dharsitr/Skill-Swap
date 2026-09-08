import { apiClient } from './apiClient';
import type {
  UserAvailabilityResponse,
  CreateAvailabilityRequest,
  UpdateAvailabilityRequest,
} from '@/types/api';

export const availabilityService = {
  getMyAvailability: async (): Promise<UserAvailabilityResponse[]> => {
    return apiClient.get<UserAvailabilityResponse[]>('/availability/me');
  },

  createAvailability: async (request: CreateAvailabilityRequest): Promise<UserAvailabilityResponse> => {
    return apiClient.post<UserAvailabilityResponse>('/availability', request);
  },

  updateAvailability: async (id: string, request: UpdateAvailabilityRequest): Promise<UserAvailabilityResponse> => {
    return apiClient.put<UserAvailabilityResponse>(`/availability/${id}`, request);
  },

  deleteAvailability: async (id: string): Promise<void> => {
    await apiClient.delete(`/availability/${id}`);
  },
};
