package com.skillswap.common.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Structured security audit logger for recording critical security and compliance events.
 */
@Component
public class SecurityAuditLogger {

    private static final Logger log = LoggerFactory.getLogger("SECURITY_AUDIT");

    public void logAuthFailure(String reason, String ip, String path) {
        log.warn("SECURITY_EVENT=AUTH_FAILURE timestamp=\"{}\" ip=\"{}\" path=\"{}\" reason=\"{}\"",
                Instant.now(), ip, path, reason);
    }

    public void logAccessDenied(UUID userId, String resource, String action, String reason) {
        log.warn("SECURITY_EVENT=ACCESS_DENIED timestamp=\"{}\" userId=\"{}\" resource=\"{}\" action=\"{}\" reason=\"{}\"",
                Instant.now(), userId, resource, action, reason);
    }

    public void logSuspendedUserAccess(UUID userId, String authUserId, String path) {
        log.warn("SECURITY_EVENT=SUSPENDED_USER_ACCESS timestamp=\"{}\" userId=\"{}\" authUserId=\"{}\" path=\"{}\"",
                Instant.now(), userId, authUserId, path);
    }

    public void logCreditTransaction(UUID senderUserId, UUID recipientUserId, BigDecimal amount, String type, UUID sessionId) {
        log.info("SECURITY_EVENT=CREDIT_TRANSACTION timestamp=\"{}\" senderId=\"{}\" recipientId=\"{}\" amount=\"{}\" type=\"{}\" sessionId=\"{}\"",
                Instant.now(), senderUserId, recipientUserId, amount, type, sessionId);
    }

    public void logModerationAction(UUID moderatorId, String action, String targetType, UUID targetId, String details) {
        log.info("SECURITY_EVENT=MODERATION_ACTION timestamp=\"{}\" moderatorId=\"{}\" action=\"{}\" targetType=\"{}\" targetId=\"{}\" details=\"{}\"",
                Instant.now(), moderatorId, action, targetType, targetId, details);
    }

    public void logUserBlockAction(UUID blockerId, UUID blockedId, String action) {
        log.info("SECURITY_EVENT=USER_BLOCK timestamp=\"{}\" blockerId=\"{}\" blockedId=\"{}\" action=\"{}\"",
                Instant.now(), blockerId, blockedId, action);
    }

    public void logRateLimitExceeded(String clientIp, String path) {
        log.warn("SECURITY_EVENT=RATE_LIMIT_EXCEEDED timestamp=\"{}\" ip=\"{}\" path=\"{}\"",
                Instant.now(), clientIp, path);
    }
}
