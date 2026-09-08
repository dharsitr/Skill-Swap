package com.skillswap.session.dto;

import com.skillswap.session.entity.SessionStatus;
import java.util.UUID;

public record SessionCallAccessResponse(
        UUID sessionId,
        boolean allowed,
        String role, // "TEACHER" or "LEARNER"
        boolean isInitiator,
        UUID partnerId,
        String partnerName,
        String partnerAvatarUrl,
        String skillName,
        SessionStatus sessionStatus
) {
}
