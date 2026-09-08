package com.skillswap.chat.websocket;

import com.skillswap.common.security.JwtTokenService;
import com.skillswap.user.entity.User;
import com.skillswap.user.repository.UserRepository;
import io.jsonwebtoken.Claims;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.net.URI;
import java.util.Map;
import java.util.Optional;

@Component
public class WebSocketAuthInterceptor implements HandshakeInterceptor {

    private static final Logger log = LoggerFactory.getLogger(WebSocketAuthInterceptor.class);

    private final JwtTokenService jwtTokenService;
    private final UserRepository userRepository;

    public WebSocketAuthInterceptor(JwtTokenService jwtTokenService, UserRepository userRepository) {
        this.jwtTokenService = jwtTokenService;
        this.userRepository = userRepository;
    }

    @Override
    public boolean beforeHandshake(
            @NonNull ServerHttpRequest request,
            @NonNull ServerHttpResponse response,
            @NonNull WebSocketHandler wsHandler,
            @NonNull Map<String, Object> attributes
    ) {
        String token = extractToken(request);

        if (token == null || token.isBlank()) {
            log.warn("WebSocket connection rejected: No authentication token provided");
            return false;
        }

        Optional<Claims> claimsOpt = jwtTokenService.parseAndValidateToken(token);
        if (claimsOpt.isEmpty()) {
            log.warn("WebSocket connection rejected: Invalid or expired JWT token");
            return false;
        }

        Claims claims = claimsOpt.get();
        String authUserId = jwtTokenService.extractAuthUserId(claims);

        Optional<User> userOpt = userRepository.findByAuthUserId(authUserId);
        if (userOpt.isEmpty()) {
            log.warn("WebSocket connection rejected: User not found for authUserId {}", authUserId);
            return false;
        }

        User user = userOpt.get();
        if (user.getStatus() != com.skillswap.user.entity.UserStatus.ACTIVE) {
            log.warn("WebSocket connection rejected: User account {} is suspended or inactive", user.getId());
            return false;
        }

        attributes.put("userId", user.getId());
        attributes.put("authUserId", authUserId);

        log.info("WebSocket handshake authenticated for user id: {}", user.getId());
        return true;
    }

    @Override
    public void afterHandshake(
            @NonNull ServerHttpRequest request,
            @NonNull ServerHttpResponse response,
            @NonNull WebSocketHandler wsHandler,
            @Nullable Exception exception
    ) {
        // No-op
    }

    private String extractToken(ServerHttpRequest request) {
        // Check Authorization header
        String authHeader = request.getHeaders().getFirst("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }

        // Check query parameter: /ws/chat?token=...
        URI uri = request.getURI();
        String query = uri.getQuery();
        if (query != null) {
            for (String param : query.split("&")) {
                String[] pair = param.split("=");
                if (pair.length == 2 && ("token".equalsIgnoreCase(pair[0]) || "access_token".equalsIgnoreCase(pair[0]))) {
                    return pair[1];
                }
            }
        }

        return null;
    }
}
