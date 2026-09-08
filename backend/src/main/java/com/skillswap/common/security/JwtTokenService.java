package com.skillswap.common.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Date;
import java.util.Map;
import java.util.Optional;

@Service
public class JwtTokenService {

    private static final Logger log = LoggerFactory.getLogger(JwtTokenService.class);
    private final ObjectMapper objectMapper;

    @Value("${supabase.jwt.secret:}")
    private String supabaseJwtSecret;

    @Value("${supabase.jwt.verify-signature:false}")
    private boolean verifySignature;

    public JwtTokenService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public Optional<Claims> parseAndValidateToken(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }

        try {
            Claims claims;
            if (supabaseJwtSecret != null && !supabaseJwtSecret.isBlank() && verifySignature) {
                SecretKey key = Keys.hmacShaKeyFor(supabaseJwtSecret.getBytes(StandardCharsets.UTF_8));
                claims = Jwts.parser()
                        .verifyWith(key)
                        .clockSkewSeconds(60)
                        .build()
                        .parseSignedClaims(token)
                        .getPayload();
            } else {
                // Parse JWT payload safely from Base64 JSON
                String[] parts = token.split("\\.");
                if (parts.length < 2) {
                    return Optional.empty();
                }
                String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
                Map<String, Object> claimsMap = objectMapper.readValue(payloadJson, new TypeReference<Map<String, Object>>() {});
                claims = Jwts.claims().add(claimsMap).build();
            }

            // Verify expiration safely with 60 seconds clock skew tolerance
            Date expiration = null;
            try {
                expiration = claims.getExpiration();
            } catch (Exception ignored) {
                Object expObj = claims.get("exp");
                if (expObj instanceof Number num) {
                    expiration = new Date(num.longValue() * 1000L);
                }
            }

            if (expiration != null) {
                Date driftAdjustedNow = new Date(System.currentTimeMillis() - 60_000L);
                if (expiration.before(driftAdjustedNow)) {
                    log.warn("Provided JWT token has expired");
                    return Optional.empty();
                }
            }

            String subject = extractAuthUserId(claims);
            if (subject == null || subject.isBlank()) {
                log.warn("JWT token missing subject (sub) claim");
                return Optional.empty();
            }

            return Optional.of(claims);
        } catch (Exception e) {
            log.warn("JWT token validation failed: {}", e.getMessage());
            return Optional.empty();
        }
    }

    public String extractAuthUserId(Claims claims) {
        try {
            String sub = claims.getSubject();
            if (sub != null && !sub.isBlank()) return sub;
        } catch (Exception ignored) {}
        Object subObj = claims.get("sub");
        return subObj != null ? subObj.toString() : null;
    }

    public String extractEmail(Claims claims) {
        String email = claims.get("email", String.class);
        if (email == null) {
            Object userMetadataObj = claims.get("user_metadata");
            if (userMetadataObj instanceof Map<?, ?> metadata) {
                Object emailObj = metadata.get("email");
                if (emailObj != null) {
                    email = emailObj.toString();
                }
            }
        }
        return email;
    }

    public String extractDisplayName(Claims claims) {
        String displayName = null;
        Object userMetadataObj = claims.get("user_metadata");
        if (userMetadataObj instanceof Map<?, ?> metadata) {
            Object nameObj = metadata.get("display_name");
            if (nameObj == null) {
                nameObj = metadata.get("full_name");
            }
            if (nameObj == null) {
                nameObj = metadata.get("name");
            }
            if (nameObj != null) {
                displayName = nameObj.toString();
            }
        }
        return displayName;
    }

    public String extractCollegeName(Claims claims) {
        Object userMetadataObj = claims.get("user_metadata");
        if (userMetadataObj instanceof Map<?, ?> metadata) {
            Object collegeObj = metadata.get("college_name");
            if (collegeObj != null) {
                return collegeObj.toString();
            }
        }
        return null;
    }

    public String extractRole(Claims claims) {
        Object roleObj = claims.get("role");
        if (roleObj != null && !roleObj.toString().isBlank()) {
            return roleObj.toString();
        }
        Object appMetadataObj = claims.get("app_metadata");
        if (appMetadataObj instanceof Map<?, ?> appMetadata) {
            Object appRole = appMetadata.get("role");
            if (appRole != null) {
                return appRole.toString();
            }
        }
        Object userMetadataObj = claims.get("user_metadata");
        if (userMetadataObj instanceof Map<?, ?> userMetadata) {
            Object userRole = userMetadata.get("role");
            if (userRole != null) {
                return userRole.toString();
            }
        }
        return null;
    }
}
