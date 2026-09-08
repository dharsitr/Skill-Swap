import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/useAuth';
import { sessionService } from '@/services/sessionService';
import type {
  PageResponse,
  Session,
  SessionStatus,
} from '@/types/api';

export const SESSIONS_QUERY_KEY = ['sessions'];

export function useSessions(params: {
  status?: SessionStatus;
  page?: number;
  size?: number;
} = {}) {
  const { isAuthenticated } = useAuth();

  return useQuery<PageResponse<Session>, Error>({
    queryKey: [...SESSIONS_QUERY_KEY, params],
    queryFn: () => sessionService.getSessions(params),
    enabled: isAuthenticated,
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useSession(id: string) {
  const { isAuthenticated } = useAuth();

  return useQuery<Session, Error>({
    queryKey: [...SESSIONS_QUERY_KEY, id],
    queryFn: () => sessionService.getSession(id),
    enabled: isAuthenticated && Boolean(id),
  });
}

export function useStartSession() {
  const queryClient = useQueryClient();

  return useMutation<Session, Error, string>({
    mutationFn: (id) => sessionService.startSession(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...SESSIONS_QUERY_KEY, id] });
    },
  });
}

export function useCompleteSession() {
  const queryClient = useQueryClient();

  return useMutation<Session, Error, string>({
    mutationFn: (id) => sessionService.completeSession(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...SESSIONS_QUERY_KEY, id] });
    },
  });
}

export function useCancelSession() {
  const queryClient = useQueryClient();

  return useMutation<Session, Error, string>({
    mutationFn: (id) => sessionService.cancelSession(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...SESSIONS_QUERY_KEY, id] });
    },
  });
}
