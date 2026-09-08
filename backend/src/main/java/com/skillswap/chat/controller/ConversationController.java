package com.skillswap.chat.controller;

import com.skillswap.chat.dto.*;
import com.skillswap.chat.service.ChatService;
import com.skillswap.chat.websocket.ChatWebSocketHandler;
import com.skillswap.common.response.PageResponse;
import com.skillswap.common.security.AuthenticatedUserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/conversations")
@Tag(name = "Conversations & Chat", description = "Endpoints for real-time one-to-one messaging and conversation management")
@SecurityRequirement(name = "BearerAuth")
public class ConversationController {

    private final ChatService chatService;
    private final ChatWebSocketHandler webSocketHandler;

    public ConversationController(ChatService chatService, ChatWebSocketHandler webSocketHandler) {
        this.chatService = chatService;
        this.webSocketHandler = webSocketHandler;
    }

    @PostMapping
    @Operation(summary = "Create or get conversation", description = "Creates a new one-to-one conversation or retrieves existing conversation with a peer.")
    public ResponseEntity<ConversationResponse> getOrCreateConversation(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @Valid @RequestBody CreateConversationRequest request
    ) {
        ConversationResponse response = chatService.getOrCreateConversation(principal.getUserId(), request.userId());
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @GetMapping
    @Operation(summary = "Get my conversations", description = "Lists active conversations for the authenticated user, ordered by lastMessageAt DESC.")
    public ResponseEntity<PageResponse<ConversationResponse>> getMyConversations(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "lastMessageAt", "createdAt"));
        PageResponse<ConversationResponse> response = chatService.getMyConversations(principal.getUserId(), pageRequest);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get conversation by ID", description = "Retrieves conversation details if the user is a participant.")
    public ResponseEntity<ConversationResponse> getConversation(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID id
    ) {
        ConversationResponse response = chatService.getConversation(principal.getUserId(), id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/messages")
    @Operation(summary = "Get conversation messages", description = "Retrieves paginated messages for a conversation in descending/chronological order.")
    public ResponseEntity<PageResponse<MessageResponse>> getMessages(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "createdAt"));
        PageResponse<MessageResponse> response = chatService.getMessages(principal.getUserId(), id, pageRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/messages")
    @Operation(summary = "Send message (REST)", description = "Persists a message and broadcasts it in real-time to conversation participants.")
    public ResponseEntity<MessageResponse> sendMessage(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody SendMessageRequest request
    ) {
        MessageResponse response = chatService.saveMessage(
                principal.getUserId(),
                id,
                request.content(),
                request.clientMessageId()
        );

        // Broadcast real-time message to participants
        List<UUID> participantIds = chatService.getParticipantUserIds(id);
        ChatWebSocketMessage broadcastMsg = ChatWebSocketMessage.messageCreated(response);
        for (UUID participantId : participantIds) {
            webSocketHandler.broadcastToUser(participantId, broadcastMsg);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{id}/read")
    @Operation(summary = "Mark messages as read", description = "Marks all unread incoming messages in the conversation as read.")
    public ResponseEntity<MarkReadResponse> markMessagesRead(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID id
    ) {
        MarkReadResponse response = chatService.markMessagesAsRead(principal.getUserId(), id);

        if (response.markedCount() > 0) {
            List<UUID> participantIds = chatService.getParticipantUserIds(id);
            ChatWebSocketMessage readEvent = ChatWebSocketMessage.messageRead(id, List.of());
            for (UUID participantId : participantIds) {
                webSocketHandler.broadcastToUser(participantId, readEvent);
            }
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get total unread message count", description = "Returns total count of unread messages across all conversations for current user.")
    public ResponseEntity<UnreadCountResponse> getUnreadCount(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal
    ) {
        UnreadCountResponse response = chatService.getTotalUnreadCount(principal.getUserId());
        return ResponseEntity.ok(response);
    }
}
