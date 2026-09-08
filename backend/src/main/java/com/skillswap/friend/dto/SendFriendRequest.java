package com.skillswap.friend.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record SendFriendRequest(
        @NotNull(message = "Recipient user ID is required")
        UUID receiverId
) {}
