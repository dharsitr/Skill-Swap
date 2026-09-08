import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RequestsPage } from '@/pages/RequestsPage';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/auth/AuthContext';
import { authService } from '@/auth/authService';
import { exchangeService } from '@/services/exchangeService';
import type { ExchangeRequest, PageResponse } from '@/types/api';

vi.mock('@/auth/authService', () => ({
  authService: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock('@/services/exchangeService', () => ({
  exchangeService: {
    createExchangeRequest: vi.fn(),
    getExchangeRequest: vi.fn(),
    getIncomingRequests: vi.fn(),
    getOutgoingRequests: vi.fn(),
    acceptExchangeRequest: vi.fn(),
    rejectExchangeRequest: vi.fn(),
    cancelExchangeRequest: vi.fn(),
  },
}));

describe('RequestsPage Component', () => {
  const mockIncomingRequest: ExchangeRequest = {
    id: 'req-1',
    requester: {
      id: 'usr-alice',
      displayName: 'Alice Student',
      avatarUrl: null,
      collegeName: 'MIT',
      department: 'CS',
      yearOfStudy: 'SECOND_YEAR',
    },
    recipient: {
      id: 'usr-bob',
      displayName: 'Bob Tutor',
      avatarUrl: null,
      collegeName: 'Stanford',
      department: 'EE',
      yearOfStudy: 'THIRD_YEAR',
    },
    skill: {
      id: 'skill-python',
      name: 'Python',
      categoryName: 'Programming',
    },
    message: "Hi Bob, I'd love to learn Python from you!",
    status: 'PENDING',
    createdAt: '2026-08-29T10:00:00Z',
    updatedAt: '2026-08-29T10:00:00Z',
  };

  const mockIncomingPage: PageResponse<ExchangeRequest> = {
    items: [mockIncomingRequest],
    page: 0,
    size: 10,
    totalElements: 1,
    totalPages: 1,
    first: true,
    last: true,
  };

  const mockEmptyPage: PageResponse<ExchangeRequest> = {
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
      user: { id: 'usr-bob', email: 'bob@stanford.edu' } as any,
      access_token: 'valid-token',
    } as any);

    vi.mocked(exchangeService.getIncomingRequests).mockResolvedValue(mockIncomingPage);
    vi.mocked(exchangeService.getOutgoingRequests).mockResolvedValue(mockEmptyPage);
    vi.mocked(exchangeService.acceptExchangeRequest).mockResolvedValue({
      ...mockIncomingRequest,
      status: 'ACCEPTED',
    });
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={testQueryClient}>
        <AuthProvider>
          <BrowserRouter>
            <RequestsPage />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    );

  it('renders incoming requests with requester info, skill and action buttons', async () => {
    renderComponent();

    expect(screen.getByText('Exchange Requests')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Alice Student')).toBeInTheDocument();
      expect(screen.getByText('Python')).toBeInTheDocument();
      expect(screen.getByText(/Hi Bob, I'd love to learn Python from you!/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^accept$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /decline/i })).toBeInTheDocument();
    });
  });

  it('handles accept exchange request action', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^accept$/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^accept$/i }));

    await waitFor(() => {
      expect(exchangeService.acceptExchangeRequest).toHaveBeenCalledWith('req-1');
    });
  });


  it('handles empty state when no incoming requests exist', async () => {
    vi.mocked(exchangeService.getIncomingRequests).mockResolvedValue(mockEmptyPage);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/No incoming requests found/i)).toBeInTheDocument();
    });
  });
});
