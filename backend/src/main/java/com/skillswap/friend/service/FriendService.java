package com.skillswap.friend.service;

import com.skillswap.chat.entity.Conversation;
import com.skillswap.chat.repository.ConversationRepository;
import com.skillswap.chat.service.ChatService;
import com.skillswap.common.exception.ApiException;
import com.skillswap.common.exception.ResourceNotFoundException;
import com.skillswap.friend.dto.FriendRequestDto;
import com.skillswap.friend.dto.FriendSummaryDto;
import com.skillswap.friend.dto.FriendshipStatusResponse;
import com.skillswap.friend.entity.FriendRequest;
import com.skillswap.friend.entity.FriendRequestStatus;
import com.skillswap.friend.repository.FriendRequestRepository;
import com.skillswap.notification.entity.NotificationType;
import com.skillswap.notification.service.NotificationService;
import com.skillswap.profile.entity.Profile;
import com.skillswap.profile.repository.ProfileRepository;
import com.skillswap.safety.service.UserBlockService;
import com.skillswap.user.entity.User;
import com.skillswap.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class FriendService {

    private static final Logger log = LoggerFactory.getLogger(FriendService.class);

    private final FriendRequestRepository friendRequestRepository;
    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final ConversationRepository conversationRepository;
    private final ChatService chatService;
    private final NotificationService notificationService;
    private final UserBlockService userBlockService;

    public FriendService(
            FriendRequestRepository friendRequestRepository,
            UserRepository userRepository,
            ProfileRepository profileRepository,
            ConversationRepository conversationRepository,
            ChatService chatService,
            NotificationService notificationService,
            UserBlockService userBlockService
    ) {
        this.friendRequestRepository = friendRequestRepository;
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.conversationRepository = conversationRepository;
        this.chatService = chatService;
        this.notificationService = notificationService;
        this.userBlockService = userBlockService;
    }

    @Transactional(readOnly = true)
    public FriendshipStatusResponse getFriendshipStatus(UUID currentUserId, UUID targetUserId) {
        if (currentUserId.equals(targetUserId)) {
            return FriendshipStatusResponse.none();
        }

        List<FriendRequest> requests = friendRequestRepository.findRequestsBetweenUsers(currentUserId, targetUserId);
        if (requests.isEmpty()) {
            return FriendshipStatusResponse.none();
        }

        // Check if there is an accepted friendship
        Optional<FriendRequest> accepted = requests.stream()
                .filter(r -> r.getStatus() == FriendRequestStatus.ACCEPTED)
                .findFirst();

        if (accepted.isPresent()) {
            UUID convId = conversationRepository.findByParticipantIds(currentUserId, targetUserId)
                    .map(Conversation::getId)
                    .orElse(null);
            return FriendshipStatusResponse.accepted(accepted.get().getId(), convId);
        }

        // Check if there is a pending request
        Optional<FriendRequest> pending = requests.stream()
                .filter(r -> r.getStatus() == FriendRequestStatus.PENDING)
                .findFirst();

        if (pending.isPresent()) {
            FriendRequest req = pending.get();
            if (req.getSender().getId().equals(currentUserId)) {
                return FriendshipStatusResponse.pendingSent(req.getId());
            } else {
                return FriendshipStatusResponse.pendingReceived(req.getId());
            }
        }

        return FriendshipStatusResponse.none();
    }

    @Transactional
    public FriendRequestDto sendFriendRequest(UUID senderId, UUID receiverId) {
        if (senderId.equals(receiverId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You cannot send a friend request to yourself.");
        }

        if (userBlockService.isBlocked(senderId, receiverId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Cannot send friend request due to safety restrictions.");
        }

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", senderId));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", receiverId));

        List<FriendRequest> existingRequests = friendRequestRepository.findRequestsBetweenUsers(senderId, receiverId);

        // Check if already friends
        boolean alreadyFriends = existingRequests.stream()
                .anyMatch(r -> r.getStatus() == FriendRequestStatus.ACCEPTED);
        if (alreadyFriends) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You are already connected with this student.");
        }

        // Check existing pending
        for (FriendRequest req : existingRequests) {
            if (req.getStatus() == FriendRequestStatus.PENDING) {
                if (req.getSender().getId().equals(senderId)) {
                    return toDto(req);
                } else {
                    // Receiver had sent a pending request -> auto-accept
                    return acceptFriendRequest(senderId, req.getId());
                }
            }
        }

        FriendRequest friendRequest = new FriendRequest(sender, receiver);
        FriendRequest saved = friendRequestRepository.save(friendRequest);

        try {
            // Send In-App Notification to recipient
            Profile senderProfile = profileRepository.findByUserId(senderId).orElse(null);
            String senderDisplayName = senderProfile != null && senderProfile.getDisplayName() != null
                    ? senderProfile.getDisplayName()
                    : "A student";

            notificationService.createNotification(
                    receiverId,
                    NotificationType.FRIEND_REQUEST_RECEIVED,
                    "New Friend Request",
                    senderDisplayName + " sent you a friend request on SkillSwap.",
                    "FRIEND_REQUEST",
                    saved.getId(),
                    "/profile/" + senderId
            );
        } catch (Exception e) {
            log.warn("Failed to create friend request notification: {}", e.getMessage());
        }

        log.info("User {} sent friend request {} to user {}", senderId, saved.getId(), receiverId);
        return toDto(saved);
    }

    @Transactional
    public FriendRequestDto acceptFriendRequest(UUID currentUserId, UUID requestId) {
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("FriendRequest", "id", requestId));

        if (!request.getReceiver().getId().equals(currentUserId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only the recipient can accept this friend request.");
        }

        if (request.getStatus() != FriendRequestStatus.PENDING) {
            if (request.getStatus() == FriendRequestStatus.ACCEPTED) {
                return toDto(request);
            }
            throw new ApiException(HttpStatus.BAD_REQUEST, "Friend request is no longer pending.");
        }

        request.setStatus(FriendRequestStatus.ACCEPTED);
        request.setUpdatedAt(Instant.now());
        FriendRequest saved = friendRequestRepository.save(request);

        // Automatically provision conversation so direct messaging is ready
        try {
            chatService.getOrCreateConversation(request.getSender().getId(), request.getReceiver().getId());
        } catch (Exception e) {
            log.warn("Auto-provisioning conversation failed: {}", e.getMessage());
        }

        // Send In-App Notification to sender
        try {
            Profile receiverProfile = profileRepository.findByUserId(currentUserId).orElse(null);
            String receiverDisplayName = receiverProfile != null && receiverProfile.getDisplayName() != null
                    ? receiverProfile.getDisplayName()
                    : "A student";

            notificationService.createNotification(
                    request.getSender().getId(),
                    NotificationType.FRIEND_REQUEST_ACCEPTED,
                    "Friend Request Accepted",
                    receiverDisplayName + " accepted your friend request. You can now chat directly!",
                    "FRIEND_REQUEST",
                    saved.getId(),
                    "/profile/" + currentUserId
            );
        } catch (Exception e) {
            log.warn("Sending friend request accepted notification failed: {}", e.getMessage());
        }

        log.info("User {} accepted friend request {} from user {}", currentUserId, saved.getId(), request.getSender().getId());
        return toDto(saved);
    }

    @Transactional
    public FriendRequestDto declineFriendRequest(UUID currentUserId, UUID requestId) {
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("FriendRequest", "id", requestId));

        if (!request.getReceiver().getId().equals(currentUserId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only the recipient can decline this friend request.");
        }

        if (request.getStatus() != FriendRequestStatus.PENDING) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Friend request is not pending.");
        }

        request.setStatus(FriendRequestStatus.DECLINED);
        request.setUpdatedAt(Instant.now());
        FriendRequest saved = friendRequestRepository.save(request);

        log.info("User {} declined friend request {}", currentUserId, saved.getId());
        return toDto(saved);
    }

    @Transactional
    public void cancelFriendRequest(UUID currentUserId, UUID requestId) {
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("FriendRequest", "id", requestId));

        if (!request.getSender().getId().equals(currentUserId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only the sender can cancel this friend request.");
        }

        friendRequestRepository.delete(request);
        log.info("User {} cancelled friend request {}", currentUserId, requestId);
    }

    @Transactional
    public void removeFriend(UUID currentUserId, UUID friendUserId) {
        Optional<FriendRequest> friendship = friendRequestRepository.findAcceptedFriendship(currentUserId, friendUserId);
        friendship.ifPresent(friendRequestRepository::delete);
        log.info("User {} removed friendship with user {}", currentUserId, friendUserId);
    }

    @Transactional(readOnly = true)
    public List<FriendRequestDto> getPendingIncomingRequests(UUID currentUserId) {
        return friendRequestRepository.findPendingIncomingRequests(currentUserId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FriendRequestDto> getPendingOutgoingRequests(UUID currentUserId) {
        return friendRequestRepository.findPendingOutgoingRequests(currentUserId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FriendSummaryDto> getFriends(UUID currentUserId) {
        List<FriendRequest> acceptedList = friendRequestRepository.findAcceptedFriendsForUser(currentUserId);
        List<FriendSummaryDto> summaries = new ArrayList<>();

        for (FriendRequest fr : acceptedList) {
            User friend = fr.getSender().getId().equals(currentUserId) ? fr.getReceiver() : fr.getSender();
            Profile profile = profileRepository.findByUserId(friend.getId()).orElse(null);
            UUID convId = conversationRepository.findByParticipantIds(currentUserId, friend.getId())
                    .map(Conversation::getId)
                    .orElse(null);
            summaries.add(FriendSummaryDto.of(fr.getId(), friend, profile, convId, fr.getUpdatedAt()));
        }

        return summaries;
    }

    private FriendRequestDto toDto(FriendRequest request) {
        Profile senderProfile = profileRepository.findByUserId(request.getSender().getId()).orElse(null);
        Profile receiverProfile = profileRepository.findByUserId(request.getReceiver().getId()).orElse(null);
        return FriendRequestDto.fromEntity(request, senderProfile, receiverProfile);
    }
}
