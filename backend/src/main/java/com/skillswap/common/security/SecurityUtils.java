package com.skillswap.common.security;

import com.skillswap.common.exception.ApiException;
import com.skillswap.user.entity.User;
import com.skillswap.user.entity.UserRole;
import com.skillswap.user.entity.UserStatus;
import org.springframework.http.HttpStatus;

import java.util.Objects;
import java.util.UUID;

/**
 * Standardized security assertions for authentication, ownership, participation, and role enforcement.
 */
public final class SecurityUtils {

    private SecurityUtils() {
        // Utility class
    }

    /**
     * Asserts that a principal is authenticated and active.
     */
    public static AuthenticatedUserPrincipal requireAuthenticatedUser(AuthenticatedUserPrincipal principal) {
        if (principal == null || principal.getUserId() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        if (principal.getStatus() != null && principal.getStatus() != UserStatus.ACTIVE) {
            throw new ApiException(HttpStatus.FORBIDDEN, "User account is not active");
        }
        return principal;
    }

    /**
     * Asserts that the current user owns the specified resource.
     */
    public static void requireResourceOwner(UUID resourceOwnerId, UUID currentUserId, String resourceName) {
        if (currentUserId == null || !Objects.equals(resourceOwnerId, currentUserId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You are not authorized to access or modify this " + resourceName);
        }
    }

    /**
     * Asserts that the current user is one of the two participants in a session, conversation, or exchange.
     */
    public static void requireParticipant(UUID participant1Id, UUID participant2Id, UUID currentUserId, String resourceName) {
        if (currentUserId == null || (!Objects.equals(participant1Id, currentUserId) && !Objects.equals(participant2Id, currentUserId))) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You are not a participant of this " + resourceName);
        }
    }

    /**
     * Asserts that the given user entity is active.
     */
    public static void requireActiveUser(User user) {
        if (user == null || user.getStatus() != UserStatus.ACTIVE) {
            throw new ApiException(HttpStatus.FORBIDDEN, "User account is suspended or inactive");
        }
    }

    /**
     * Asserts that the current user possesses MODERATOR or ADMIN role.
     */
    public static void requireModeratorOrAdmin(AuthenticatedUserPrincipal principal) {
        requireAuthenticatedUser(principal);
        if (principal.getRole() != UserRole.MODERATOR && principal.getRole() != UserRole.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Moderator or Administrator privilege required");
        }
    }
}
