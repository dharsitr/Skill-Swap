package com.skillswap.review;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillswap.common.security.AuthenticatedUserPrincipal;
import com.skillswap.exchange.entity.ExchangeRequest;
import com.skillswap.exchange.entity.ExchangeRequestStatus;
import com.skillswap.exchange.repository.ExchangeRequestRepository;
import com.skillswap.review.dto.CreateReviewRequest;
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
class ReviewControllerTest {

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
    private Session completedSession;
    private Session scheduledSession;

    @BeforeEach
    void setUp() {
        teacherUser = userService.getOrCreateUser("auth-teacher-" + UUID.randomUUID(), "Instructor Alice", "MIT");
        learnerUser = userService.getOrCreateUser("auth-learner-" + UUID.randomUUID(), "Student Bob", "Harvard");
        bystanderUser = userService.getOrCreateUser("auth-bystander-" + UUID.randomUUID(), "Charlie Bystander", "Stanford");

        SkillCategory category = categoryRepository.save(new SkillCategory(null, "Programming-" + UUID.randomUUID(), "Code"));
        Skill skill = skillRepository.save(new Skill(null, category, "Rust-" + UUID.randomUUID(), "Rust Programming"));

        ExchangeRequest req1 = exchangeRequestRepository.save(new ExchangeRequest(
                null, learnerUser, teacherUser, skill, "Learn rust", ExchangeRequestStatus.ACCEPTED));
        completedSession = sessionRepository.save(new Session(
                null, req1, teacherUser, learnerUser, skill, SessionStatus.COMPLETED));

        ExchangeRequest req2 = exchangeRequestRepository.save(new ExchangeRequest(
                null, learnerUser, teacherUser, skill, "Learn rust 2", ExchangeRequestStatus.ACCEPTED));
        scheduledSession = sessionRepository.save(new Session(
                null, req2, teacherUser, learnerUser, skill, SessionStatus.SCHEDULED));
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
    @DisplayName("Learner successfully submits 5-star review for completed session")
    void testCreateReview_Success() throws Exception {
        CreateReviewRequest request = new CreateReviewRequest(completedSession.getId(), 5, "Awesome teacher, learned a lot!");

        mockMvc.perform(post("/api/v1/reviews")
                        .with(authentication(createAuthToken(learnerUser)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.sessionId").value(completedSession.getId().toString()))
                .andExpect(jsonPath("$.reviewerId").value(learnerUser.getId().toString()))
                .andExpect(jsonPath("$.revieweeId").value(teacherUser.getId().toString()))
                .andExpect(jsonPath("$.rating").value(5))
                .andExpect(jsonPath("$.comment").value("Awesome teacher, learned a lot!"));
    }

    @Test
    @DisplayName("Reject review if session is not COMPLETED")
    void testCreateReview_IncompleteSession_Fails() throws Exception {
        CreateReviewRequest request = new CreateReviewRequest(scheduledSession.getId(), 4, "Good session");

        mockMvc.perform(post("/api/v1/reviews")
                        .with(authentication(createAuthToken(learnerUser)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("COMPLETED")));
    }

    @Test
    @DisplayName("Reject review from non-participant")
    void testCreateReview_NonParticipant_Forbidden() throws Exception {
        CreateReviewRequest request = new CreateReviewRequest(completedSession.getId(), 5, "Fake review");

        mockMvc.perform(post("/api/v1/reviews")
                        .with(authentication(createAuthToken(bystanderUser)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Reject duplicate review for the same session")
    void testCreateReview_Duplicate_Conflict() throws Exception {
        CreateReviewRequest request = new CreateReviewRequest(completedSession.getId(), 5, "First review");

        mockMvc.perform(post("/api/v1/reviews")
                        .with(authentication(createAuthToken(learnerUser)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Attempt second review
        mockMvc.perform(post("/api/v1/reviews")
                        .with(authentication(createAuthToken(learnerUser)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(containsString("already submitted a review")));
    }

    @Test
    @DisplayName("Reject invalid rating values (0 and 6)")
    void testCreateReview_InvalidRatings() throws Exception {
        CreateReviewRequest req0 = new CreateReviewRequest(completedSession.getId(), 0, "Zero star");
        mockMvc.perform(post("/api/v1/reviews")
                        .with(authentication(createAuthToken(learnerUser)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req0)))
                .andExpect(status().isBadRequest());

        CreateReviewRequest req6 = new CreateReviewRequest(completedSession.getId(), 6, "Six star");
        mockMvc.perform(post("/api/v1/reviews")
                        .with(authentication(createAuthToken(learnerUser)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req6)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Get reviews and rating summary for a user profile")
    void testGetRatingSummary_AndReviews() throws Exception {
        // Teacher receives 5-star review from learner
        CreateReviewRequest req1 = new CreateReviewRequest(completedSession.getId(), 5, "Great lesson");
        mockMvc.perform(post("/api/v1/reviews")
                        .with(authentication(createAuthToken(learnerUser)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isCreated());

        // Check rating summary for teacher
        mockMvc.perform(get("/api/v1/reviews/summary/" + teacherUser.getId())
                        .with(authentication(createAuthToken(learnerUser))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(teacherUser.getId().toString()))
                .andExpect(jsonPath("$.averageRating").value(5.0))
                .andExpect(jsonPath("$.reviewCount").value(1));

        // Check user with no reviews returns null average
        mockMvc.perform(get("/api/v1/reviews/summary/" + bystanderUser.getId())
                        .with(authentication(createAuthToken(learnerUser))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.averageRating").value(nullValue()))
                .andExpect(jsonPath("$.reviewCount").value(0));

        // Check list of reviews for teacher profile
        mockMvc.perform(get("/api/v1/reviews/profile/" + teacherUser.getId())
                        .with(authentication(createAuthToken(learnerUser))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].rating").value(5))
                .andExpect(jsonPath("$.items[0].reviewerName").value("Student Bob"));
    }

    @Test
    @DisplayName("Check session review status for participant")
    void testGetSessionReviewStatus() throws Exception {
        // Before review
        mockMvc.perform(get("/api/v1/reviews/session/" + completedSession.getId() + "/status")
                        .with(authentication(createAuthToken(learnerUser))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.eligible").value(true))
                .andExpect(jsonPath("$.hasReviewed").value(false))
                .andExpect(jsonPath("$.review").value(nullValue()));

        // Submit review
        CreateReviewRequest req = new CreateReviewRequest(completedSession.getId(), 4, "Helpful");
        mockMvc.perform(post("/api/v1/reviews")
                        .with(authentication(createAuthToken(learnerUser)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        // After review
        mockMvc.perform(get("/api/v1/reviews/session/" + completedSession.getId() + "/status")
                        .with(authentication(createAuthToken(learnerUser))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.eligible").value(true))
                .andExpect(jsonPath("$.hasReviewed").value(true))
                .andExpect(jsonPath("$.review.rating").value(4));
    }
}
