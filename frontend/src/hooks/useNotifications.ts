import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/notificationService';
import type { UpdateNotificationPreferencesRequest } from '@/types/api';

export const NOTIFICATION_KEYS = {
  all: ['notifications'] as const,
  list: (unreadOnly?: boolean, page = 0, size = 20) => ['notifications', 'list', { unreadOnly, page, size }] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
  preferences: ['notification-preferences'] as const,
};

export const useNotifications = (unreadOnly?: boolean, page = 0, size = 20) => {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.list(unreadOnly, page, size),
    queryFn: () => notificationService.getNotifications(unreadOnly, page, size),
    staleTime: 1000 * 15, // 15 seconds
  });
};

export const useUnreadNotificationCount = () => {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.unreadCount,
    queryFn: () => notificationService.getUnreadCount(),
    refetchInterval: 1000 * 30, // Poll every 30s as fallback to realtime
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => notificationService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => notificationService.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
};

export const useNotificationPreferences = () => {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.preferences,
    queryFn: () => notificationService.getPreferences(),
  });
};

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpdateNotificationPreferencesRequest) =>
      notificationService.updatePreferences(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.preferences });
    },
  });
};
