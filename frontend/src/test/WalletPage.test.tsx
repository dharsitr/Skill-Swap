import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WalletPage } from '@/pages/WalletPage';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/auth/AuthContext';
import { authService } from '@/auth/authService';
import { walletService } from '@/services/walletService';
import type { CreditWallet, CreditTransaction, PageResponse } from '@/types/api';

vi.mock('@/auth/authService', () => ({
  authService: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock('@/services/walletService', () => ({
  walletService: {
    getWallet: vi.fn(),
    getBalance: vi.fn(),
    getTransactions: vi.fn(),
    getTransaction: vi.fn(),
    settleSession: vi.fn(),
  },
}));

describe('WalletPage Component', () => {
  const mockWallet: CreditWallet = {
    id: 'wallet-1',
    userId: 'usr-1',
    balance: 15,
    createdAt: '2026-08-29T10:00:00Z',
    updatedAt: '2026-08-29T12:00:00Z',
  };

  const mockTransactions: CreditTransaction[] = [
    {
      id: 'tx-1',
      walletId: 'wallet-1',
      userId: 'usr-1',
      amount: 10,
      direction: 'CREDIT',
      type: 'INITIAL_CREDIT',
      description: 'Welcome bonus credits',
      createdAt: '2026-08-29T10:00:00Z',
    },
    {
      id: 'tx-2',
      walletId: 'wallet-1',
      userId: 'usr-1',
      amount: 5,
      direction: 'CREDIT',
      type: 'SESSION_EARNING',
      sessionId: 'sess-1',
      description: 'Credits earned for teaching Python',
      createdAt: '2026-08-29T11:00:00Z',
    },
    {
      id: 'tx-3',
      walletId: 'wallet-1',
      userId: 'usr-1',
      amount: 5,
      direction: 'DEBIT',
      type: 'SESSION_SPENDING',
      sessionId: 'sess-2',
      description: 'Credits spent for learning React',
      createdAt: '2026-08-29T12:00:00Z',
    },
  ];

  const mockTransactionPage: PageResponse<CreditTransaction> = {
    items: mockTransactions,
    page: 0,
    size: 10,
    totalElements: 3,
    totalPages: 1,
    first: true,
    last: true,
  };

  const mockEmptyTransactionPage: PageResponse<CreditTransaction> = {
    items: [],
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
  };

  let testQueryClient: QueryClient;

  beforeEach(() => {
    testQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();

    vi.mocked(authService.getSession).mockResolvedValue({
      user: { id: 'usr-1', email: 'user@campus.edu' } as any,
      access_token: 'valid-token',
    } as any);

    vi.mocked(walletService.getWallet).mockResolvedValue(mockWallet);
    vi.mocked(walletService.getTransactions).mockResolvedValue(mockTransactionPage);
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={testQueryClient}>
        <AuthProvider>
          <BrowserRouter>
            <WalletPage />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    );

  it('renders credit wallet balance and transaction list', async () => {
    renderComponent();

    expect(screen.getByText('Credit Wallet & Transactions')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Credits earned for teaching Python')).toBeInTheDocument();
    });

    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('Welcome bonus credits')).toBeInTheDocument();
    expect(screen.getByText('Credits spent for learning React')).toBeInTheDocument();
    expect(screen.getAllByText(/\+10 Credits/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\+5 Credits/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/-5 Credits/i).length).toBeGreaterThan(0);
  });

  it('filters transactions by type', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Credits earned for teaching Python')).toBeInTheDocument();
    });

    // Click Earnings filter
    fireEvent.click(screen.getByRole('button', { name: /earnings/i }));

    expect(screen.getByText('Credits earned for teaching Python')).toBeInTheDocument();
    expect(screen.queryByText('Credits spent for learning React')).not.toBeInTheDocument();
    expect(screen.queryByText('Welcome bonus credits')).not.toBeInTheDocument();

    // Click Spendings filter
    fireEvent.click(screen.getByRole('button', { name: /spendings/i }));

    expect(screen.getByText('Credits spent for learning React')).toBeInTheDocument();
    expect(screen.queryByText('Credits earned for teaching Python')).not.toBeInTheDocument();
  });

  it('handles empty state when user has no transactions', async () => {
    vi.mocked(walletService.getTransactions).mockResolvedValue(mockEmptyTransactionPage);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No credit transactions yet')).toBeInTheDocument();
    });
  });
});
