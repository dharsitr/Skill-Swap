package com.skillswap.safety;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillswap.common.security.AuthenticatedUserPrincipal;
import com.skillswap.safety.dto.CreateReportRequest;
import com.skillswap.safety.entity.ReportReason;
import com.skillswap.user.entity.User;
import com.skillswap.user.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ReportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserService userService;

    private User reporterUser;
    private User reportedUser;

    @BeforeEach
    void setUp() {
        reporterUser = userService.getOrCreateUser("auth-rep-" + UUID.randomUUID(), "Reporter Dan", "MIT");
        reportedUser = userService.getOrCreateUser("auth-bad-" + UUID.randomUUID(), "Bad Actor", "Harvard");
    }

    private UsernamePasswordAuthenticationToken createAuthToken(User user) {
        AuthenticatedUserPrincipal principal = new AuthenticatedUserPrincipal(
                user.getId(),
                user.getAuthUserId(),
                user.getAuthUserId() + "@example.edu",
                user.getStatus()
        );
        return new UsernamePasswordAuthenticationToken(principal, "mock-token", List.of(new SimpleGrantedAuthority("ROLE_USER")));
    }

    @Test
    @DisplayName("Submit user behavior report")
    void testCreateReport_Success() throws Exception {
        CreateReportRequest request = new CreateReportRequest(
                reportedUser.getId(),
                null,
                ReportReason.HARASSMENT,
                "Inappropriate messages during session"
        );

        mockMvc.perform(post("/api/v1/reports")
                        .with(authentication(createAuthToken(reporterUser)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.reportedUserId").value(reportedUser.getId().toString()))
                .andExpect(jsonPath("$.reason").value("HARASSMENT"))
                .andExpect(jsonPath("$.status").value("OPEN"));

        // Verify reporter can view their submitted reports
        mockMvc.perform(get("/api/v1/reports/my")
                        .with(authentication(createAuthToken(reporterUser))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].reason").value("HARASSMENT"));
    }

    @Test
    @DisplayName("Reject self-report")
    void testCreateReport_Self_BadRequest() throws Exception {
        CreateReportRequest request = new CreateReportRequest(
                reporterUser.getId(),
                null,
                ReportReason.SPAM,
                "Self spam"
        );

        mockMvc.perform(post("/api/v1/reports")
                        .with(authentication(createAuthToken(reporterUser)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("cannot report yourself")));
    }
}
