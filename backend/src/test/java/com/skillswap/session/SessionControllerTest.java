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

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class SessionControllerTest {

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

    private User teacherUser;
    private User learnerUser;
    private User bystanderUser;
    private Skill pythonSkill;
    private ExchangeRequest exchangeRequest;
    private Session session;

    @BeforeEach
    void setUp() {
        teacherUser = userService.getOrCreateUser("auth-teacher-" + UUID.randomUUID(), "Prof Bob", "MIT");
        learnerUser = userService.getOrCreateUser("auth-learner-" + UUID.randomUUID(), "Student Alice", "Harvard");
        bystanderUser = userService.getOrCreateUser("auth-bystander-" + UUID.randomUUID(), "Charlie", "Stanford");

        SkillCategory category = categoryRepository.save(new SkillCategory(null, "Programming-" + UUID.randomUUID(), "Coding"));
        pythonSkill = skillRepository.save(new Skill(null, category, "Python-" + UUID.randomUUID(), "Python Lang"));

        exchangeRequest = exchangeRequestRepository.save(new ExchangeRequest(
                null,
                learnerUser,
                teacherUser,
                pythonSkill,
                "Let's learn python",
                ExchangeRequestStatus.ACCEPTED
        ));

        session = sessionRepository.save(new Session(
                null,
                exchangeRequest,
                teacherUser,
                learnerUser,
                pythonSkill,
                SessionStatus.SCHEDULED
        ));
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
    @DisplayName("Should list sessions for participant")
    void testGetMySessions_Success() throws Exception {
        mockMvc.perform(get("/api/v1/sessions")
                        .with(authentication(createAuthToken(learnerUser))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].id").value(session.getId().toString()))
                .andExpect(jsonPath("$.items[0].teacher.displayName").value("Prof Bob"))
                .andExpect(jsonPath("$.items[0].learner.displayName").value("Student Alice"))
                .andExpect(jsonPath("$.items[0].status").value("SCHEDULED"));
    }

    @Test
    @DisplayName("Should get session by ID for participant")
    void testGetSession_Success() throws Exception {
        mockMvc.perform(get("/api/v1/sessions/" + session.getId())
                        .with(authentication(createAuthToken(teacherUser))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(session.getId().toString()))
                .andExpect(jsonPath("$.status").value("SCHEDULED"));
    }

    @Test
    @DisplayName("Should return 403 Forbidden for non-participant trying to view session")
    void testGetSession_NonParticipant_Forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/sessions/" + session.getId())
                        .with(authentication(createAuthToken(bystanderUser))))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Should transition session from SCHEDULED to IN_PROGRESS")
    void testStartSession_Success() throws Exception {
        mockMvc.perform(post("/api/v1/sessions/" + session.getId() + "/start")
                        .with(authentication(createAuthToken(learnerUser))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));
    }

    @Test
    @DisplayName("Should complete session from IN_PROGRESS to COMPLETED")
    void testCompleteSession_Success() throws Exception {
        // Start first
        session.setStatus(SessionStatus.IN_PROGRESS);
        sessionRepository.save(session);

        mockMvc.perform(post("/api/v1/sessions/" + session.getId() + "/complete")
                        .with(authentication(createAuthToken(teacherUser))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));
    }

    @Test
    @DisplayName("Should reject completing SCHEDULED session directly with 409 Conflict")
    void testCompleteSession_InvalidTransition_Conflict() throws Exception {
        mockMvc.perform(post("/api/v1/sessions/" + session.getId() + "/complete")
                        .with(authentication(createAuthToken(teacherUser))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("in-progress sessions can be completed")));
    }

    @Test
    @DisplayName("Should cancel SCHEDULED session to CANCELLED")
    void testCancelSession_Success() throws Exception {
        mockMvc.perform(post("/api/v1/sessions/" + session.getId() + "/cancel")
                        .with(authentication(createAuthToken(learnerUser))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }
}
