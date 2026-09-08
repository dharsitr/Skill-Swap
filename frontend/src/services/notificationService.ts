import { apiClient } from './apiClient';
import type {
  NotificationResponse,
  UnreadCountResponse,
  NotificationPreferenceResponse,
  UpdateNotificationPreferencesRequest,
  PageResponse,
} from '@/types/api';

export const notificationService = {
  async getNotifications(unreadOnly?: boolean, page = 0, size = 20): Promise<PageResponse<NotificationResponse>> {
    return apiClient.get<PageResponse<NotificationResponse>>('/notifications', {
      params: {
        unreadOnly: unreadOnly || undefined,
        page,
        size,
      },
    });
  },

  async getUnreadCount(): Promise<UnreadCountResponse> {
    return apiClient.get<UnreadCountResponse>('/notifications/unread-count');
  },

  async getNotification(id: string): Promise<NotificationResponse> {
    return apiClient.get<NotificationResponse>(`/notifications/${id}`);
  },

  async markAsRead(id: string): Promise<NotificationResponse> {
    return apiClient.post<NotificationResponse>(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<{ markedCount: number; message: string }> {
    return apiClient.post<{ markedCount: number; message: string }>('/notifications/read-all');
  },

  async deleteNotification(id: string): Promise<void> {
    return apiClient.delete<void>(`/notifications/${id}`);
  },

  async getPreferences(): Promise<NotificationPreferenceResponse> {
    return apiClient.get<NotificationPreferenceResponse>('/notification-preferences');
  },

  async updatePreferences(request: UpdateNotificationPreferencesRequest): Promise<NotificationPreferenceResponse> {
    return apiClient.patch<NotificationPreferenceResponse>('/notification-preferences', request);
  },
};
