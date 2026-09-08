import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/useAuth';
import { walletService } from '@/services/walletService';
import { SESSIONS_QUERY_KEY } from './useSessions';
import type {
  CreditBalance,
  CreditTransaction,
  CreditWallet,
  PageResponse,
  SessionSettlement,
} from '@/types/api';

export const WALLET_QUERY_KEY = ['wallet'];
export const TRANSACTIONS_QUERY_KEY = ['wallet', 'transactions'];

export function useWallet() {
  const { isAuthenticated } = useAuth();

  return useQuery<CreditWallet, Error>({
    queryKey: WALLET_QUERY_KEY,
    queryFn: () => walletService.getWallet(),
    enabled: isAuthenticated,
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useWalletBalance() {
  const { isAuthenticated } = useAuth();

  return useQuery<CreditBalance, Error>({
    queryKey: [...WALLET_QUERY_KEY, 'balance'],
    queryFn: () => walletService.getBalance(),
    enabled: isAuthenticated,
    staleTime: 1000 * 30,
  });
}

export function useWalletTransactions(params: {
  page?: number;
  size?: number;
} = {}) {
  const { isAuthenticated } = useAuth();

  return useQuery<PageResponse<CreditTransaction>, Error>({
    queryKey: [...TRANSACTIONS_QUERY_KEY, params],
    queryFn: () => walletService.getTransactions(params),
    enabled: isAuthenticated,
    staleTime: 1000 * 30,
  });
}

export function useTransaction(id: string) {
  const { isAuthenticated } = useAuth();

  return useQuery<CreditTransaction, Error>({
    queryKey: [...TRANSACTIONS_QUERY_KEY, id],
    queryFn: () => walletService.getTransaction(id),
    enabled: isAuthenticated && Boolean(id),
  });
}

export function useSettleSession() {
  const queryClient = useQueryClient();

  return useMutation<SessionSettlement, Error, string>({
    mutationFn: (sessionId) => walletService.settleSession(sessionId),
    onSuccess: (_data, sessionId) => {
      queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...SESSIONS_QUERY_KEY, sessionId] });
    },
  });
}
