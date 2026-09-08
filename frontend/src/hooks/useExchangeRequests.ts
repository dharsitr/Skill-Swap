import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/useAuth';
import { exchangeService } from '@/services/exchangeService';
import { SESSIONS_QUERY_KEY } from './useSessions';
import type {
  CreateExchangeRequestParams,
  ExchangeRequest,
  ExchangeRequestStatus,
  PageResponse,
} from '@/types/api';

export const EXCHANGE_REQUESTS_QUERY_KEY = ['exchange-requests'];

export function useIncomingRequests(params: {
  status?: ExchangeRequestStatus;
  page?: number;
  size?: number;
} = {}) {
  const { isAuthenticated } = useAuth();

  return useQuery<PageResponse<ExchangeRequest>, Error>({
    queryKey: [...EXCHANGE_REQUESTS_QUERY_KEY, 'incoming', params],
    queryFn: () => exchangeService.getIncomingRequests(params),
    enabled: isAuthenticated,
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useOutgoingRequests(params: {
  status?: ExchangeRequestStatus;
  page?: number;
  size?: number;
} = {}) {
  const { isAuthenticated } = useAuth();

  return useQuery<PageResponse<ExchangeRequest>, Error>({
    queryKey: [...EXCHANGE_REQUESTS_QUERY_KEY, 'outgoing', params],
    queryFn: () => exchangeService.getOutgoingRequests(params),
    enabled: isAuthenticated,
    staleTime: 1000 * 30,
  });
}

export function useExchangeRequest(id: string) {
  const { isAuthenticated } = useAuth();

  return useQuery<ExchangeRequest, Error>({
    queryKey: [...EXCHANGE_REQUESTS_QUERY_KEY, id],
    queryFn: () => exchangeService.getExchangeRequest(id),
    enabled: isAuthenticated && Boolean(id),
  });
}

export function useCreateExchangeRequest() {
  const queryClient = useQueryClient();

  return useMutation<ExchangeRequest, Error, CreateExchangeRequestParams>({
    mutationFn: (params) => exchangeService.createExchangeRequest(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...EXCHANGE_REQUESTS_QUERY_KEY, 'outgoing'] });
    },
  });
}

export function useAcceptExchangeRequest() {
  const queryClient = useQueryClient();

  return useMutation<ExchangeRequest, Error, string>({
    mutationFn: (id) => exchangeService.acceptExchangeRequest(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: [...EXCHANGE_REQUESTS_QUERY_KEY, 'incoming'] });
      queryClient.invalidateQueries({ queryKey: [...EXCHANGE_REQUESTS_QUERY_KEY, id] });
      queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
    },
  });
}

export function useRejectExchangeRequest() {
  const queryClient = useQueryClient();

  return useMutation<ExchangeRequest, Error, string>({
    mutationFn: (id) => exchangeService.rejectExchangeRequest(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: [...EXCHANGE_REQUESTS_QUERY_KEY, 'incoming'] });
      queryClient.invalidateQueries({ queryKey: [...EXCHANGE_REQUESTS_QUERY_KEY, id] });
    },
  });
}

export function useCancelExchangeRequest() {
  const queryClient = useQueryClient();

  return useMutation<ExchangeRequest, Error, string>({
    mutationFn: (id) => exchangeService.cancelExchangeRequest(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: [...EXCHANGE_REQUESTS_QUERY_KEY, 'outgoing'] });
      queryClient.invalidateQueries({ queryKey: [...EXCHANGE_REQUESTS_QUERY_KEY, id] });
    },
  });
}
