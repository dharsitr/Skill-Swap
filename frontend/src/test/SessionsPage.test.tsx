import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SessionsPage } from '@/pages/SessionsPage';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/auth/AuthContext';
import { authService } from '@/auth/authService';
import { sessionService } from '@/services/sessionService';
import type { Session, PageResponse } from '@/types/api';

vi.mock('@/auth/authService', () => ({
  authService: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock('@/services/sessionService', () => ({
  sessionService: {
    getSessions: vi.fn(),
    getSession: vi.fn(),
    startSession: vi.fn(),
    completeSession: vi.fn(),
    cancelSession: vi.fn(),
  },
}));

describe('SessionsPage Component', () => {
  const mockSession: Session = {
    id: 'sess-1',
    exchangeRequestId: 'req-1',
    teacher: {
      id: 'usr-bob',
      displayName: 'Bob Tutor',
      avatarUrl: null,
      collegeName: 'Stanford',
      department: 'EE',
      yearOfStudy: 'THIRD_YEAR',
    },
    learner: {
      id: 'usr-alice',
      displayName: 'Alice Student',
      avatarUrl: null,
      collegeName: 'MIT',
      department: 'CS',
      yearOfStudy: 'SECOND_YEAR',
    },
    skill: {
      id: 'skill-python',
      name: 'Python',
      categoryName: 'Programming',
    },
    status: 'SCHEDULED',
    createdAt: '2026-08-29T10:00:00Z',
    updatedAt: '2026-08-29T10:00:00Z',
  };

  const mockSessionPage: PageResponse<Session> = {
    items: [mockSession],
    page: 0,
    size: 10,
    totalElements: 1,
    totalPages: 1,
    first: true,
    last: true,
  };

  const mockEmptyPage: PageResponse<Session> = {
    items: [],
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
  };

  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();

    vi.mocked(authService.getSession).mockResolvedValue({
      user: { id: 'usr-alice', email: 'alice@mit.edu' } as any,
      access_token: 'valid-token',
    } as any);

    vi.mocked(sessionService.getSessions).mockResolvedValue(mockSessionPage);
    vi.mocked(sessionService.startSession).mockResolvedValue({
      ...mockSession,
      status: 'IN_PROGRESS',
    });
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <SessionsPage />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    );

  it('renders sessions list with teacher/learner indicators and start session button', async () => {
    renderComponent();

    expect(screen.getByText('My Sessions')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Python')).toBeInTheDocument();
      expect(screen.getByText('Bob Tutor')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start session/i })).toBeInTheDocument();
    });
  });

  it('handles start session action', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /start session/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /start session/i }));

    await waitFor(() => {
      expect(sessionService.startSession).toHaveBeenCalledWith('sess-1');
    });
  });

  it('handles empty state when no sessions exist', async () => {
    vi.mocked(sessionService.getSessions).mockResolvedValue(mockEmptyPage);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/No sessions found/i)).toBeInTheDocument();
    });
  });
});
