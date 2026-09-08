import { apiClient } from './apiClient';
import type {
  SessionScheduleResponse,
  ScheduleSessionRequest,
  RescheduleSessionRequest,
} from '@/types/api';

export const schedulingService = {
  getSchedule: async (sessionId: string): Promise<SessionScheduleResponse> => {
    return apiClient.get<SessionScheduleResponse>(`/sessions/${sessionId}/schedule`);
  },

  scheduleSession: async (
    sessionId: string,
    request: ScheduleSessionRequest
  ): Promise<SessionScheduleResponse> => {
    return apiClient.post<SessionScheduleResponse>(`/sessions/${sessionId}/schedule`, request);
  },

  rescheduleSession: async (
    sessionId: string,
    request: RescheduleSessionRequest
  ): Promise<SessionScheduleResponse> => {
    return apiClient.post<SessionScheduleResponse>(`/sessions/${sessionId}/reschedule`, request);
  },
};
