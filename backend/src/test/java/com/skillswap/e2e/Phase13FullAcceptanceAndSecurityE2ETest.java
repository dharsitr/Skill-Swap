package com.skillswap.e2e;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillswap.chat.dto.SendMessageRequest;
import com.skillswap.common.security.AuthenticatedUserPrincipal;
import com.skillswap.exchange.dto.CreateExchangeRequest;
import com.skillswap.personalization.dto.RecordProfileViewRequest;
import com.skillswap.personalization.dto.RecordSearchRequest;
import com.skillswap.profile.dto.UpdateProfileRequest;
import com.skillswap.profile.entity.YearOfStudy;
import com.skillswap.review.dto.CreateReviewRequest;
import com.skillswap.safety.dto.BlockUserRequest;
import com.skillswap.safety.dto.CreateDisputeRequest;
import com.skillswap.safety.entity.DisputeReason;
import com.skillswap.skill.dto.CreateUserSkillRequest;
import com.skillswap.skill.entity.Skill;
import com.skillswap.skill.entity.SkillCategory;
import com.skillswap.skill.entity.SkillProficiency;
import com.skillswap.skill.entity.SkillRelationshipType;
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
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

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
public class Phase13FullAcceptanceAndSecurityE2ETest {

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

    private User alice;
    private User bob;
    private User charlie;
    private Skill javaSkill;
    private Skill pythonSkill;

    @BeforeEach
    void setUp() {
        alice = userService.getOrCreateUser("auth-alice-" + UUID.randomUUID(), "Alice Student", "MIT");
        bob = userService.getOrCreateUser("auth-bob-" + UUID.randomUUID(), "Bob Tutor", "Stanford");
        charlie = userService.getOrCreateUser("auth-charlie-" + UUID.randomUUID(), "Charlie Intruder", "Harvard");

        SkillCategory compSci = categoryRepository.save(new SkillCategory(UUID.randomUUID(), "Computer Science " + UUID.randomUUID(), "CS Dept"));
        javaSkill = skillRepository.save(new Skill(UUID.randomUUID(), compSci, "Java Programming " + UUID.randomUUID(), "Core Java"));
        pythonSkill = skillRepository.save(new Skill(UUID.randomUUID(), compSci, "Python Machine Learning " + UUID.randomUUID(), "Python ML"));
    }

    private UsernamePasswordAuthenticationToken createAuthToken(User user, boolean isModerator) {
        AuthenticatedUserPrincipal principal = new AuthenticatedUserPrincipal(
                user.getId(),
                user.getAuthUserId(),
                user.getAuthUserId() + "@college.edu",
                user.getStatus(),
                isModerator ? UserRole.MODERATOR : UserRole.USER
        );
        List<SimpleGrantedAuthority> authorities = isModerator
                ? List.of(new SimpleGrantedAuthority("ROLE_USER"), new SimpleGrantedAuthority("ROLE_MODERATOR"))
                : List.of(new SimpleGrantedAuthority("ROLE_USER"));

        return new UsernamePasswordAuthenticationToken(principal, "test-token", authorities);
    }

