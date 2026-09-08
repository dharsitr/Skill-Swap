package com.skillswap.safety;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillswap.common.security.AuthenticatedUserPrincipal;
import com.skillswap.exchange.entity.ExchangeRequest;
import com.skillswap.exchange.entity.ExchangeRequestStatus;
import com.skillswap.exchange.repository.ExchangeRequestRepository;
import com.skillswap.safety.dto.CreateDisputeRequest;
import com.skillswap.safety.entity.DisputeReason;
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
class DisputeControllerTest {

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

    private User teacherUser;
    private User learnerUser;
    private User bystanderUser;
    private Session session;

    @BeforeEach
    void setUp() {
        teacherUser = userService.getOrCreateUser("auth-tea-" + UUID.randomUUID(), "Teacher Tom", "MIT");
        learnerUser = userService.getOrCreateUser("auth-lea-" + UUID.randomUUID(), "Learner Leo", "Harvard");
        bystanderUser = userService.getOrCreateUser("auth-bys-" + UUID.randomUUID(), "Bystander Ben", "Stanford");

        SkillCategory cat = categoryRepository.save(new SkillCategory(null, "Design-" + UUID.randomUUID(), "UI"));
        Skill skill = skillRepository.save(new Skill(null, cat, "Figma-" + UUID.randomUUID(), "Figma UI"));

        ExchangeRequest req = exchangeRequestRepository.save(new ExchangeRequest(
                null, learnerUser, teacherUser, skill, "Learn figma", ExchangeRequestStatus.ACCEPTED));
        session = sessionRepository.save(new Session(
                null, req, teacherUser, learnerUser, skill, SessionStatus.COMPLETED));
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
    @DisplayName("Participant raises a dispute for their session")
    void testCreateDispute_Success() throws Exception {
        CreateDisputeRequest request = new CreateDisputeRequest(
                session.getId(),
                DisputeReason.SESSION_DID_NOT_HAPPEN,
                "Instructor did not show up for scheduled call"
        );

        mockMvc.perform(post("/api/v1/disputes")
                        .with(authentication(createAuthToken(learnerUser)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.sessionId").value(session.getId().toString()))
                .andExpect(jsonPath("$.reason").value("SESSION_DID_NOT_HAPPEN"))
                .andExpect(jsonPath("$.status").value("OPEN"));

        // Retrieve user disputes
        mockMvc.perform(get("/api/v1/disputes/my")
                        .with(authentication(createAuthToken(learnerUser))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].reason").value("SESSION_DID_NOT_HAPPEN"));
    }

    @Test
    @DisplayName("Reject dispute from non-participant")
    void testCreateDispute_NonParticipant_Forbidden() throws Exception {
        CreateDisputeRequest request = new CreateDisputeRequest(
                session.getId(),
                DisputeReason.TECHNICAL_ISSUE,
                "Fake dispute"
        );

        mockMvc.perform(post("/api/v1/disputes")
                        .with(authentication(createAuthToken(bystanderUser)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Reject duplicate dispute for the same session")
    void testCreateDispute_Duplicate_Conflict() throws Exception {
        CreateDisputeRequest request = new CreateDisputeRequest(
                session.getId(),
                DisputeReason.SESSION_INCOMPLETE,
                "First dispute"
        );

        mockMvc.perform(post("/api/v1/disputes")
                        .with(authentication(createAuthToken(learnerUser)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Second dispute
        mockMvc.perform(post("/api/v1/disputes")
                        .with(authentication(createAuthToken(learnerUser)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }
}
