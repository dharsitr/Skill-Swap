package com.skillswap.common.security;

import com.skillswap.user.entity.UserRole;
import com.skillswap.user.entity.UserStatus;

import java.io.Serializable;
import java.security.Principal;
import java.util.UUID;

public class AuthenticatedUserPrincipal implements Principal, Serializable {

    private final UUID userId;
    private final String authUserId;
    private final String email;
    private final UserStatus status;
    private final UserRole role;

    public AuthenticatedUserPrincipal(UUID userId, String authUserId, String email, UserStatus status) {
        this(userId, authUserId, email, status, UserRole.USER);
    }

    public AuthenticatedUserPrincipal(UUID userId, String authUserId, String email, UserStatus status, UserRole role) {
        this.userId = userId;
        this.authUserId = authUserId;
        this.email = email;
        this.status = status;
        this.role = role != null ? role : UserRole.USER;
    }

    @Override
    public String getName() {
        return authUserId;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getAuthUserId() {
        return authUserId;
    }

    public String getEmail() {
        return email;
    }

    public UserStatus getStatus() {
        return status;
    }

    public UserRole getRole() {
        return role;
    }

    public boolean isModeratorOrAdmin() {
        return role == UserRole.MODERATOR || role == UserRole.ADMIN;
    }
}
