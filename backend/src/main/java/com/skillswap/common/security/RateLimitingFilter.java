package com.skillswap.common.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillswap.common.response.ErrorResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Production Rate Limiting Filter.
 * Protects mutation-heavy, messaging, search, and abuse-prone endpoints
 * using an in-memory sliding token window per client IP.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 5)
@ConditionalOnProperty(name = "rate.limit.enabled", havingValue = "true", matchIfMissing = false)
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitingFilter.class);

    @Value("${rate.limit.requests-per-minute:${rate.limit.requests.per.minute:180}}")
    private int maxRequestsPerMinute;

    @Value("${rate.limit.mutation-per-minute:${rate.limit.mutation.per.minute:60}}")
    private int maxMutationsPerMinute;

    private final ObjectMapper objectMapper;
    private final SecurityAuditLogger securityAuditLogger;
    private final Map<String, RequestCounter> requestCounts = new ConcurrentHashMap<>();

    public RateLimitingFilter(ObjectMapper objectMapper, SecurityAuditLogger securityAuditLogger) {
        this.objectMapper = objectMapper;
        this.securityAuditLogger = securityAuditLogger;
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/api/v1/health") ||
                path.startsWith("/api/v1/version") ||
                path.startsWith("/v3/api-docs") ||
                path.startsWith("/swagger-ui") ||
                path.startsWith("/ws/chat") ||
                request.getMethod().equalsIgnoreCase("OPTIONS");
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        String clientIp = getClientIp(request);
        boolean isMutation = isMutationMethod(request.getMethod());
        int limit = isMutation ? maxMutationsPerMinute : maxRequestsPerMinute;

        String counterKey = clientIp + ":" + (isMutation ? "MUTATION" : "QUERY");
        long currentWindow = System.currentTimeMillis() / 60000;

        RequestCounter counter = requestCounts.compute(counterKey, (k, existing) -> {
            if (existing == null || existing.window != currentWindow) {
                return new RequestCounter(currentWindow, new AtomicInteger(1));
            }
            existing.counter.incrementAndGet();
            return existing;
        });

        if (counter.counter.get() > limit) {
            log.warn("Rate limit exceeded for IP: {} on URI: {} [Method: {}, Count: {}, Limit: {}]",
                    clientIp, request.getRequestURI(), request.getMethod(), counter.counter.get(), limit);
            securityAuditLogger.logRateLimitExceeded(clientIp, request.getRequestURI());

            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setHeader("Retry-After", "60");

            ErrorResponse error = new ErrorResponse(
                    HttpStatus.TOO_MANY_REQUESTS.value(),
                    HttpStatus.TOO_MANY_REQUESTS.getReasonPhrase(),
                    "Rate limit exceeded. Please wait before submitting additional requests.",
                    request.getRequestURI()
            );

            objectMapper.writeValue(response.getOutputStream(), error);
            return;
        }

        // Clean up old window records periodically
        if (requestCounts.size() > 5000) {
            long currentMin = System.currentTimeMillis() / 60000;
            requestCounts.entrySet().removeIf(e -> e.getValue().window < currentMin - 2);
        }

        filterChain.doFilter(request, response);
    }

    private boolean isMutationMethod(String method) {
        return "POST".equalsIgnoreCase(method) ||
                "PUT".equalsIgnoreCase(method) ||
                "PATCH".equalsIgnoreCase(method) ||
                "DELETE".equalsIgnoreCase(method);
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isBlank()) {
            return xRealIp.trim();
        }
        return request.getRemoteAddr();
    }

    private static class RequestCounter {
        final long window;
        final AtomicInteger counter;

        RequestCounter(long window, AtomicInteger counter) {
            this.window = window;
            this.counter = counter;
        }
    }
}
