package com.skillswap.friend.dto;

import com.skillswap.friend.entity.FriendRequest;
import com.skillswap.friend.entity.FriendRequestStatus;
import com.skillswap.profile.entity.Profile;
import com.skillswap.user.entity.User;

import java.time.Instant;
import java.util.UUID;

public record FriendRequestDto(
        UUID id,
        UUID senderId,
        String senderName,
        String senderAvatarUrl,
        String senderCollege,
        UUID receiverId,
        String receiverName,
        String receiverAvatarUrl,
        String receiverCollege,
        FriendRequestStatus status,
        Instant createdAt,
        Instant updatedAt
) {
    public static FriendRequestDto fromEntity(FriendRequest request, Profile senderProfile, Profile receiverProfile) {
        User sender = request.getSender();
        User receiver = request.getReceiver();

        return new FriendRequestDto(
                request.getId(),
                sender.getId(),
                senderProfile != null && senderProfile.getDisplayName() != null ? senderProfile.getDisplayName() : "Student",
                senderProfile != null ? senderProfile.getAvatarUrl() : null,
                senderProfile != null ? senderProfile.getCollegeName() : null,
                receiver.getId(),
                receiverProfile != null && receiverProfile.getDisplayName() != null ? receiverProfile.getDisplayName() : "Student",
                receiverProfile != null ? receiverProfile.getAvatarUrl() : null,
                receiverProfile != null ? receiverProfile.getCollegeName() : null,
                request.getStatus(),
                request.getCreatedAt(),
                request.getUpdatedAt()
        );
    }
}