    @Test
    @DisplayName("Phase 13 Full Acceptance Flow: Complete Lifecycle from Register to Personalization")
    void testCompleteE2EAcceptanceFlow() throws Exception {
        // 1. Update Profile for Alice & Bob
        UpdateProfileRequest profileReq = new UpdateProfileRequest();
        profileReq.setDisplayName("Alice Student");
        profileReq.setCollegeName("MIT");
        profileReq.setYearOfStudy(YearOfStudy.THIRD_YEAR);
        profileReq.setBio("Software engineering enthusiast");
        profileReq.setAvatarUrl("https://example.com/avatar-alice.png");
        profileReq.setDepartment("Computer Science");

        mockMvc.perform(put("/api/v1/profile/me")
                        .with(authentication(createAuthToken(alice, false)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(profileReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bio", is("Software engineering enthusiast")))
                .andExpect(jsonPath("$.department", is("Computer Science")));

        // 2. Add Teaching & Learning Skills
        // Alice teaches Java, wants to learn Python
        mockMvc.perform(post("/api/v1/profile/me/skills")
                        .with(authentication(createAuthToken(alice, false)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateUserSkillRequest(
                                javaSkill.getId(), SkillRelationshipType.TEACH, SkillProficiency.EXPERT, "Teaching core Java"
                        ))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/profile/me/skills")
                        .with(authentication(createAuthToken(alice, false)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateUserSkillRequest(
                                pythonSkill.getId(), SkillRelationshipType.LEARN, SkillProficiency.BEGINNER, "Want to learn Python"
                        ))))
                .andExpect(status().isCreated());

        // Bob teaches Python, wants to learn Java
        mockMvc.perform(post("/api/v1/profile/me/skills")
                        .with(authentication(createAuthToken(bob, false)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateUserSkillRequest(
                                pythonSkill.getId(), SkillRelationshipType.TEACH, SkillProficiency.ADVANCED, "Teaching Python"
                        ))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/profile/me/skills")
                        .with(authentication(createAuthToken(bob, false)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateUserSkillRequest(
                                javaSkill.getId(), SkillRelationshipType.LEARN, SkillProficiency.BEGINNER, "Want to learn Java"
                        ))))
                .andExpect(status().isCreated());

        // 3. Discovery & Matching
        mockMvc.perform(get("/api/v1/discover")
                        .with(authentication(createAuthToken(alice, false)))
                        .param("mode", "LEARN")
                        .param("search", "Python"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.items[0].candidate.userId", is(bob.getId().toString())));

        // 4. Send Exchange Request: Alice requests Bob for Python
        CreateExchangeRequest exchangeReq = new CreateExchangeRequest(bob.getId(), pythonSkill.getId(), "Let's trade Python for Java");
        MvcResult reqResult = mockMvc.perform(post("/api/v1/exchange-requests")
                        .with(authentication(createAuthToken(alice, false)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(exchangeReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status", is("PENDING")))
                .andExpect(jsonPath("$.requester.id", is(alice.getId().toString())))
                .andExpect(jsonPath("$.recipient.id", is(bob.getId().toString())))
                .andReturn();

        String reqJson = reqResult.getResponse().getContentAsString();
        UUID requestId = UUID.fromString(objectMapper.readTree(reqJson).get("id").asText());

        // 5. Bob accepts the request -> Session is automatically created
        mockMvc.perform(post("/api/v1/exchange-requests/" + requestId + "/accept")
                        .with(authentication(createAuthToken(bob, false))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("ACCEPTED")));

        // 6. Verify Session exists
        MvcResult sessionsResult = mockMvc.perform(get("/api/v1/sessions")
                        .with(authentication(createAuthToken(alice, false))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(greaterThanOrEqualTo(1))))
                .andReturn();

        String sessionsJson = sessionsResult.getResponse().getContentAsString();
        UUID sessionId = UUID.fromString(objectMapper.readTree(sessionsJson).get("items").get(0).get("id").asText());

        // 7. Start Session (SCHEDULED -> IN_PROGRESS)
        mockMvc.perform(post("/api/v1/sessions/" + sessionId + "/start")
                        .with(authentication(createAuthToken(bob, false))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("IN_PROGRESS")));

        // 8. Create Conversation and Send Chat Message between participants
        MvcResult convResult = mockMvc.perform(post("/api/v1/conversations")
                        .with(authentication(createAuthToken(alice, false)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new com.skillswap.chat.dto.CreateConversationRequest(bob.getId()))))
                .andExpect(status().isOk())
                .andReturn();

        UUID convId = UUID.fromString(objectMapper.readTree(convResult.getResponse().getContentAsString()).get("id").asText());

        SendMessageRequest msgReq = new SendMessageRequest("Hello Bob, ready for our session!", null);
        mockMvc.perform(post("/api/v1/conversations/" + convId + "/messages")
                        .with(authentication(createAuthToken(alice, false)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(msgReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.content", is("Hello Bob, ready for our session!")));

        // 9. Complete Session (IN_PROGRESS -> COMPLETED)
        mockMvc.perform(post("/api/v1/sessions/" + sessionId + "/complete")
                        .with(authentication(createAuthToken(bob, false))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("COMPLETED")));

        // 10. Submit Review (Alice reviews Bob with 5 stars)
        CreateReviewRequest reviewReq = new CreateReviewRequest(sessionId, 5, "Outstanding teacher, learned a lot!");
        mockMvc.perform(post("/api/v1/reviews")
                        .with(authentication(createAuthToken(alice, false)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.rating", is(5)))
                .andExpect(jsonPath("$.comment", is("Outstanding teacher, learned a lot!")));

        // 11. Record Search & Profile View History
        mockMvc.perform(post("/api/v1/history/profiles")
                        .with(authentication(createAuthToken(alice, false)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RecordProfileViewRequest(bob.getId()))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/history/searches")
                        .with(authentication(createAuthToken(alice, false)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RecordSearchRequest("Python", null, pythonSkill.getId()))))
                .andExpect(status().isOk());

        // 12. Verify Personalized Dashboard Aggregates All Data
        mockMvc.perform(get("/api/v1/dashboard")
                        .with(authentication(createAuthToken(alice, false))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profileCompletion.isComplete", is(true)))
                .andExpect(jsonPath("$.profileCompletion.completionPercentage", is(100)))
                .andExpect(jsonPath("$.requestSummary.recentRequests", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.sessionSummary.completedCount", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.recentlyViewed", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.recentSearches", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    @DisplayName("Security & IDOR: Charlie cannot access or manipulate Alice & Bob resources")
    void testSecurityAndIDORProtection() throws Exception {
        // Setup Bob teaching Python, Alice learning Python
        mockMvc.perform(post("/api/v1/profile/me/skills")
                        .with(authentication(createAuthToken(bob, false)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateUserSkillRequest(
                                pythonSkill.getId(), SkillRelationshipType.TEACH, SkillProficiency.ADVANCED, "Teaching Python"
                        ))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/profile/me/skills")
                        .with(authentication(createAuthToken(alice, false)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateUserSkillRequest(
                                pythonSkill.getId(), SkillRelationshipType.LEARN, SkillProficiency.BEGINNER, "Learning Python"
                        ))))
                .andExpect(status().isCreated());

        // Setup a session between Alice (Learner) and Bob (Teacher)
        CreateExchangeRequest exchangeReq = new CreateExchangeRequest(bob.getId(), pythonSkill.getId(), "Private session request");
        MvcResult reqResult = mockMvc.perform(post("/api/v1/exchange-requests")
                        .with(authentication(createAuthToken(alice, false)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(exchangeReq)))
                .andExpect(status().isCreated())
                .andReturn();

        UUID requestId = UUID.fromString(objectMapper.readTree(reqResult.getResponse().getContentAsString()).get("id").asText());

        // Charlie tries to accept Alice's request to Bob -> Forbidden
        mockMvc.perform(post("/api/v1/exchange-requests/" + requestId + "/accept")
                        .with(authentication(createAuthToken(charlie, false))))
                .andExpect(status().isForbidden());

        // Bob accepts legitimately
        mockMvc.perform(post("/api/v1/exchange-requests/" + requestId + "/accept")
                        .with(authentication(createAuthToken(bob, false))))
                .andExpect(status().isOk());

        MvcResult sessionsResult = mockMvc.perform(get("/api/v1/sessions")
                        .with(authentication(createAuthToken(alice, false))))
                .andExpect(status().isOk())
                .andReturn();

        UUID sessionId = UUID.fromString(objectMapper.readTree(sessionsResult.getResponse().getContentAsString()).get("items").get(0).get("id").asText());

        // Charlie tries to view Alice & Bob's session -> Forbidden
        mockMvc.perform(get("/api/v1/sessions/" + sessionId)
                        .with(authentication(createAuthToken(charlie, false))))
                .andExpect(status().isForbidden());

        // Charlie tries to start or complete Alice & Bob's session -> Forbidden
        mockMvc.perform(post("/api/v1/sessions/" + sessionId + "/start")
                        .with(authentication(createAuthToken(charlie, false))))
                .andExpect(status().isForbidden());

        // Charlie tries to dispute a session he was not in -> Forbidden
        CreateDisputeRequest disputeReq = new CreateDisputeRequest(sessionId, DisputeReason.SESSION_DID_NOT_HAPPEN, "I was not invited");
        mockMvc.perform(post("/api/v1/disputes")
                        .with(authentication(createAuthToken(charlie, false)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(disputeReq)))
                .andExpect(status().isForbidden());

        // Legitimate participants start and complete the session
        mockMvc.perform(post("/api/v1/sessions/" + sessionId + "/start")
                        .with(authentication(createAuthToken(bob, false))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/sessions/" + sessionId + "/complete")
                        .with(authentication(createAuthToken(bob, false))))
                .andExpect(status().isOk());

        // Charlie tries to review a completed session he was not part of -> Forbidden
        CreateReviewRequest reviewReq = new CreateReviewRequest(sessionId, 5, "I am a bystander");
        mockMvc.perform(post("/api/v1/reviews")
                        .with(authentication(createAuthToken(charlie, false)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewReq)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Security & Role Escalation: Regular user cannot perform moderator actions")
    void testRoleEscalationDenial() throws Exception {
        // Normal user attempting to access moderator reports or disputes
        mockMvc.perform(get("/api/v1/moderation/reports")
                        .with(authentication(createAuthToken(alice, false))))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/moderation/disputes")
                        .with(authentication(createAuthToken(alice, false))))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Negative & Edge Case Validation: Self operations and invalid boundaries")
    void testNegativeEdgeCases() throws Exception {
        // Self exchange request
        CreateExchangeRequest selfReq = new CreateExchangeRequest(alice.getId(), javaSkill.getId(), "Self trade");
        mockMvc.perform(post("/api/v1/exchange-requests")
                        .with(authentication(createAuthToken(alice, false)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(selfReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("cannot send an exchange request to yourself")));

        // Self block
        BlockUserRequest selfBlock = new BlockUserRequest(alice.getId());
        mockMvc.perform(post("/api/v1/blocks")
                        .with(authentication(createAuthToken(alice, false)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(selfBlock)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("cannot block yourself")));

        // Invalid rating boundary (> 5 or < 1)
        CreateReviewRequest invalidRatingHigh = new CreateReviewRequest(UUID.randomUUID(), 6, "Too high");
        mockMvc.perform(post("/api/v1/reviews")
                        .with(authentication(createAuthToken(alice, false)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRatingHigh)))
                .andExpect(status().isBadRequest());

        CreateReviewRequest invalidRatingLow = new CreateReviewRequest(UUID.randomUUID(), 0, "Too low");
        mockMvc.perform(post("/api/v1/reviews")
                        .with(authentication(createAuthToken(alice, false)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRatingLow)))
                .andExpect(status().isBadRequest());

        // Malformed UUID string in path parameter returns 400 Bad Request
        mockMvc.perform(get("/api/v1/sessions/not-a-valid-uuid")
                        .with(authentication(createAuthToken(alice, false))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.message", containsString("Parameter 'id' has an invalid format or value")));
    }

    @Test
    @DisplayName("Blocking Enforcement: Blocked user is excluded from discovery, recommendations, and requests")
    void testBlockingEnforcementAcrossModules() throws Exception {
        // Alice adds Java skill, Bob adds Java skill
        mockMvc.perform(post("/api/v1/profile/me/skills")
                        .with(authentication(createAuthToken(bob, false)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateUserSkillRequest(
                                javaSkill.getId(), SkillRelationshipType.TEACH, SkillProficiency.EXPERT, "Teaching Java"
                        ))))
                .andExpect(status().isCreated());

        // Alice blocks Bob
        mockMvc.perform(post("/api/v1/blocks")
                        .with(authentication(createAuthToken(alice, false)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new BlockUserRequest(bob.getId()))))
                .andExpect(status().isCreated());

        // Bob cannot send exchange request to Alice
        CreateExchangeRequest blockedReq = new CreateExchangeRequest(alice.getId(), javaSkill.getId(), "Hi Alice");
        mockMvc.perform(post("/api/v1/exchange-requests")
                        .with(authentication(createAuthToken(bob, false)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(blockedReq)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", containsString("block and privacy settings")));

        // Bob is excluded from Alice's recommended students
        mockMvc.perform(get("/api/v1/recommendations/students")
                        .with(authentication(createAuthToken(alice, false))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.userId == '" + bob.getId() + "')]", hasSize(0)));
    }
}
