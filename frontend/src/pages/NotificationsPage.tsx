import React, { useState } from 'react';
import { Bell, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from '@/hooks/useNotifications';
import { NotificationList } from '@/components/notifications/NotificationList';

export const NotificationsPage: React.FC = () => {
  const [filterUnread, setFilterUnread] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 15;

  const { data: unreadData } = useUnreadNotificationCount();
  const {
    data: notificationsData,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useNotifications(filterUnread, page, pageSize);

  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const deleteMutation = useDeleteNotification();

  const unreadCount = unreadData?.count || 0;
  const notifications = notificationsData?.items || [];
  const totalPages = notificationsData?.totalPages || 0;

  const handleMarkRead = (id: string) => {
    markReadMutation.mutate(id);
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8F5ED] font-display">
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400">
                Track your exchange requests, sessions, messages, and student activity.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-slate-400 hover:text-white"
            title="Refresh notifications"
            aria-label="Refresh notifications"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {isError ? (
        <div className="p-8 rounded-2xl bg-rose-950/20 border border-rose-900/40 text-center space-y-3">
          <AlertCircle className="w-8 h-8 mx-auto text-rose-400" />
          <p className="text-sm font-semibold text-rose-200">We couldn't load your notifications</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="border-rose-800 text-rose-300">
            Try Again
          </Button>
        </div>
      ) : (
        <NotificationList
          notifications={notifications}
          filterUnread={filterUnread}
          onFilterChange={(unread) => {
            setFilterUnread(unread);
            setPage(0);
          }}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
          onDelete={handleDelete}
          isLoading={isLoading}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          unreadCount={unreadCount}
        />
      )}
    </div>
  );
};
