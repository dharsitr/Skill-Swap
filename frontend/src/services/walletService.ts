import { apiClient } from './apiClient';
import type {
  CreditBalance,
  CreditTransaction,
  CreditWallet,
  PageResponse,
  SessionSettlement,
} from '@/types/api';

export const walletService = {
  async getWallet(): Promise<CreditWallet> {
    return apiClient.get<CreditWallet>('/wallet');
  },

  async getBalance(): Promise<CreditBalance> {
    return apiClient.get<CreditBalance>('/wallet/balance');
  },

  async getTransactions(params: {
    page?: number;
    size?: number;
  } = {}): Promise<PageResponse<CreditTransaction>> {
    const searchParams = new URLSearchParams();
    if (params.page !== undefined) searchParams.append('page', String(params.page));
    if (params.size !== undefined) searchParams.append('size', String(params.size));

    const queryString = searchParams.toString();
    const endpoint = `/wallet/transactions${queryString ? `?${queryString}` : ''}`;
    return apiClient.get<PageResponse<CreditTransaction>>(endpoint);
  },

  async getTransaction(id: string): Promise<CreditTransaction> {
    return apiClient.get<CreditTransaction>(`/wallet/transactions/${id}`);
  },

  async settleSession(sessionId: string): Promise<SessionSettlement> {
    return apiClient.post<SessionSettlement>(`/sessions/${sessionId}/settle`);
  },
};
