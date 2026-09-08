import { apiClient } from './apiClient';
import type {
  ChatMessage,
  Conversation,
  MarkReadResponse,
  PageResponse,
  UnreadCountResponse,
} from '@/types/api';

export const chatService = {
  async getOrCreateConversation(userId: string): Promise<Conversation> {
    return apiClient.post<Conversation>('/conversations', { userId });
  },

  async getConversations(params: {
    page?: number;
    size?: number;
  } = {}): Promise<PageResponse<Conversation>> {
    const searchParams = new URLSearchParams();
    if (params.page !== undefined) searchParams.append('page', String(params.page));
    if (params.size !== undefined) searchParams.append('size', String(params.size));

    const queryString = searchParams.toString();
    const endpoint = `/conversations${queryString ? `?${queryString}` : ''}`;
    return apiClient.get<PageResponse<Conversation>>(endpoint);
  },

  async getConversation(id: string): Promise<Conversation> {
    return apiClient.get<Conversation>(`/conversations/${id}`);
  },

  async getMessages(
    conversationId: string,
    params: {
      page?: number;
      size?: number;
    } = {}
  ): Promise<PageResponse<ChatMessage>> {
    const searchParams = new URLSearchParams();
    if (params.page !== undefined) searchParams.append('page', String(params.page));
    if (params.size !== undefined) searchParams.append('size', String(params.size));

    const queryString = searchParams.toString();
    const endpoint = `/conversations/${conversationId}/messages${queryString ? `?${queryString}` : ''}`;
    return apiClient.get<PageResponse<ChatMessage>>(endpoint);
  },

  async sendMessage(
    conversationId: string,
    content: string,
    clientMessageId?: string
  ): Promise<ChatMessage> {
    return apiClient.post<ChatMessage>(`/conversations/${conversationId}/messages`, {
      content,
      clientMessageId,
    });
  },

  async markRead(conversationId: string): Promise<MarkReadResponse> {
    return apiClient.post<MarkReadResponse>(`/conversations/${conversationId}/read`);
  },

  async getUnreadCount(): Promise<UnreadCountResponse> {
    return apiClient.get<UnreadCountResponse>('/conversations/unread-count');
  },
};
