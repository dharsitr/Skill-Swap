import React from 'react';
import { Inbox, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationItem } from './NotificationItem';
import type { NotificationResponse } from '@/types/api';

interface NotificationListProps {
  notifications: NotificationResponse[];
  filterUnread: boolean;
  onFilterChange: (unreadOnly: boolean) => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead?: () => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  unreadCount?: number;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  filterUnread,
  onFilterChange,
  onMarkRead,
  onMarkAllRead,
  onDelete,
  isLoading = false,
  page = 0,
  totalPages = 1,
  onPageChange,
  unreadCount = 0,
}) => {
  return (
    <div className="space-y-4" data-testid="notification-list">
      {/* Filter and Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Button
            variant={filterUnread ? 'outline' : 'default'}
            size="sm"
            onClick={() => onFilterChange(false)}
            className="text-xs h-8"
          >
            All Activity
          </Button>
          <Button
            variant={filterUnread ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange(true)}
            className="text-xs h-8 gap-1.5"
          >
            Unread
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                {unreadCount}
              </span>
            )}
          </Button>
        </div>

        {onMarkAllRead && unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarkAllRead}
            className="text-xs h-8 text-slate-400 hover:text-emerald-400 gap-1.5"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Notifications Items */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-[#111827]/40 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#111827]/60 border border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Inbox className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-sm text-[#F8F5ED]">No notifications found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {filterUnread
                ? 'You are all caught up! No unread notifications.'
                : 'Activity related to skill exchange requests, scheduled sessions, and messages will appear here.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkRead={onMarkRead}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
          <span>Page {page + 1} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(0, page - 1))}
              disabled={page === 0}
              className="text-xs h-8"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="text-xs h-8"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
