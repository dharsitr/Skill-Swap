import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { NotificationList } from '@/components/notifications/NotificationList';
import type { NotificationResponse } from '@/types/api';

const mockNotifications: NotificationResponse[] = [
  {
    id: 'n-1',
    recipientId: 'u-1',
    type: 'SESSION_SCHEDULED',
    title: 'Session Scheduled',
    message: 'Your session with Bob is scheduled for tomorrow at 2:00 PM.',
    read: false,
    entityType: 'SESSION',
    entityId: 's-1',
    actionUrl: '/sessions/s-1',
    createdAt: '2026-09-02T10:00:00Z',
    readAt: null,
  },
  {
    id: 'n-2',
    recipientId: 'u-1',
    type: 'SESSION_RESCHEDULED',
    title: 'Session Rescheduled',
    message: 'Alice proposed a new time for your Python exchange.',
    read: true,
    entityType: 'SESSION',
    entityId: 's-2',
    actionUrl: '/sessions/s-2',
    createdAt: '2026-09-02T11:00:00Z',
    readAt: '2026-09-02T11:30:00Z',
  },
];

describe('NotificationList Component', () => {
  it('renders notifications with titles and messages', () => {
    render(
      <BrowserRouter>
        <NotificationList
          notifications={mockNotifications}
          filterUnread={false}
          onFilterChange={vi.fn()}
          onMarkRead={vi.fn()}
          unreadCount={1}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('Session Scheduled')).toBeInTheDocument();
    expect(screen.getByText('Your session with Bob is scheduled for tomorrow at 2:00 PM.')).toBeInTheDocument();
    expect(screen.getByText('Session Rescheduled')).toBeInTheDocument();
  });

  it('renders empty state when list is empty', () => {
    render(
      <BrowserRouter>
        <NotificationList
          notifications={[]}
          filterUnread={true}
          onFilterChange={vi.fn()}
          onMarkRead={vi.fn()}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('No notifications found')).toBeInTheDocument();
    expect(screen.getByText(/You are all caught up!/i)).toBeInTheDocument();
  });

  it('triggers onFilterChange when unread tab is clicked', () => {
    const onFilterChange = vi.fn();
    render(
      <BrowserRouter>
        <NotificationList
          notifications={mockNotifications}
          filterUnread={false}
          onFilterChange={onFilterChange}
          onMarkRead={vi.fn()}
          unreadCount={1}
        />
      </BrowserRouter>
    );

    const unreadBtn = screen.getByText('Unread');
    fireEvent.click(unreadBtn);

    expect(onFilterChange).toHaveBeenCalledWith(true);
  });

  it('triggers onMarkAllRead when button is clicked', () => {
    const onMarkAllRead = vi.fn();
    render(
      <BrowserRouter>
        <NotificationList
          notifications={mockNotifications}
          filterUnread={false}
          onFilterChange={vi.fn()}
          onMarkRead={vi.fn()}
          onMarkAllRead={onMarkAllRead}
          unreadCount={1}
        />
      </BrowserRouter>
    );

    const markAllBtn = screen.getByText('Mark all read');
    fireEvent.click(markAllBtn);

    expect(onMarkAllRead).toHaveBeenCalled();
  });

  it('handles pagination next and previous controls', () => {
    const onPageChange = vi.fn();
    render(
      <BrowserRouter>
        <NotificationList
          notifications={mockNotifications}
          filterUnread={false}
          onFilterChange={vi.fn()}
          onMarkRead={vi.fn()}
          page={0}
          totalPages={3}
          onPageChange={onPageChange}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();

    const nextBtn = screen.getByText('Next');
    fireEvent.click(nextBtn);

    expect(onPageChange).toHaveBeenCalledWith(1);
  });
});
