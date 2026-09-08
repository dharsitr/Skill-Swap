package com.skillswap.common.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillswap.common.response.ErrorResponse;
import com.skillswap.user.entity.User;
import com.skillswap.user.entity.UserRole;
import com.skillswap.user.entity.UserStatus;
import com.skillswap.user.service.UserService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Component
public class SupabaseAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenService jwtTokenService;
    private final UserService userService;
    private final ObjectMapper objectMapper;
    private final SecurityAuditLogger securityAuditLogger;

    public SupabaseAuthenticationFilter(
            JwtTokenService jwtTokenService,
            UserService userService,
            ObjectMapper objectMapper,
            SecurityAuditLogger securityAuditLogger
    ) {
        this.jwtTokenService = jwtTokenService;
        this.userService = userService;
        this.objectMapper = objectMapper;
        this.securityAuditLogger = securityAuditLogger;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            Optional<Claims> claimsOpt = jwtTokenService.parseAndValidateToken(token);

            if (claimsOpt.isPresent()) {
                Claims claims = claimsOpt.get();
                String authUserId = jwtTokenService.extractAuthUserId(claims);
                String email = jwtTokenService.extractEmail(claims);
                String displayName = jwtTokenService.extractDisplayName(claims);
                String collegeName = jwtTokenService.extractCollegeName(claims);
                String roleClaim = jwtTokenService.extractRole(claims);

                User user = userService.getOrCreateUser(authUserId, displayName, collegeName);

                if (user.getStatus() != UserStatus.ACTIVE) {
                    securityAuditLogger.logSuspendedUserAccess(user.getId(), user.getAuthUserId(), request.getRequestURI());
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json");
                    response.setCharacterEncoding("UTF-8");
                    ErrorResponse errorResponse = new ErrorResponse(
                            HttpServletResponse.SC_FORBIDDEN,
                            "Forbidden",
                            "User account is suspended or inactive",
                            request.getRequestURI()
                    );
                    response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
                    return;
                }

                UserRole effectiveRole = user.getRole();
                if (roleClaim != null) {
                    if ("MODERATOR".equalsIgnoreCase(roleClaim)) {
                        effectiveRole = UserRole.MODERATOR;
                    } else if ("ADMIN".equalsIgnoreCase(roleClaim)) {
                        effectiveRole = UserRole.ADMIN;
                    }
                }

                AuthenticatedUserPrincipal principal = new AuthenticatedUserPrincipal(
                        user.getId(),
                        user.getAuthUserId(),
                        email,
                        user.getStatus(),
                        effectiveRole
                );

                List<GrantedAuthority> authorities = new ArrayList<>();
                authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
                if (effectiveRole == UserRole.MODERATOR || effectiveRole == UserRole.ADMIN) {
                    authorities.add(new SimpleGrantedAuthority("ROLE_MODERATOR"));
                }
                if (effectiveRole == UserRole.ADMIN) {
                    authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
                }

                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        principal,
                        null,
                        authorities
                );
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
            } else {
                securityAuditLogger.logAuthFailure("Invalid or expired JWT token", request.getRemoteAddr(), request.getRequestURI());
            }
        }

        filterChain.doFilter(request, response);
    }
}
