import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schedulingService } from '@/services/schedulingService';
import { SESSIONS_QUERY_KEY } from '@/hooks/useSessions';
import type {
  SessionScheduleResponse,
  ScheduleSessionRequest,
  RescheduleSessionRequest,
} from '@/types/api';

export const SCHEDULING_KEYS = {
  all: ['scheduling'] as const,
  session: (sessionId: string) => [...SCHEDULING_KEYS.all, sessionId] as const,
};

export const useSessionSchedule = (sessionId: string) => {
  return useQuery<SessionScheduleResponse, Error>({
    queryKey: SCHEDULING_KEYS.session(sessionId),
    queryFn: () => schedulingService.getSchedule(sessionId),
    enabled: Boolean(sessionId),
    retry: false,
  });
};

type ScheduleSessionArgs =
  | { sessionId: string; request: ScheduleSessionRequest }
  | ScheduleSessionRequest;

export const useScheduleSession = (defaultSessionId?: string) => {
  const queryClient = useQueryClient();
  return useMutation<SessionScheduleResponse, Error, ScheduleSessionArgs>({
    mutationFn: (variables: ScheduleSessionArgs) => {
      const sid =
        'sessionId' in variables && variables.sessionId
          ? variables.sessionId
          : defaultSessionId;
      const req =
        'request' in variables && variables.request
          ? variables.request
          : (variables as ScheduleSessionRequest);

      if (!sid) throw new Error('sessionId is required for scheduling');
      return schedulingService.scheduleSession(sid, req);
    },
    onSuccess: (data, variables) => {
      const sid =
        'sessionId' in variables && variables.sessionId
          ? variables.sessionId
          : defaultSessionId;
      if (sid) {
        queryClient.setQueryData(SCHEDULING_KEYS.session(sid), data);
        queryClient.invalidateQueries({ queryKey: [...SESSIONS_QUERY_KEY, sid] });
      }
      queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    },
  });
};

type RescheduleSessionArgs =
  | { sessionId: string; request: RescheduleSessionRequest }
  | RescheduleSessionRequest;

export const useRescheduleSession = (defaultSessionId?: string) => {
  const queryClient = useQueryClient();
  return useMutation<SessionScheduleResponse, Error, RescheduleSessionArgs>({
    mutationFn: (variables: RescheduleSessionArgs) => {
      const sid =
        'sessionId' in variables && variables.sessionId
          ? variables.sessionId
          : defaultSessionId;
      const req =
        'request' in variables && variables.request
          ? variables.request
          : (variables as RescheduleSessionRequest);

      if (!sid) throw new Error('sessionId is required for rescheduling');
      return schedulingService.rescheduleSession(sid, req);
    },
    onSuccess: (data, variables) => {
      const sid =
        'sessionId' in variables && variables.sessionId
          ? variables.sessionId
          : defaultSessionId;
      if (sid) {
        queryClient.setQueryData(SCHEDULING_KEYS.session(sid), data);
        queryClient.invalidateQueries({ queryKey: [...SESSIONS_QUERY_KEY, sid] });
      }
      queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    },
  });
};
