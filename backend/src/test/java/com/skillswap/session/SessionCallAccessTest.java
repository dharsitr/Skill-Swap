package com.skillswap.session;

import com.skillswap.common.security.AuthenticatedUserPrincipal;
import com.skillswap.exchange.entity.ExchangeRequest;
import com.skillswap.exchange.entity.ExchangeRequestStatus;
import com.skillswap.exchange.repository.ExchangeRequestRepository;
import com.skillswap.session.entity.Session;
import com.skillswap.session.entity.SessionStatus;
import com.skillswap.session.repository.SessionRepository;
import com.skillswap.skill.entity.Skill;
import com.skillswap.skill.entity.SkillCategory;
import com.skillswap.skill.repository.SkillCategoryRepository;
import com.skillswap.skill.repository.SkillRepository;
import com.skillswap.user.entity.User;
import com.skillswap.user.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class SessionCallAccessTest {

    @Autowired
    private MockMvc mockMvc;

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

    private User teacher;
    private User learner;
    private User outsider;
    private Session scheduledSession;
    private Session inProgressSession;
    private Session completedSession;
    private Session cancelledSession;

    @BeforeEach
    void setUp() {
        teacher = userService.getOrCreateUser("auth-" + UUID.randomUUID(), "Dr. Teacher", "MIT");
        learner = userService.getOrCreateUser("auth-" + UUID.randomUUID(), "Alice Learner", "Stanford");
        outsider = userService.getOrCreateUser("auth-" + UUID.randomUUID(), "Bob Outsider", "Harvard");

        SkillCategory category = categoryRepository.save(new SkillCategory(null, "Computing-" + UUID.randomUUID(), "Desc"));
        Skill skill = skillRepository.save(new Skill(null, category, "WebRTC-" + UUID.randomUUID(), "Desc"));

        ExchangeRequest req1 = exchangeRequestRepository.save(new ExchangeRequest(null, learner, teacher, skill, "Learn", ExchangeRequestStatus.ACCEPTED));
        ExchangeRequest req2 = exchangeRequestRepository.save(new ExchangeRequest(null, learner, teacher, skill, "Learn", ExchangeRequestStatus.ACCEPTED));
        ExchangeRequest req3 = exchangeRequestRepository.save(new ExchangeRequest(null, learner, teacher, skill, "Learn", ExchangeRequestStatus.ACCEPTED));
        ExchangeRequest req4 = exchangeRequestRepository.save(new ExchangeRequest(null, learner, teacher, skill, "Learn", ExchangeRequestStatus.ACCEPTED));

        scheduledSession = sessionRepository.save(new Session(null, req1, teacher, learner, skill, SessionStatus.SCHEDULED));
        inProgressSession = sessionRepository.save(new Session(null, req2, teacher, learner, skill, SessionStatus.IN_PROGRESS));
        completedSession = sessionRepository.save(new Session(null, req3, teacher, learner, skill, SessionStatus.COMPLETED));
        cancelledSession = sessionRepository.save(new Session(null, req4, teacher, learner, skill, SessionStatus.CANCELLED));
    }

    private UsernamePasswordAuthenticationToken createAuthToken(User user) {
        AuthenticatedUserPrincipal principal = new AuthenticatedUserPrincipal(
                user.getId(),
                user.getAuthUserId(),
                user.getAuthUserId() + "@campus.edu",
                user.getStatus()
        );
        return new UsernamePasswordAuthenticationToken(principal, "token", List.of(new SimpleGrantedAuthority("ROLE_USER")));
    }

    @Test
    @DisplayName("GET /api/v1/sessions/{id}/call/access — 200 OK for Teacher with isInitiator=true")
    void teacherAccess_Success() throws Exception {
        mockMvc.perform(get("/api/v1/sessions/{id}/call/access", scheduledSession.getId())
                        .with(authentication(createAuthToken(teacher))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.allowed").value(true))
                .andExpect(jsonPath("$.role").value("TEACHER"))
                .andExpect(jsonPath("$.isInitiator").value(true))
                .andExpect(jsonPath("$.partnerId").value(learner.getId().toString()))
                .andExpect(jsonPath("$.partnerName").value("Alice Learner"))
                .andExpect(jsonPath("$.sessionStatus").value("SCHEDULED"));
    }

    @Test
    @DisplayName("GET /api/v1/sessions/{id}/call/access — 200 OK for Learner with isInitiator=false")
    void learnerAccess_Success() throws Exception {
        mockMvc.perform(get("/api/v1/sessions/{id}/call/access", inProgressSession.getId())
                        .with(authentication(createAuthToken(learner))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.allowed").value(true))
                .andExpect(jsonPath("$.role").value("LEARNER"))
                .andExpect(jsonPath("$.isInitiator").value(false))
                .andExpect(jsonPath("$.partnerId").value(teacher.getId().toString()))
                .andExpect(jsonPath("$.partnerName").value("Dr. Teacher"))
                .andExpect(jsonPath("$.sessionStatus").value("IN_PROGRESS"));
    }

    @Test
    @DisplayName("GET /api/v1/sessions/{id}/call/access — 403 Forbidden for Outsider")
    void outsiderAccess_Forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/sessions/{id}/call/access", scheduledSession.getId())
                        .with(authentication(createAuthToken(outsider))))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/v1/sessions/{id}/call/access — 409 Conflict for Completed Session")
    void completedSession_Conflict() throws Exception {
        mockMvc.perform(get("/api/v1/sessions/{id}/call/access", completedSession.getId())
                        .with(authentication(createAuthToken(teacher))))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("GET /api/v1/sessions/{id}/call/access — 409 Conflict for Cancelled Session")
    void cancelledSession_Conflict() throws Exception {
        mockMvc.perform(get("/api/v1/sessions/{id}/call/access", cancelledSession.getId())
                        .with(authentication(createAuthToken(teacher))))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("GET /api/v1/sessions/{id}/call/access — 401 Unauthorized without token")
    void unauthenticated_Unauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/sessions/{id}/call/access", scheduledSession.getId()))
                .andExpect(status().isUnauthorized());
    }
}
