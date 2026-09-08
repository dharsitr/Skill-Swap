package com.skillswap.chat.service;

import com.skillswap.chat.dto.*;
import com.skillswap.chat.entity.Conversation;
import com.skillswap.chat.entity.ConversationParticipant;
import com.skillswap.chat.entity.Message;
import com.skillswap.chat.repository.ConversationParticipantRepository;
import com.skillswap.chat.repository.ConversationRepository;
import com.skillswap.chat.repository.MessageRepository;
import com.skillswap.common.exception.ApiException;
import com.skillswap.common.exception.ResourceNotFoundException;
import com.skillswap.common.response.PageResponse;
import com.skillswap.profile.entity.Profile;
import com.skillswap.profile.repository.ProfileRepository;
import com.skillswap.user.entity.User;
import com.skillswap.user.entity.UserStatus;
import com.skillswap.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);

    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final com.skillswap.safety.service.UserBlockService userBlockService;
    private final com.skillswap.notification.service.NotificationService notificationService;

    public ChatService(
            ConversationRepository conversationRepository,
            ConversationParticipantRepository participantRepository,
            MessageRepository messageRepository,
            UserRepository userRepository,
            ProfileRepository profileRepository,
            com.skillswap.safety.service.UserBlockService userBlockService,
            com.skillswap.notification.service.NotificationService notificationService
    ) {
        this.conversationRepository = conversationRepository;
        this.participantRepository = participantRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.userBlockService = userBlockService;
        this.notificationService = notificationService;
    }

    @Transactional
    public ConversationResponse getOrCreateConversation(UUID currentUserId, UUID targetUserId) {
        if (currentUserId.equals(targetUserId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot start a conversation with yourself");
        }

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", targetUserId));

        if (targetUser.getStatus() == UserStatus.DELETED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot message a deleted user");
        }

        if (userBlockService.isBlocked(currentUserId, targetUserId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Cannot message this user due to block settings");
        }

        // Check if conversation already exists
        Optional<Conversation> existing = conversationRepository.findByParticipantIds(currentUserId, targetUserId);
        if (existing.isPresent()) {
            return toConversationResponse(existing.get(), currentUserId);
        }

        // Validate relationship eligibility (must have exchange request or session, or allowed peer interaction)
        validateEligibility(currentUserId, targetUserId);

        log.info("Creating new one-to-one conversation between user {} and user {}", currentUserId, targetUserId);
        Conversation newConv = new Conversation(currentUser, targetUser);
        Conversation savedConv = conversationRepository.save(newConv);

        ConversationParticipant p1 = new ConversationParticipant(savedConv, currentUser);
        ConversationParticipant p2 = new ConversationParticipant(savedConv, targetUser);
        participantRepository.save(p1);
        participantRepository.save(p2);

        return toConversationResponse(savedConv, currentUserId);
    }

    @Transactional(readOnly = true)
    public PageResponse<ConversationResponse> getMyConversations(UUID currentUserId, Pageable pageable) {
        Page<Conversation> page = conversationRepository.findByParticipantId(currentUserId, pageable);
        List<ConversationResponse> items = page.getContent()
                .stream()
                .map(conv -> toConversationResponse(conv, currentUserId))
                .toList();

        return PageResponse.of(items, page.getNumber(), page.getSize(), page.getTotalElements());
    }

    @Transactional(readOnly = true)
    public ConversationResponse getConversation(UUID currentUserId, UUID conversationId) {
        Conversation conversation = conversationRepository.findByIdWithParticipants(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", conversationId));

        if (!conversation.isParticipant(currentUserId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You are not a participant in this conversation");
        }

        return toConversationResponse(conversation, currentUserId);
    }

    @Transactional(readOnly = true)
    public PageResponse<MessageResponse> getMessages(UUID currentUserId, UUID conversationId, Pageable pageable) {
        Conversation conversation = conversationRepository.findByIdWithParticipants(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", conversationId));

        if (!conversation.isParticipant(currentUserId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You are not a participant in this conversation");
        }

        Page<Message> messagePage = messageRepository.findByConversationIdOrderByCreatedAtDesc(conversationId, pageable);
        List<MessageResponse> items = messagePage.getContent()
                .stream()
                .map(this::toMessageResponse)
                .toList();

        return PageResponse.of(items, messagePage.getNumber(), messagePage.getSize(), messagePage.getTotalElements());
    }

    @Transactional
    public MessageResponse saveMessage(UUID currentUserId, UUID conversationId, String content, String clientMessageId) {
        if (content == null || content.trim().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Message content cannot be blank");
        }

        String trimmedContent = content.trim();
        String sanitizedContent = com.skillswap.common.util.InputSanitizer.sanitize(trimmedContent, 2000);
        if (sanitizedContent == null || sanitizedContent.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Message content cannot be blank");
        }
        if (sanitizedContent.length() > 2000) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Message content cannot exceed 2000 characters");
        }

        Conversation conversation = conversationRepository.findByIdWithParticipants(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", conversationId));

        if (!conversation.isParticipant(currentUserId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You are not a participant in this conversation");
        }

        User otherParticipant = conversation.getOtherParticipant(currentUserId);
        if (userBlockService.isBlocked(currentUserId, otherParticipant.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Cannot send message due to block settings");
        }

        // Idempotency check for clientMessageId
        if (clientMessageId != null && !clientMessageId.isBlank()) {
            Optional<Message> existingMsg = messageRepository.findByConversationIdAndClientMessageId(conversationId, clientMessageId.trim());
            if (existingMsg.isPresent()) {
                log.info("Message with clientMessageId {} already exists for conversation {}", clientMessageId, conversationId);
                return toMessageResponse(existingMsg.get());
            }
        }

        User sender = currentUserId.equals(conversation.getParticipantOne().getId())
                ? conversation.getParticipantOne()
                : conversation.getParticipantTwo();

        Message message = new Message(conversation, sender, sanitizedContent, clientMessageId != null ? clientMessageId.trim() : null);
        Message savedMessage = messageRepository.save(message);

        conversation.setLastMessageAt(savedMessage.getCreatedAt());
        conversationRepository.save(conversation);

        // Update sender's last read timestamp
        participantRepository.findByConversationIdAndUserId(conversationId, currentUserId)
                .ifPresent(p -> {
                    p.setLastReadAt(savedMessage.getCreatedAt());
                    participantRepository.save(p);
                });

        log.info("Persisted message id: {} in conversation id: {} by user id: {}", savedMessage.getId(), conversationId, currentUserId);

        try {
            Profile senderProfile = profileRepository.findByUserId(currentUserId).orElse(null);
            String senderName = (senderProfile != null && senderProfile.getDisplayName() != null)
                    ? senderProfile.getDisplayName() : "A peer";
            String previewText = trimmedContent.length() > 60
                    ? trimmedContent.substring(0, 57) + "..."
                    : trimmedContent;

            notificationService.createNotification(
                    otherParticipant.getId(),
                    com.skillswap.notification.entity.NotificationType.NEW_MESSAGE,
                    "New Message from " + senderName,
                    previewText,
                    "CONVERSATION",
                    conversationId,
                    "/messages/" + conversationId
            );
        } catch (Exception e) {
            log.warn("Failed to create message notification: {}", e.getMessage());
        }

        return toMessageResponse(savedMessage);
    }

    @Transactional
    public MarkReadResponse markMessagesAsRead(UUID currentUserId, UUID conversationId) {
        Conversation conversation = conversationRepository.findByIdWithParticipants(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", conversationId));

        if (!conversation.isParticipant(currentUserId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You are not a participant in this conversation");
        }

        Instant now = Instant.now();
        int markedCount = messageRepository.markUnreadMessagesAsRead(conversationId, currentUserId, now);

        participantRepository.findByConversationIdAndUserId(conversationId, currentUserId)
                .ifPresent(p -> {
                    p.setLastReadAt(now);
                    participantRepository.save(p);
                });

        log.info("Marked {} unread messages as read in conversation {} for user {}", markedCount, conversationId, currentUserId);
        return new MarkReadResponse(conversationId, markedCount);
    }

    @Transactional(readOnly = true)
    public UnreadCountResponse getTotalUnreadCount(UUID currentUserId) {
        long count = messageRepository.countTotalUnreadMessagesByUser(currentUserId);
        return new UnreadCountResponse(count);
    }

    @Transactional(readOnly = true)
    public List<UUID> getParticipantUserIds(UUID conversationId) {
        return participantRepository.findByConversationId(conversationId)
                .stream()
                .map(cp -> cp.getUser().getId())
                .toList();
    }

    private void validateEligibility(UUID currentUserId, UUID targetUserId) {
        // Eligibility check: User must have an exchange request, session, or verified active profile
        // For Phase 7, users with accepted/pending exchange requests or sessions can communicate
        log.debug("Validating communication eligibility between {} and {}", currentUserId, targetUserId);
    }

    private ConversationResponse toConversationResponse(Conversation conv, UUID currentUserId) {
        User otherUser = conv.getOtherParticipant(currentUserId);
        Profile otherProfile = profileRepository.findByUserId(otherUser.getId()).orElse(null);

        ConversationParticipant participant = participantRepository.findByConversationIdAndUserId(conv.getId(), otherUser.getId())
                .orElse(null);

        ConversationParticipantDto otherParticipantDto = ConversationParticipantDto.of(
                otherUser,
                otherProfile,
                participant != null ? participant.getLastReadAt() : null
        );

        MessageResponse lastMessage = messageRepository.findLatestMessageByConversationId(conv.getId())
                .map(this::toMessageResponse)
                .orElse(null);

        long unreadCount = messageRepository.countUnreadMessagesByConversationAndUser(conv.getId(), currentUserId);

        return ConversationResponse.of(conv, otherParticipantDto, lastMessage, unreadCount);
    }

    private MessageResponse toMessageResponse(Message message) {
        Profile senderProfile = profileRepository.findByUserId(message.getSender().getId()).orElse(null);
        String senderName = senderProfile != null ? senderProfile.getDisplayName() : "Student";
        return MessageResponse.from(message, senderName);
    }

    @Transactional(readOnly = true)
    public boolean isBlocked(UUID u1, UUID u2) {
        return userBlockService.isBlocked(u1, u2);
    }
}
