package com.skillswap.personalization;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillswap.common.security.AuthenticatedUserPrincipal;
import com.skillswap.personalization.dto.RecordProfileViewRequest;
import com.skillswap.personalization.dto.RecordSearchRequest;
import com.skillswap.personalization.service.ProfileCompletionService;
import com.skillswap.personalization.service.RecommendationService;
import com.skillswap.profile.entity.Profile;
import com.skillswap.profile.repository.ProfileRepository;
import com.skillswap.safety.service.UserBlockService;
import com.skillswap.skill.dto.CreateUserSkillRequest;
import com.skillswap.skill.entity.Skill;
import com.skillswap.skill.entity.SkillCategory;
import com.skillswap.skill.entity.SkillProficiency;
import com.skillswap.skill.entity.SkillRelationshipType;
import com.skillswap.skill.repository.SkillCategoryRepository;
import com.skillswap.skill.repository.SkillRepository;
import com.skillswap.skill.service.UserSkillService;
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
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class PersonalizationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserService userService;

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private SkillCategoryRepository categoryRepository;

    @Autowired
    private UserSkillService userSkillService;

    @Autowired
    private UserBlockService userBlockService;

    @Autowired
    private ProfileCompletionService profileCompletionService;

    @Autowired
    private RecommendationService recommendationService;

    private User alice;
    private User bob;
    private Skill pythonSkill;
    private Skill reactSkill;

    @BeforeEach
    void setUp() {
        alice = userService.getOrCreateUser("auth-alice-" + UUID.randomUUID(), "Alice Student", "MIT");
        bob = userService.getOrCreateUser("auth-bob-" + UUID.randomUUID(), "Bob Tutor", "MIT");

        SkillCategory techCat = categoryRepository.findAll().stream().findFirst().orElseGet(() ->
                categoryRepository.save(new SkillCategory(UUID.randomUUID(), "Technology", "Tech skills")));

        pythonSkill = skillRepository.save(new Skill(UUID.randomUUID(), techCat, "Python Programming " + UUID.randomUUID(), "Python coding"));
        reactSkill = skillRepository.save(new Skill(UUID.randomUUID(), techCat, "React Frontend " + UUID.randomUUID(), "React development"));
    }

    private UsernamePasswordAuthenticationToken createAuthToken(User user) {
        AuthenticatedUserPrincipal principal = new AuthenticatedUserPrincipal(
                user.getId(),
                user.getAuthUserId(),
                user.getAuthUserId() + "@college.edu",
                user.getStatus()
        );
        return new UsernamePasswordAuthenticationToken(principal, null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
    }

    @Test
    @DisplayName("Calculate profile completion score accurately")
    void testProfileCompletion() {
        var completionInitial = profileCompletionService.calculateCompletion(alice.getId());
        assertFalse(completionInitial.isComplete());
        assertTrue(completionInitial.completionPercentage() >= 30);

        // Update profile with bio, avatar, department
        Profile profile = profileRepository.findByUserId(alice.getId()).orElseThrow();
        profile.setBio("Passionate developer and learner");
        profile.setAvatarUrl("https://example.com/avatar.jpg");
        profile.setDepartment("Computer Science");
        profileRepository.save(profile);

        // Add skills
        userSkillService.addUserSkill(alice.getId(), new CreateUserSkillRequest(pythonSkill.getId(), SkillRelationshipType.TEACH, SkillProficiency.EXPERT, "Teaching Python"));
        userSkillService.addUserSkill(alice.getId(), new CreateUserSkillRequest(reactSkill.getId(), SkillRelationshipType.LEARN, SkillProficiency.BEGINNER, "Learning React"));

        var completionAfter = profileCompletionService.calculateCompletion(alice.getId());
        assertEquals(100, completionAfter.completionPercentage());
        assertTrue(completionAfter.isComplete());
        assertTrue(completionAfter.missingFields().isEmpty());
    }

    @Test
    @DisplayName("Record, retrieve, deduplicate, and clear profile viewing history")
    void testProfileViewingHistory() throws Exception {
        // Record profile view of Bob by Alice
        RecordProfileViewRequest request = new RecordProfileViewRequest(bob.getId());
        mockMvc.perform(post("/api/v1/history/profiles")
                        .with(authentication(createAuthToken(alice)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        // Repeated view updates timestamp and deduplicates
        mockMvc.perform(post("/api/v1/history/profiles")
                        .with(authentication(createAuthToken(alice)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        // Get viewing history
        mockMvc.perform(get("/api/v1/history/profiles")
                        .with(authentication(createAuthToken(alice))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].userId").value(bob.getId().toString()));

        // Self views are ignored
        RecordProfileViewRequest selfRequest = new RecordProfileViewRequest(alice.getId());
        mockMvc.perform(post("/api/v1/history/profiles")
                        .with(authentication(createAuthToken(alice)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(selfRequest)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/history/profiles")
                        .with(authentication(createAuthToken(alice))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));

        // Clear history
        mockMvc.perform(delete("/api/v1/history/profiles")
                        .with(authentication(createAuthToken(alice))))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/history/profiles")
                        .with(authentication(createAuthToken(alice))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("Record, retrieve, and clear search history")
    void testSearchHistory() throws Exception {
        RecordSearchRequest searchReq = new RecordSearchRequest("Python", null, pythonSkill.getId());
        mockMvc.perform(post("/api/v1/history/searches")
                        .with(authentication(createAuthToken(alice)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(searchReq)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/history/searches")
                        .with(authentication(createAuthToken(alice))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].query").value("Python"))
                .andExpect(jsonPath("$[0].skillId").value(pythonSkill.getId().toString()));

        mockMvc.perform(delete("/api/v1/history/searches")
                        .with(authentication(createAuthToken(alice))))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/history/searches")
                        .with(authentication(createAuthToken(alice))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("Recommended students exclude self and blocked users")
    void testStudentRecommendationsExclusions() throws Exception {
        // Alice wants to learn React, Bob teaches React
        userSkillService.addUserSkill(alice.getId(), new CreateUserSkillRequest(reactSkill.getId(), SkillRelationshipType.LEARN, SkillProficiency.BEGINNER, "Learn React"));
        userSkillService.addUserSkill(bob.getId(), new CreateUserSkillRequest(reactSkill.getId(), SkillRelationshipType.TEACH, SkillProficiency.EXPERT, "Teach React"));

        var recs = recommendationService.getRecommendedStudents(alice.getId(), 10);
        assertTrue(recs.stream().anyMatch(r -> r.userId().equals(bob.getId())));
        assertFalse(recs.stream().anyMatch(r -> r.userId().equals(alice.getId())));

        // Alice blocks Bob
        userBlockService.blockUser(alice.getId(), bob.getId());

        // Now Bob must NOT appear in recommendations
        var recsAfterBlock = recommendationService.getRecommendedStudents(alice.getId(), 10);
        assertFalse(recsAfterBlock.stream().anyMatch(r -> r.userId().equals(bob.getId())));
    }

    @Test
    @DisplayName("Skill recommendations exclude skills already owned by user")
    void testSkillRecommendations() throws Exception {
        userSkillService.addUserSkill(alice.getId(), new CreateUserSkillRequest(pythonSkill.getId(), SkillRelationshipType.TEACH, SkillProficiency.EXPERT, "Teach Python"));

        var recs = recommendationService.getRecommendedSkills(alice.getId(), 10);
        assertFalse(recs.stream().anyMatch(s -> s.id().equals(pythonSkill.getId())));
        assertTrue(recs.stream().anyMatch(s -> s.id().equals(reactSkill.getId())));
    }

    @Test
    @DisplayName("GET /api/v1/dashboard aggregated endpoint returns complete summary")
    void testDashboardEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/dashboard")
                        .with(authentication(createAuthToken(alice))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profileCompletion.completionPercentage").isNumber())
                .andExpect(jsonPath("$.recommendedStudents").isArray())
                .andExpect(jsonPath("$.recommendedSkills").isArray())
                .andExpect(jsonPath("$.requestSummary").isMap())
                .andExpect(jsonPath("$.sessionSummary").isMap())
                .andExpect(jsonPath("$.recentActivity").isArray())
                .andExpect(jsonPath("$.notificationSummary.unreadCount").isNumber())
                .andExpect(jsonPath("$.recentlyViewed").isArray())
                .andExpect(jsonPath("$.recentSearches").isArray());
    }

    @Test
    @DisplayName("GET /api/v1/activity/recent returns meaningful user events")
    void testRecentActivity() throws Exception {
        userSkillService.addUserSkill(alice.getId(), new CreateUserSkillRequest(pythonSkill.getId(), SkillRelationshipType.TEACH, SkillProficiency.EXPERT, "Teach Python"));

        mockMvc.perform(get("/api/v1/activity/recent")
                        .with(authentication(createAuthToken(alice))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].activityType").value("SKILL_ADDED"));
    }
}
