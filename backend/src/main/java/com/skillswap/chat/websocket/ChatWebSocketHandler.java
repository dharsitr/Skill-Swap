package com.skillswap.chat.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillswap.chat.dto.ChatWebSocketMessage;
import com.skillswap.chat.dto.MessageResponse;
import com.skillswap.chat.service.ChatService;
import com.skillswap.common.exception.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.AbstractWebSocketHandler;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

@Component
public class ChatWebSocketHandler extends AbstractWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(ChatWebSocketHandler.class);

    private final ChatService chatService;
    private final ObjectMapper objectMapper;

    // Mapping: userId -> active WebSocket sessions
    private final Map<UUID, Set<WebSocketSession>> userSessions = new ConcurrentHashMap<>();

    public ChatWebSocketHandler(ChatService chatService, ObjectMapper objectMapper) {
        this.chatService = chatService;
        this.objectMapper = objectMapper;
    }

    @Override
    public void afterConnectionEstablished(@NonNull WebSocketSession session) {
        UUID userId = getUserId(session);
        if (userId != null) {
            userSessions.computeIfAbsent(userId, k -> new CopyOnWriteArraySet<>()).add(session);
            log.info("WebSocket connected for user {} (session id: {})", userId, session.getId());
        }
    }

    @Override
    protected void handleTextMessage(@NonNull WebSocketSession session, @NonNull TextMessage message) {
        UUID currentUserId = getUserId(session);
        if (currentUserId == null) {
            sendError(session, "UNAUTHENTICATED", "Session is unauthenticated");
            return;
        }

        try {
            ChatWebSocketMessage wsMessage = objectMapper.readValue(message.getPayload(), ChatWebSocketMessage.class);
            if (wsMessage == null || wsMessage.type() == null) {
                sendError(session, "INVALID_PAYLOAD", "Missing message type");
                return;
            }

            switch (wsMessage.type().toUpperCase()) {
                case "SEND_MESSAGE" -> handleSendMessage(session, currentUserId, wsMessage);
                case "MARK_READ" -> handleMarkRead(session, currentUserId, wsMessage);
                case "TYPING_START", "TYPING_STOP" -> handleTyping(currentUserId, wsMessage);
                default -> sendError(session, "UNKNOWN_EVENT", "Unsupported event type: " + wsMessage.type());
            }
        } catch (ApiException e) {
            sendError(session, e.getStatus().name(), e.getMessage());
        } catch (Exception e) {
            log.error("Error processing WebSocket text message", e);
            sendError(session, "INTERNAL_ERROR", "An unexpected error occurred processing your message");
        }
    }

    @Override
    public void afterConnectionClosed(@NonNull WebSocketSession session, @NonNull CloseStatus status) {
        UUID userId = getUserId(session);
        if (userId != null) {
            Set<WebSocketSession> sessions = userSessions.get(userId);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    userSessions.remove(userId);
                }
            }
            log.info("WebSocket disconnected for user {} (session id: {})", userId, session.getId());
        }
    }

    private void handleSendMessage(WebSocketSession session, UUID currentUserId, ChatWebSocketMessage wsMessage) {
        if (wsMessage.conversationId() == null) {
            sendError(session, "MISSING_CONVERSATION_ID", "conversationId is required");
            return;
        }
        if (wsMessage.content() == null || wsMessage.content().isBlank()) {
            sendError(session, "MISSING_CONTENT", "content cannot be blank");
            return;
        }
        if (wsMessage.content().length() > 2000) {
            sendError(session, "MESSAGE_TOO_LONG", "Message content cannot exceed 2000 characters");
            return;
        }

        MessageResponse savedMessage = chatService.saveMessage(currentUserId, wsMessage.conversationId(), wsMessage.content(), wsMessage.clientMessageId());

        // Broadcast to all participants in the conversation
        ChatWebSocketMessage outgoing = ChatWebSocketMessage.messageCreated(savedMessage);

        broadcastToConversation(wsMessage.conversationId(), currentUserId, outgoing);
    }

    private void handleMarkRead(WebSocketSession session, UUID currentUserId, ChatWebSocketMessage wsMessage) {
        if (wsMessage.conversationId() == null) {
            sendError(session, "MISSING_CONVERSATION_ID", "conversationId is required");
            return;
        }

        chatService.markMessagesAsRead(currentUserId, wsMessage.conversationId());

        ChatWebSocketMessage readNotification = ChatWebSocketMessage.messageRead(wsMessage.conversationId(), List.of());

        broadcastToConversation(wsMessage.conversationId(), currentUserId, readNotification);
    }

    private void handleTyping(UUID currentUserId, ChatWebSocketMessage wsMessage) {
        if (wsMessage.conversationId() == null) return;

        ChatWebSocketMessage typingNotification = ChatWebSocketMessage.typing(
                wsMessage.type().toUpperCase(),
                wsMessage.conversationId(),
                currentUserId
        );

        try {
            var conversation = chatService.getConversation(currentUserId, wsMessage.conversationId());
            UUID otherUserId = conversation.otherParticipant().userId();
            if (chatService.isBlocked(currentUserId, otherUserId)) {
                return;
            }
            // Send typing notification ONLY to the other participant, NEVER back to the sender
            sendToUser(otherUserId, typingNotification);
        } catch (Exception e) {
            log.error("Failed to send typing notification for conversation {}", wsMessage.conversationId(), e);
        }
    }

    public void broadcastToConversation(UUID conversationId, UUID excludeUserId, ChatWebSocketMessage message) {
        try {
            // Get conversation to find participants
            var conversation = chatService.getConversation(excludeUserId, conversationId);
            UUID otherUserId = conversation.otherParticipant().userId();

            // Send to the other user
            sendToUser(otherUserId, message);

            // Also echo back to the current user's other sessions if multiple devices are connected
            sendToUser(excludeUserId, message);
        } catch (Exception e) {
            log.error("Failed to broadcast WebSocket message for conversation {}", conversationId, e);
        }
    }

    public void broadcastToUser(UUID userId, ChatWebSocketMessage message) {
        sendToUser(userId, message);
    }

    public void sendToUser(UUID userId, ChatWebSocketMessage message) {
        Set<WebSocketSession> sessions = userSessions.get(userId);
        if (sessions == null || sessions.isEmpty()) {
            return;
        }

        try {
            String json = objectMapper.writeValueAsString(message);
            TextMessage textMessage = new TextMessage(json);
            for (WebSocketSession session : sessions) {
                if (session.isOpen()) {
                    synchronized (session) {
                        session.sendMessage(textMessage);
                    }
                }
            }
        } catch (IOException e) {
            log.error("Error sending WebSocket message to user {}", userId, e);
        }
    }

    private void sendError(WebSocketSession session, String errorCode, String errorMessage) {
        try {
            if (session.isOpen()) {
                ChatWebSocketMessage errorMsg = ChatWebSocketMessage.error(errorCode, errorMessage);
                String json = objectMapper.writeValueAsString(errorMsg);
                synchronized (session) {
                    session.sendMessage(new TextMessage(json));
                }
            }
        } catch (IOException e) {
            log.error("Failed to send WebSocket error message", e);
        }
    }

    @Nullable
    private UUID getUserId(WebSocketSession session) {
        Object userIdObj = session.getAttributes().get("userId");
        if (userIdObj instanceof UUID uuid) {
            return uuid;
        }
        return null;
    }
}
