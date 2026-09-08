package com.skillswap.scheduling;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillswap.common.security.AuthenticatedUserPrincipal;
import com.skillswap.exchange.entity.ExchangeRequest;
import com.skillswap.exchange.entity.ExchangeRequestStatus;
import com.skillswap.exchange.repository.ExchangeRequestRepository;
import com.skillswap.scheduling.dto.RescheduleSessionRequest;
import com.skillswap.scheduling.dto.ScheduleSessionRequest;
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

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class SchedulingControllerTest {

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
        teacherUser = userService.getOrCreateUser("auth-teacher-" + UUID.randomUUID(), "Prof Bob", "MIT");
        learnerUser = userService.getOrCreateUser("auth-learner-" + UUID.randomUUID(), "Student Alice", "Harvard");
        bystanderUser = userService.getOrCreateUser("auth-bystander-" + UUID.randomUUID(), "Charlie", "Stanford");

        SkillCategory category = categoryRepository.save(new SkillCategory(null, "Math-" + UUID.randomUUID(), "Math"));
        Skill skill = skillRepository.save(new Skill(null, category, "Calculus-" + UUID.randomUUID(), "Calculus I"));

        ExchangeRequest exchangeRequest = exchangeRequestRepository.save(new ExchangeRequest(
                null,
                learnerUser,
                teacherUser,
                skill,
                "Let's learn calculus",
                ExchangeRequestStatus.ACCEPTED
        ));

        session = sessionRepository.save(new Session(
                null,
                exchangeRequest,
                teacherUser,
                learnerUser,
                skill,
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
    @DisplayName("POST /api/v1/sessions/{id}/schedule sets session schedule")
    void testScheduleSession_Success() throws Exception {
        Instant start = Instant.now().plus(2, ChronoUnit.DAYS);
        Instant end = start.plus(1, ChronoUnit.HOURS);
        ScheduleSessionRequest request = new ScheduleSessionRequest(start, end, "UTC");

        mockMvc.perform(post("/api/v1/sessions/" + session.getId() + "/schedule")
                        .with(authentication(createAuthToken(teacherUser)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId", is(session.getId().toString())))
                .andExpect(jsonPath("$.status", is("SCHEDULED")))
                .andExpect(jsonPath("$.timezone", is("UTC")));
    }

    @Test
    @DisplayName("POST /api/v1/sessions/{id}/reschedule updates schedule and status")
    void testRescheduleSession_Success() throws Exception {
        Instant start = Instant.now().plus(2, ChronoUnit.DAYS);
        Instant end = start.plus(1, ChronoUnit.HOURS);
        ScheduleSessionRequest schedReq = new ScheduleSessionRequest(start, end, "UTC");

        mockMvc.perform(post("/api/v1/sessions/" + session.getId() + "/schedule")
                        .with(authentication(createAuthToken(teacherUser)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(schedReq)))
                .andExpect(status().isOk());

        Instant newStart = Instant.now().plus(4, ChronoUnit.DAYS);
        Instant newEnd = newStart.plus(1, ChronoUnit.HOURS);
        RescheduleSessionRequest reschedReq = new RescheduleSessionRequest(newStart, newEnd, "UTC", "Doctor appointment");

        mockMvc.perform(post("/api/v1/sessions/" + session.getId() + "/reschedule")
                        .with(authentication(createAuthToken(learnerUser)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reschedReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId", is(session.getId().toString())))
                .andExpect(jsonPath("$.status", is("RESCHEDULED")));
    }

    @Test
    @DisplayName("GET /api/v1/sessions/{id}/schedule returns schedule for participant")
    void testGetSchedule_Success() throws Exception {
        Instant start = Instant.now().plus(2, ChronoUnit.DAYS);
        Instant end = start.plus(1, ChronoUnit.HOURS);
        ScheduleSessionRequest request = new ScheduleSessionRequest(start, end, "America/New_York");

        mockMvc.perform(post("/api/v1/sessions/" + session.getId() + "/schedule")
                        .with(authentication(createAuthToken(teacherUser)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/sessions/" + session.getId() + "/schedule")
                        .with(authentication(createAuthToken(learnerUser))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.timezone", is("America/New_York")));
    }

    @Test
    @DisplayName("Schedule fails for unauthorized non-participant")
    void testSchedule_ForbiddenForNonParticipant() throws Exception {
        Instant start = Instant.now().plus(2, ChronoUnit.DAYS);
        Instant end = start.plus(1, ChronoUnit.HOURS);
        ScheduleSessionRequest request = new ScheduleSessionRequest(start, end, "UTC");

        mockMvc.perform(post("/api/v1/sessions/" + session.getId() + "/schedule")
                        .with(authentication(createAuthToken(bystanderUser)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
}
