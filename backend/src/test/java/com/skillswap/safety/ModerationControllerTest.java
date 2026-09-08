package com.skillswap.safety;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillswap.common.security.AuthenticatedUserPrincipal;
import com.skillswap.exchange.entity.ExchangeRequest;
import com.skillswap.exchange.entity.ExchangeRequestStatus;
import com.skillswap.exchange.repository.ExchangeRequestRepository;
import com.skillswap.safety.dto.CreateDisputeRequest;
import com.skillswap.safety.dto.CreateReportRequest;
import com.skillswap.safety.dto.UpdateDisputeStatusRequest;
import com.skillswap.safety.dto.UpdateReportStatusRequest;
import com.skillswap.safety.entity.DisputeReason;
import com.skillswap.safety.entity.DisputeStatus;
import com.skillswap.safety.entity.ReportReason;
import com.skillswap.safety.entity.ReportStatus;
import com.skillswap.safety.service.DisputeService;
import com.skillswap.safety.service.ReportService;
import com.skillswap.session.entity.Session;
import com.skillswap.session.entity.SessionStatus;
import com.skillswap.session.repository.SessionRepository;
import com.skillswap.skill.entity.Skill;
import com.skillswap.skill.entity.SkillCategory;
import com.skillswap.skill.repository.SkillCategoryRepository;
import com.skillswap.skill.repository.SkillRepository;
import com.skillswap.user.entity.User;
import com.skillswap.user.entity.UserRole;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ModerationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserService userService;

    @Autowired
    private SkillCategoryRepository categoryRepository;

    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private ExchangeRequestRepository exchangeRequestRepository;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private ReportService reportService;

    @Autowired
    private DisputeService disputeService;

    private User normalUser;
    private User moderatorUser;
    private User studentUser;
    private UUID reportId;
    private UUID disputeId;

    @BeforeEach
    void setUp() {
        normalUser = userService.getOrCreateUser("auth-norm-" + UUID.randomUUID(), "Normal Student", "MIT");
        moderatorUser = userService.getOrCreateUser("auth-mod-" + UUID.randomUUID(), "Campus Moderator", "Staff");
        moderatorUser.setRole(UserRole.MODERATOR);

        studentUser = userService.getOrCreateUser("auth-stu-" + UUID.randomUUID(), "Reported Student", "Harvard");

        SkillCategory cat = categoryRepository.save(new SkillCategory(null, "Math-" + UUID.randomUUID(), "Calculus"));
        Skill skill = skillRepository.save(new Skill(null, cat, "Calculus-" + UUID.randomUUID(), "Calc"));

        ExchangeRequest req = exchangeRequestRepository.save(new ExchangeRequest(
                null, normalUser, studentUser, skill, "Math session", ExchangeRequestStatus.ACCEPTED));
        Session session = sessionRepository.save(new Session(
                null, req, studentUser, normalUser, skill, SessionStatus.COMPLETED));

        var report = reportService.createReport(normalUser.getId(), new CreateReportRequest(
                studentUser.getId(), session.getId(), ReportReason.INAPPROPRIATE_BEHAVIOR, "Offensive remarks"));
        reportId = report.getId();

        var dispute = disputeService.createDispute(normalUser.getId(), new CreateDisputeRequest(
                session.getId(), DisputeReason.SESSION_INCOMPLETE, "Ended after 5 mins"));
        disputeId = dispute.getId();
    }

    private UsernamePasswordAuthenticationToken createAuthToken(User user, boolean isModerator) {
        AuthenticatedUserPrincipal principal = new AuthenticatedUserPrincipal(
                user.getId(),
                user.getAuthUserId(),
                user.getAuthUserId() + "@example.edu",
                user.getStatus(),
                isModerator ? UserRole.MODERATOR : UserRole.USER
        );
        List<SimpleGrantedAuthority> authorities = isModerator
                ? List.of(new SimpleGrantedAuthority("ROLE_USER"), new SimpleGrantedAuthority("ROLE_MODERATOR"))
                : List.of(new SimpleGrantedAuthority("ROLE_USER"));

        return new UsernamePasswordAuthenticationToken(principal, "mock-token", authorities);
    }

    @Test
    @DisplayName("Normal user is forbidden from accessing moderation endpoints")
    void testModeration_NormalUser_Forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/moderation/reports")
                        .with(authentication(createAuthToken(normalUser, false))))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/moderation/disputes")
                        .with(authentication(createAuthToken(normalUser, false))))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Moderator lists reports and updates status")
    void testModerator_ReportsWorkflow() throws Exception {
        // List reports
        mockMvc.perform(get("/api/v1/moderation/reports")
                        .with(authentication(createAuthToken(moderatorUser, true))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.items[0].reason").value("INAPPROPRIATE_BEHAVIOR"));

        // Get report detail
        mockMvc.perform(get("/api/v1/moderation/reports/" + reportId)
                        .with(authentication(createAuthToken(moderatorUser, true))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(reportId.toString()))
                .andExpect(jsonPath("$.reporterName").value("Normal Student"));

        // Update status to RESOLVED with notes
        UpdateReportStatusRequest updateReq = new UpdateReportStatusRequest(
                ReportStatus.RESOLVED,
                "Investigated and resolved with student warning"
        );

        mockMvc.perform(patch("/api/v1/moderation/reports/" + reportId + "/status")
                        .with(authentication(createAuthToken(moderatorUser, true)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"))
                .andExpect(jsonPath("$.moderatorNotes").value("Investigated and resolved with student warning"))
                .andExpect(jsonPath("$.resolvedById").value(moderatorUser.getId().toString()));
    }

    @Test
    @DisplayName("Moderator lists disputes and updates dispute status")
    void testModerator_DisputesWorkflow() throws Exception {
        // List disputes
        mockMvc.perform(get("/api/v1/moderation/disputes")
                        .with(authentication(createAuthToken(moderatorUser, true))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.items[0].reason").value("SESSION_INCOMPLETE"));

        // Update status to RESOLVED
        UpdateDisputeStatusRequest updateReq = new UpdateDisputeStatusRequest(
                DisputeStatus.RESOLVED,
                "Refund approved"
        );

        mockMvc.perform(patch("/api/v1/moderation/disputes/" + disputeId + "/status")
                        .with(authentication(createAuthToken(moderatorUser, true)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"))
                .andExpect(jsonPath("$.moderatorNotes").value("Refund approved"));
    }
}
