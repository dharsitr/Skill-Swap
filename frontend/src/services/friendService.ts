import { apiClient } from './apiClient';
import type {
  FriendshipStatusResponse,
  FriendRequestDto,
  FriendSummaryDto,
} from '@/types/api';

export const friendService = {
  async getFriendshipStatus(targetUserId: string): Promise<FriendshipStatusResponse> {
    return apiClient.get<FriendshipStatusResponse>(`/friends/status/${targetUserId}`);
  },

  async sendFriendRequest(receiverId: string): Promise<FriendRequestDto> {
    return apiClient.post<FriendRequestDto>('/friends/request', { receiverId });
  },

  async acceptFriendRequest(requestId: string): Promise<FriendRequestDto> {
    return apiClient.post<FriendRequestDto>(`/friends/requests/${requestId}/accept`);
  },

  async declineFriendRequest(requestId: string): Promise<FriendRequestDto> {
    return apiClient.post<FriendRequestDto>(`/friends/requests/${requestId}/decline`);
  },

  async cancelFriendRequest(requestId: string): Promise<void> {
    return apiClient.delete<void>(`/friends/requests/${requestId}/cancel`);
  },

  async removeFriend(friendUserId: string): Promise<void> {
    return apiClient.delete<void>(`/friends/${friendUserId}`);
  },

  async getIncomingRequests(): Promise<FriendRequestDto[]> {
    return apiClient.get<FriendRequestDto[]>('/friends/requests/incoming');
  },

  async getOutgoingRequests(): Promise<FriendRequestDto[]> {
    return apiClient.get<FriendRequestDto[]>('/friends/requests/outgoing');
  },

  async getFriends(): Promise<FriendSummaryDto[]> {
    return apiClient.get<FriendSummaryDto[]>('/friends');
  },
};
