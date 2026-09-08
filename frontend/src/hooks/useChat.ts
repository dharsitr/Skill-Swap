import { useEffect, useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/useAuth';
import { chatService } from '@/services/chatService';
import { chatSocket } from '@/services/chatSocket';
import { authService } from '@/auth/authService';
import type {
  ChatMessage,
  Conversation,
  MarkReadResponse,
  PageResponse,
  UnreadCountResponse,
  ChatConnectionState,
} from '@/types/api';

export const CONVERSATIONS_QUERY_KEY = ['conversations'];
export const CONVERSATION_LIST_QUERY_KEY = ['conversations', 'list'];
export const CONVERSATION_DETAIL_QUERY_KEY = ['conversations', 'detail'];
export const MESSAGES_QUERY_KEY = ['chat', 'messages'];
export const UNREAD_COUNT_QUERY_KEY = ['conversations', 'unread-count'];

export function useConversations(params: { page?: number; size?: number } = {}) {
  const { isAuthenticated } = useAuth();

  return useQuery<PageResponse<Conversation>, Error>({
    queryKey: [...CONVERSATION_LIST_QUERY_KEY, params],
    queryFn: () => chatService.getConversations(params),
    enabled: isAuthenticated,
    staleTime: 1000 * 15,
  });
}

export function useConversation(id: string) {
  const { isAuthenticated } = useAuth();

  return useQuery<Conversation, Error>({
    queryKey: [...CONVERSATION_DETAIL_QUERY_KEY, id],
    queryFn: () => chatService.getConversation(id),
    enabled: isAuthenticated && Boolean(id),
  });
}


export function useMessages(
  conversationId: string,
  params: { page?: number; size?: number } = {}
) {
  const { isAuthenticated } = useAuth();

  return useQuery<PageResponse<ChatMessage>, Error>({
    queryKey: [...MESSAGES_QUERY_KEY, conversationId, params],
    queryFn: () => chatService.getMessages(conversationId, params),
    enabled: isAuthenticated && Boolean(conversationId),
    staleTime: 1000 * 10,
  });
}

export function useUnreadChatCount() {
  const { isAuthenticated } = useAuth();

  return useQuery<UnreadCountResponse, Error>({
    queryKey: UNREAD_COUNT_QUERY_KEY,
    queryFn: () => chatService.getUnreadCount(),
    enabled: isAuthenticated,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation<Conversation, Error, string>({
    mutationFn: (targetUserId) => chatService.getOrCreateConversation(targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
    },
  });
}

export function useSendChatMessage() {
  const queryClient = useQueryClient();

  return useMutation<
    ChatMessage,
    Error,
    { conversationId: string; content: string; clientMessageId?: string }
  >({
    mutationFn: ({ conversationId, content, clientMessageId }) =>
      chatService.sendMessage(conversationId, content, clientMessageId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [...MESSAGES_QUERY_KEY, variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
    },
  });

}

export function useMarkChatRead() {
  const queryClient = useQueryClient();

  return useMutation<MarkReadResponse, Error, string>({
    mutationFn: (conversationId) => chatService.markRead(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
    },
  });
}

export function useChatSocket(activeConversationId?: string, otherParticipantUserId?: string) {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const [connectionStatus, setConnectionStatus] = useState<ChatConnectionState>('DISCONNECTED');
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const typingTimerRef = useRef<any>(null);
  const selfTypingUntilRef = useRef<number>(0);

  useEffect(() => {
    if (!isAuthenticated) {
      chatSocket.disconnect();
      return;
    }

    let isMounted = true;

    authService.getSession().then((session) => {
      if (session?.access_token && isMounted) {
        chatSocket.connect(session.access_token);
      }
    });

    const unsubscribeStatus = chatSocket.onStatusChange((status) => {
      if (isMounted) setConnectionStatus(status);
    });

    const unsubscribeMessage = chatSocket.onMessage((event) => {
      if (!isMounted) return;

      if (event.type === 'MESSAGE_CREATED' && event.message) {
        const convId = event.message.conversationId;
        queryClient.invalidateQueries({ queryKey: [...MESSAGES_QUERY_KEY, convId] });
        queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY });

        // If currently viewing this conversation, immediately mark it read
        if (activeConversationId === convId) {
          chatSocket.markRead(convId);
        }
      }

      if (event.type === 'MESSAGE_READ' && event.conversationId) {
        queryClient.invalidateQueries({ queryKey: [...MESSAGES_QUERY_KEY, event.conversationId] });
        queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
      }

      if (event.type === 'TYPING_START' && event.conversationId === activeConversationId) {
        // If the current user is typing (or within active self typing burst), ignore echo
        if (Date.now() < selfTypingUntilRef.current) {
          return;
        }
        if (event.userId && event.userId === user?.id) {
          return;
        }
        if (otherParticipantUserId && event.userId && event.userId !== otherParticipantUserId) {
          return;
        }
        setIsOtherUserTyping(true);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
          if (isMounted) setIsOtherUserTyping(false);
        }, 3500);
      }

      if (event.type === 'TYPING_STOP' && event.conversationId === activeConversationId) {
        if (Date.now() < selfTypingUntilRef.current) {
          return;
        }
        if (event.userId && event.userId === user?.id) {
          return;
        }
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        setIsOtherUserTyping(false);
      }
    });

    return () => {
      isMounted = false;
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      unsubscribeStatus();
      unsubscribeMessage();
    };
  }, [isAuthenticated, activeConversationId, otherParticipantUserId, user?.id, queryClient]);

  // When active conversation changes, mark as read
  useEffect(() => {
    if (activeConversationId && connectionStatus === 'CONNECTED') {
      chatSocket.markRead(activeConversationId);
    }
  }, [activeConversationId, connectionStatus]);

  const sendTyping = (isTyping: boolean) => {
    if (activeConversationId) {
      if (isTyping) {
        selfTypingUntilRef.current = Date.now() + 2500;
        setIsOtherUserTyping(false);
      } else {
        selfTypingUntilRef.current = 0;
      }
      chatSocket.sendTyping(activeConversationId, isTyping);
    }
  };

  return {
    connectionStatus,
    isOtherUserTyping,
    sendTyping,
  };
}
