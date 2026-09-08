import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/auth/AuthContext';
import { AvailabilityPage } from '@/pages/AvailabilityPage';
import { ScheduleSessionPage } from '@/pages/ScheduleSessionPage';
import { SessionCalendar } from '@/components/scheduling/SessionCalendar';
import { availabilityService } from '@/services/availabilityService';
import { schedulingService } from '@/services/schedulingService';
import { sessionService } from '@/services/sessionService';
import type {
  UserAvailabilityResponse,
  Session,
  SessionResponse,
  SessionScheduleResponse,
} from '@/types/api';

vi.mock('@/auth/authService', () => ({
  authService: {
    getSession: vi.fn().mockResolvedValue({
      user: { id: 'usr-1', email: 'test@college.edu' },
      access_token: 'fake-token',
    }),
    onAuthStateChange: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock('@/services/availabilityService', () => ({
  availabilityService: {
    getMyAvailability: vi.fn(),
    getUserAvailability: vi.fn(),
    createAvailability: vi.fn(),
    updateAvailability: vi.fn(),
    deleteAvailability: vi.fn(),
  },
}));

vi.mock('@/services/schedulingService', () => ({
  schedulingService: {
    scheduleSession: vi.fn(),
    rescheduleSession: vi.fn(),
    getSchedule: vi.fn(),
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

const mockAvailability: UserAvailabilityResponse[] = [
  {
    id: 'avail-1',
    userId: 'usr-1',
    dayOfWeek: 'TUESDAY',
    startTime: '10:00',
    endTime: '13:00',
    timezone: 'UTC',
    active: true,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  },
];

const mockSession: Session = {
  id: 'sess-101',
  exchangeRequestId: 'req-1',
  skill: {
    id: 'sk-1',
    name: 'Advanced React Architecture',
    categoryName: 'Web Development',
  },
  teacher: {
    id: 'usr-1',
    displayName: 'Professor Code',
    avatarUrl: null,
    collegeName: 'Tech University',
  },
  learner: {
    id: 'usr-2',
    displayName: 'Student Learner',
    avatarUrl: null,
    collegeName: 'State College',
  },
  status: 'SCHEDULED',
  scheduledAt: '2026-09-10T14:00:00Z',
  createdAt: '2026-09-01T10:00:00Z',
  updatedAt: '2026-09-01T10:00:00Z',
};

const mockSchedule: SessionScheduleResponse = {
  id: 'sch-1',
  sessionId: 'sess-101',
  scheduledBy: 'usr-1',
  startAt: '2026-09-10T14:00:00Z',
  endAt: '2026-09-10T15:00:00Z',
  timezone: 'UTC',
  rescheduledCount: 0,
  cancellationReason: null,
  createdAt: '2026-09-01T10:00:00Z',
  updatedAt: '2026-09-01T10:00:00Z',
};

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{ui}</AuthProvider>
    </QueryClientProvider>
  );
};

describe('Phase 8: Smart Scheduling & Notifications E2E Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    vi.mocked(availabilityService.getMyAvailability).mockResolvedValue(mockAvailability);
    vi.mocked(sessionService.getSession).mockResolvedValue(mockSession);
    vi.mocked(schedulingService.getSchedule).mockResolvedValue(mockSchedule);
  });

  describe('AvailabilityPage Flow', () => {
    it('renders availability schedule and adds new slot', async () => {
      vi.mocked(availabilityService.createAvailability).mockResolvedValue({
        id: 'avail-2',
        userId: 'usr-1',
        dayOfWeek: 'FRIDAY',
        startTime: '14:00',
        endTime: '16:00',
        timezone: 'UTC',
        active: true,
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-09-01T00:00:00Z',
      });

      renderWithProviders(
        <BrowserRouter>
          <AvailabilityPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Weekly Availability')).toBeInTheDocument();
        expect(screen.getByText(/10:00 AM/i)).toBeInTheDocument();
      });

      const startInput = screen.getByText('Start Time').parentElement?.querySelector('input')!;
      const endInput = screen.getByText('End Time').parentElement?.querySelector('input')!;

      fireEvent.change(startInput, { target: { value: '14:00' } });
      fireEvent.change(endInput, { target: { value: '16:00' } });

      const submitBtn = screen.getByText('Add Availability Slot');
      const form = submitBtn.closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(availabilityService.createAvailability).toHaveBeenCalledWith(
          expect.objectContaining({
            startTime: '14:00',
            endTime: '16:00',
          })
        );
      });
    });
  });

  describe('ScheduleSessionPage Flow', () => {
    it('renders session details and schedules a proposed window', async () => {
      vi.mocked(schedulingService.rescheduleSession).mockResolvedValue(mockSchedule);
      vi.mocked(schedulingService.scheduleSession).mockResolvedValue(mockSchedule);

      renderWithProviders(
        <MemoryRouter initialEntries={['/sessions/sess-101/schedule']}>
          <Routes>
            <Route path="/sessions/:id/schedule" element={<ScheduleSessionPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Advanced React Architecture')).toBeInTheDocument();
        expect(screen.getByText('Current Confirmed Schedule')).toBeInTheDocument();
      });

      const submitBtn = screen.getByText(/Confirm Reschedule|Confirm Schedule/i);
      const form = submitBtn.closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(/Session successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('SessionCalendar Component', () => {
    it('renders upcoming session list with partner and reschedule action', () => {
      const onReschedule = vi.fn();
      const mockCalendarSessions: SessionResponse[] = [
        {
          id: 'sess-101',
          exchangeRequestId: 'req-1',
          skill: { id: 'sk-1', name: 'Advanced React Architecture' },
          teacher: {
            id: 'usr-1',
            displayName: 'Professor Code',
            collegeName: 'Tech University',
          },
          learner: {
            id: 'usr-2',
            displayName: 'Student Learner',
            collegeName: 'State College',
          },
          status: 'SCHEDULED',
          scheduledAt: '2026-09-10T14:00:00Z',
          createdAt: '2026-09-01T00:00:00Z',
          updatedAt: '2026-09-01T00:00:00Z',
        },
      ];

      render(
        <BrowserRouter>
          <SessionCalendar
            sessions={mockCalendarSessions}
            currentUserId="usr-1"
            onRescheduleClick={onReschedule}
          />
        </BrowserRouter>
      );

      expect(screen.getByText('Advanced React Architecture')).toBeInTheDocument();
      expect(screen.getByText('Student Learner')).toBeInTheDocument();

      const rescheduleBtn = screen.getByText('Reschedule');
      fireEvent.click(rescheduleBtn);
      expect(onReschedule).toHaveBeenCalledWith('sess-101');

      expect(screen.getByText('Join Room')).toBeInTheDocument();
    });
  });
});
