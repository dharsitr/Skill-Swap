import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { notificationService } from '@/services/notificationService';
import { AuthProvider } from '@/auth/AuthContext';
import type { NotificationResponse, NotificationPreferenceResponse, PageResponse } from '@/types/api';

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

vi.mock('@/services/notificationService', () => ({
  notificationService: {
    getNotifications: vi.fn(),
    getUnreadCount: vi.fn(),
    getNotification: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    deleteNotification: vi.fn(),
    getPreferences: vi.fn(),
    updatePreferences: vi.fn(),
  },
}));

const mockNotifications: NotificationResponse[] = [
  {
    id: 'notif-1',
    recipientId: 'usr-1',
    type: 'EXCHANGE_REQUEST_RECEIVED',
    title: 'New Exchange Request',
    message: 'Alice sent you an exchange request for Python.',
    read: false,
    entityType: 'EXCHANGE_REQUEST',
    entityId: 'req-1',
    actionUrl: '/requests',
    createdAt: '2026-08-30T09:00:00Z',
    readAt: null,
  },
  {
    id: 'notif-2',
    recipientId: 'usr-1',
    type: 'SESSION_COMPLETED',
    title: 'Session Completed',
    message: 'Your session for React has been completed.',
    read: true,
    entityType: 'SESSION',
    entityId: 'sess-1',
    actionUrl: '/sessions/sess-1',
    createdAt: '2026-08-30T08:00:00Z',
    readAt: '2026-08-30T08:30:00Z',
  },
];

const mockPageResponse: PageResponse<NotificationResponse> = {
  items: mockNotifications,
  page: 0,
  size: 20,
  totalElements: 2,
  totalPages: 1,
  first: true,
  last: true,
};

const mockPreferences: NotificationPreferenceResponse = {
  id: 'pref-1',
  userId: 'usr-1',
  exchangeRequests: true,
  sessions: true,
  messages: true,
  reviews: true,
  safety: true,
  updatedAt: '2026-08-30T09:00:00Z',
};

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>{ui}</BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('Phase 11: Notifications & Activity Center', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    vi.mocked(notificationService.getUnreadCount).mockResolvedValue({ count: 1 });
    vi.mocked(notificationService.getNotifications).mockResolvedValue(mockPageResponse);
    vi.mocked(notificationService.getPreferences).mockResolvedValue(mockPreferences);
  });

  describe('NotificationItem Component', () => {
    it('renders notification title, message, and unread dot', () => {
      render(
        <BrowserRouter>
          <NotificationItem notification={mockNotifications[0]!} />
        </BrowserRouter>
      );

      expect(screen.getByText('New Exchange Request')).toBeInTheDocument();
      expect(screen.getByText('Alice sent you an exchange request for Python.')).toBeInTheDocument();
      expect(screen.getByTitle('Unread')).toBeInTheDocument();
    });

    it('triggers onMarkRead and onDelete callbacks', () => {
      const onMarkRead = vi.fn();
      const onDelete = vi.fn();

      render(
        <BrowserRouter>
          <NotificationItem
            notification={mockNotifications[0]!}
            onMarkRead={onMarkRead}
            onDelete={onDelete}
          />
        </BrowserRouter>
      );

      const markReadBtn = screen.getByTitle('Mark as read');
      fireEvent.click(markReadBtn);
      expect(onMarkRead).toHaveBeenCalledWith('notif-1');

      const deleteBtn = screen.getByTitle('Delete notification');
      fireEvent.click(deleteBtn);
      expect(onDelete).toHaveBeenCalledWith('notif-1');
    });
  });

  describe('NotificationBell Component', () => {
    it('renders unread badge and opens preview popover on click', async () => {
      renderWithProviders(<NotificationBell />);

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
      });

      const bellBtn = screen.getByLabelText(/Notifications \(1 unread\)/i);
      fireEvent.click(bellBtn);

      await waitFor(() => {
        expect(screen.getByText('New Exchange Request')).toBeInTheDocument();
        expect(screen.getByText('Mark all read')).toBeInTheDocument();
        expect(screen.getByText('View all notifications')).toBeInTheDocument();
      });
    });

    it('triggers mark all read from preview popover', async () => {
      vi.mocked(notificationService.markAllAsRead).mockResolvedValueOnce({
        markedCount: 1,
        message: 'All notifications marked as read',
      });

      renderWithProviders(<NotificationBell />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Notifications \(1 unread\)/i)).toBeInTheDocument();
      });

      const bellBtn = screen.getByLabelText(/Notifications \(1 unread\)/i);
      fireEvent.click(bellBtn);

      await waitFor(() => {
        expect(screen.getByText('Mark all read')).toBeInTheDocument();
      });

      const markAllBtn = screen.getByText('Mark all read');
      fireEvent.click(markAllBtn);

      await waitFor(() => {
        expect(notificationService.markAllAsRead).toHaveBeenCalled();
      });
    });
  });

  describe('NotificationsPage Component', () => {
    it('renders notification list and unread badge in header', async () => {
      renderWithProviders(<NotificationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
        expect(screen.getByText('1 unread')).toBeInTheDocument();
        expect(screen.getByText('New Exchange Request')).toBeInTheDocument();
        expect(screen.getByText('Session Completed')).toBeInTheDocument();
      });
    });

    it('switches between All Activity and Unread tabs', async () => {
      renderWithProviders(<NotificationsPage />);

      await waitFor(() => {
        expect(screen.getByText('All Activity')).toBeInTheDocument();
        expect(screen.getByText('Unread')).toBeInTheDocument();
      });

      const unreadTab = screen.getByText('Unread');
      fireEvent.click(unreadTab);

      await waitFor(() => {
        expect(notificationService.getNotifications).toHaveBeenCalledWith(true, 0, 15);
      });
    });
  });

  describe('SettingsPage Notification Preferences', () => {
    it('renders preferences toggles and updates category settings', async () => {
      vi.mocked(notificationService.updatePreferences).mockResolvedValueOnce({
        ...mockPreferences,
        exchangeRequests: false,
      });

      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
        expect(screen.getByText('Exchange Requests')).toBeInTheDocument();
        expect(screen.getByText('Direct Messages')).toBeInTheDocument();
        expect(screen.getByText('Safety & Security (Always Active)')).toBeInTheDocument();
      });

      const enabledButtons = screen.getAllByRole('button', { name: /Enabled/i });
      expect(enabledButtons.length).toBeGreaterThan(0);

      fireEvent.click(enabledButtons[0]!); // Click Exchange Requests toggle

      await waitFor(() => {
        expect(notificationService.updatePreferences).toHaveBeenCalledWith({
          exchangeRequests: false,
        });
      });
    });
  });
});
