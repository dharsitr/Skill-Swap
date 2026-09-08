package com.skillswap.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillswap.chat.dto.ConversationResponse;
import com.skillswap.chat.service.ChatService;
import com.skillswap.common.security.AuthenticatedUserPrincipal;
import com.skillswap.common.security.JwtTokenService;
import com.skillswap.common.security.SecurityAuditLogger;
import com.skillswap.common.util.InputSanitizer;
import com.skillswap.credit.entity.CreditTransaction;
import com.skillswap.credit.entity.CreditTransactionDirection;
import com.skillswap.credit.entity.CreditTransactionType;
import com.skillswap.credit.entity.CreditWallet;
import com.skillswap.credit.repository.CreditTransactionRepository;
import com.skillswap.credit.repository.CreditWalletRepository;
import com.skillswap.profile.dto.UpdateProfileRequest;
import com.skillswap.profile.service.ProfileService;
import com.skillswap.user.entity.User;
import com.skillswap.user.entity.UserRole;
import com.skillswap.user.entity.UserStatus;
import com.skillswap.user.repository.UserRepository;
import com.skillswap.user.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.http.server.ServletServerHttpResponse;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class SecurityHardeningIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProfileService profileService;

    @Autowired
    private ChatService chatService;

    @Autowired
    private CreditWalletRepository creditWalletRepository;

    @Autowired
    private CreditTransactionRepository creditTransactionRepository;

    @Autowired
    private JwtTokenService jwtTokenService;

    @Autowired
    private ObjectMapper objectMapper;

    private User activeUserA;
    private User activeUserB;
    private User suspendedUser;

    @BeforeEach
    void setUp() {
        activeUserA = userService.getOrCreateUser("auth-sec-a-" + UUID.randomUUID(), "Alice Security", "MIT");
        activeUserB = userService.getOrCreateUser("auth-sec-b-" + UUID.randomUUID(), "Bob Security", "Stanford");

        suspendedUser = userService.getOrCreateUser("auth-sec-suspended-" + UUID.randomUUID(), "Mallory Suspended", "Unknown");
        suspendedUser.setStatus(UserStatus.SUSPENDED);
        userRepository.save(suspendedUser);
    }

    private UsernamePasswordAuthenticationToken createAuthToken(User user) {
        AuthenticatedUserPrincipal principal = new AuthenticatedUserPrincipal(
                user.getId(),
                user.getAuthUserId(),
                user.getAuthUserId() + "@example.edu",
                user.getStatus(),
                user.getRole()
        );
        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
        if (user.getRole() == UserRole.MODERATOR || user.getRole() == UserRole.ADMIN) {
            authorities.add(new SimpleGrantedAuthority("ROLE_MODERATOR"));
        }
        if (user.getRole() == UserRole.ADMIN) {
            authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
        }
        return new UsernamePasswordAuthenticationToken(principal, null, authorities);
    }

    @Test
    @DisplayName("P1 - Unauthenticated request returns HTTP 401 with standard ErrorResponse envelope")
    void unauthenticatedRequestReturns401StandardEnvelope() throws Exception {
        mockMvc.perform(get("/api/v1/profile/me")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)))
                .andExpect(jsonPath("$.error", is("Unauthorized")))
                .andExpect(jsonPath("$.message", is("Authentication is required")))
                .andExpect(jsonPath("$.path", is("/api/v1/profile/me")))
                .andExpect(jsonPath("$.timestamp", notNullValue()));
    }

    @Test
    @DisplayName("P1 - Request with malformed Bearer token returns HTTP 401")
    void malformedBearerTokenReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/profile/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer not.a.valid.jwt")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)))
                .andExpect(jsonPath("$.error", is("Unauthorized")));
    }

    @Test
    @DisplayName("P0 - Suspended user is rejected with HTTP 403 Forbidden")
    void suspendedUserIsRejectedWithForbidden() throws Exception {
        // Build a mock JWT for the suspended user
        String tokenPayload = Base64.getUrlEncoder().encodeToString(
                ("{\"sub\":\"" + suspendedUser.getAuthUserId() + "\",\"exp\":" + (System.currentTimeMillis() / 1000 + 3600) + "}").getBytes()
        );
        String mockJwt = "header." + tokenPayload + ".signature";

        mockMvc.perform(get("/api/v1/profile/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + mockJwt)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)))
                .andExpect(jsonPath("$.error", is("Forbidden")))
                .andExpect(jsonPath("$.message", containsString("User account is suspended")));
    }

    @Test
    @DisplayName("P1 - Standard OWASP security headers must be present on HTTP responses")
    void owaspSecurityHeadersArePresent() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("X-Frame-Options", "DENY"))
                .andExpect(header().string("Content-Security-Policy", containsString("default-src 'self'")))
                .andExpect(header().string("Referrer-Policy", containsString("strict-origin")));
    }

    @Test
    @DisplayName("P2 - IDOR: User cannot access conversations they are not part of")
    void idorConversationAccessDenied() throws Exception {
        // Conversation between A and B
        ConversationResponse conversation = chatService.getOrCreateConversation(activeUserA.getId(), activeUserB.getId());

        User bystander = userService.getOrCreateUser("auth-sec-c-" + UUID.randomUUID(), "Charlie Bystander", "Harvard");

        // Bystander tries to view conversation details
        mockMvc.perform(get("/api/v1/conversations/" + conversation.id())
                        .with(authentication(createAuthToken(bystander)))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)));

        // Bystander tries to view conversation messages
        mockMvc.perform(get("/api/v1/conversations/" + conversation.id() + "/messages")
                        .with(authentication(createAuthToken(bystander)))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)));
    }

    @Test
    @DisplayName("P2 - IDOR: User cannot access other user's wallet transactions")
    void idorWalletTransactionAccessDenied() throws Exception {
        CreditWallet walletA = creditWalletRepository.findByUserId(activeUserA.getId())
                .orElseThrow();

        CreditTransaction txA = creditTransactionRepository.save(new CreditTransaction(
                walletA,
                activeUserA,
                5,
                CreditTransactionDirection.CREDIT,
                CreditTransactionType.INITIAL_CREDIT,
                null,
                "Test tx"
        ));

        // User B attempts to access User A's transaction
        mockMvc.perform(get("/api/v1/wallet/transactions/" + txA.getId())
                        .with(authentication(createAuthToken(activeUserB)))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)))
                .andExpect(jsonPath("$.message", containsString("not authorized")));
    }

    @Test
    @DisplayName("P1 - InputSanitizer strips malicious XSS tags and scripts")
    void inputSanitizerStripsXss() {
        String xssScript = "<script>alert('XSS')</script>Hello World";
        assertEquals("Hello World", InputSanitizer.sanitize(xssScript));

        String xssImg = "<img src=x onerror=alert('hacked')>Safe Text";
        assertEquals("Safe Text", InputSanitizer.sanitize(xssImg));

        String xssJavascript = "<a href=\"javascript:alert('xss')\">Click me</a>";
        assertEquals("Click me", InputSanitizer.sanitize(xssJavascript));

        String htmlEntities = InputSanitizer.escapeHtml("<b>\"Tom & Jerry\"</b>");
        assertEquals("&lt;b&gt;&quot;Tom &amp; Jerry&quot;&lt;/b&gt;", htmlEntities);
    }

    @Test
    @DisplayName("P1 - Profile updates sanitize input against stored XSS")
    void profileUpdatesSanitizeInput() {
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setBio("<script>alert('pwned')</script>Passionate computer science student.");
        request.setDepartment("<b>Computer Science</b>");

        var response = profileService.updateProfile(activeUserA.getAuthUserId(), request);

        assertEquals("Passionate computer science student.", response.getBio());
        assertEquals("Computer Science", response.getDepartment());
    }

    @Test
    @DisplayName("P1 - RateLimitingFilter returns 429 Too Many Requests when threshold exceeded")
    void rateLimitingFilterEnforcesThreshold() throws Exception {
        com.skillswap.common.security.RateLimitingFilter filter = new com.skillswap.common.security.RateLimitingFilter(
                objectMapper,
                new SecurityAuditLogger()
        );

        // Reflectively set small limits for testing
        java.lang.reflect.Field maxReqField = com.skillswap.common.security.RateLimitingFilter.class.getDeclaredField("maxRequestsPerMinute");
        maxReqField.setAccessible(true);
        maxReqField.set(filter, 2);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/profile/me");
        request.setRemoteAddr("192.168.1.100");

        // Request 1: allowed
        MockHttpServletResponse response1 = new MockHttpServletResponse();
        filter.doFilter(request, response1, (req, res) -> {});
        assertEquals(200, response1.getStatus());

        // Request 2: allowed
        MockHttpServletResponse response2 = new MockHttpServletResponse();
        filter.doFilter(request, response2, (req, res) -> {});
        assertEquals(200, response2.getStatus());

        // Request 3: rate limited!
        MockHttpServletResponse response3 = new MockHttpServletResponse();
        filter.doFilter(request, response3, (req, res) -> {});
        assertEquals(429, response3.getStatus());
        assertEquals("60", response3.getHeader("Retry-After"));
        assertTrue(response3.getContentAsString().contains("Rate limit exceeded"));
    }

    @Test
    @DisplayName("P0 - WebSocketAuthInterceptor rejects connection for missing token or suspended user")
    void webSocketAuthInterceptorRejectsInvalidConnections() {
        com.skillswap.chat.websocket.WebSocketAuthInterceptor interceptor =
                new com.skillswap.chat.websocket.WebSocketAuthInterceptor(jwtTokenService, userRepository);

        // Case 1: Missing token
        MockHttpServletRequest req1 = new MockHttpServletRequest();
        ServletServerHttpRequest serverReq1 = new ServletServerHttpRequest(req1);
        ServletServerHttpResponse serverRes1 = new ServletServerHttpResponse(new MockHttpServletResponse());
        Map<String, Object> attributes1 = new HashMap<>();

        boolean result1 = interceptor.beforeHandshake(serverReq1, serverRes1, null, attributes1);
        assertFalse(result1, "Handshake should be rejected when token is missing");

        // Case 2: Suspended user token
        String tokenPayload = Base64.getUrlEncoder().encodeToString(
                ("{\"sub\":\"" + suspendedUser.getAuthUserId() + "\",\"exp\":" + (System.currentTimeMillis() / 1000 + 3600) + "}").getBytes()
        );
        String mockJwt = "header." + tokenPayload + ".signature";

        MockHttpServletRequest req2 = new MockHttpServletRequest();
        req2.addHeader("Authorization", "Bearer " + mockJwt);
        ServletServerHttpRequest serverReq2 = new ServletServerHttpRequest(req2);
        ServletServerHttpResponse serverRes2 = new ServletServerHttpResponse(new MockHttpServletResponse());
        Map<String, Object> attributes2 = new HashMap<>();

        boolean result2 = interceptor.beforeHandshake(serverReq2, serverRes2, null, attributes2);
        assertFalse(result2, "Handshake should be rejected for suspended user");
    }
}
