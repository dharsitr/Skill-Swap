package com.skillswap.discovery;

import com.skillswap.common.security.AuthenticatedUserPrincipal;
import com.skillswap.skill.entity.Skill;
import com.skillswap.skill.entity.SkillCategory;
import com.skillswap.skill.entity.SkillProficiency;
import com.skillswap.skill.entity.SkillRelationshipType;
import com.skillswap.skill.entity.UserSkill;
import com.skillswap.skill.repository.SkillCategoryRepository;
import com.skillswap.skill.repository.SkillRepository;
import com.skillswap.skill.repository.UserSkillRepository;
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
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class DiscoveryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserService userService;

    @Autowired
    private SkillCategoryRepository categoryRepository;

    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private UserSkillRepository userSkillRepository;

    private User currentUser;
    private User candidateAlice;
    private User candidateBob;
    private Skill pythonSkill;
    private Skill figmaSkill;
    private SkillCategory progCat;

    private UsernamePasswordAuthenticationToken createAuthToken(User user) {
        AuthenticatedUserPrincipal principal = new AuthenticatedUserPrincipal(
                user.getId(),
                user.getAuthUserId(),
                "test@college.edu",
                user.getStatus()
        );

        return new UsernamePasswordAuthenticationToken(
                principal,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
    }

    @BeforeEach
    void setUp() {
        progCat = categoryRepository.findByNameIgnoreCase("Programming")
                .orElseGet(() -> categoryRepository.save(new SkillCategory(null, "Programming", "Programming skills")));

        SkillCategory designCat = categoryRepository.findByNameIgnoreCase("Design")
                .orElseGet(() -> categoryRepository.save(new SkillCategory(null, "Design", "Design & UI skills")));

        pythonSkill = skillRepository.findByNameIgnoreCase("Python")
                .orElseGet(() -> skillRepository.save(new Skill(null, progCat, "Python", "Python Language")));

        figmaSkill = skillRepository.findByNameIgnoreCase("Figma")
                .orElseGet(() -> skillRepository.save(new Skill(null, designCat, "Figma", "UI Design tool")));

        currentUser = userService.getOrCreateUser("auth-curr-" + UUID.randomUUID(), "Current User", "MIT");
        candidateAlice = userService.getOrCreateUser("auth-alice-" + UUID.randomUUID(), "Alice Smith", "Stanford");
        candidateBob = userService.getOrCreateUser("auth-bob-" + UUID.randomUUID(), "Bob Johnson", "Harvard");

        // Current User wants to LEARN Python, teaches Figma
        userSkillRepository.save(new UserSkill(null, currentUser, pythonSkill, SkillRelationshipType.LEARN, SkillProficiency.BEGINNER, "Learn Python"));
        userSkillRepository.save(new UserSkill(null, currentUser, figmaSkill, SkillRelationshipType.TEACH, SkillProficiency.ADVANCED, "Teach Figma"));

        // Alice TEACHES Python (Advanced), wants to LEARN Figma (Beginner)
        userSkillRepository.save(new UserSkill(null, candidateAlice, pythonSkill, SkillRelationshipType.TEACH, SkillProficiency.ADVANCED, "Teach Python"));
        userSkillRepository.save(new UserSkill(null, candidateAlice, figmaSkill, SkillRelationshipType.LEARN, SkillProficiency.BEGINNER, "Learn Figma"));

        // Bob TEACHES Java
        Skill javaSkill = skillRepository.findByNameIgnoreCase("Java")
                .orElseGet(() -> skillRepository.save(new Skill(null, progCat, "Java", "Java backend")));
        userSkillRepository.save(new UserSkill(null, candidateBob, javaSkill, SkillRelationshipType.TEACH, SkillProficiency.INTERMEDIATE, "Teach Java"));
    }

    @Test
    @DisplayName("GET /api/v1/discover without token returns 401 Unauthorized")
    void shouldReturn401WhenUnauthenticated() throws Exception {
        SecurityContextHolder.clearContext();
        mockMvc.perform(get("/api/v1/discover")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/v1/discover in LEARN mode returns candidates who teach skills user wants")
    void shouldDiscoverLearnCandidates() throws Exception {
        UsernamePasswordAuthenticationToken auth = createAuthToken(currentUser);

        mockMvc.perform(get("/api/v1/discover")
                        .param("mode", "LEARN")
                        .with(authentication(auth))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", not(empty())))
                .andExpect(jsonPath("$.items[0].candidate.displayName", is("Alice Smith")))
                .andExpect(jsonPath("$.items[0].score", greaterThan(50)))
                .andExpect(jsonPath("$.items[0].matchedSkills", hasItem("Python")))
                .andExpect(jsonPath("$.items[0].explanation", not(empty())));
    }

    @Test
    @DisplayName("GET /api/v1/discover in TEACH mode returns candidates who learn skills user teaches")
    void shouldDiscoverTeachCandidates() throws Exception {
        UsernamePasswordAuthenticationToken auth = createAuthToken(currentUser);

        mockMvc.perform(get("/api/v1/discover")
                        .param("mode", "TEACH")
                        .with(authentication(auth))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", not(empty())))
                .andExpect(jsonPath("$.items[0].candidate.displayName", is("Alice Smith")))
                .andExpect(jsonPath("$.items[0].matchedSkills", hasItem("Figma")));
    }

    @Test
    @DisplayName("GET /api/v1/discover excludes current authenticated user")
    void shouldExcludeCurrentUser() throws Exception {
        UsernamePasswordAuthenticationToken auth = createAuthToken(currentUser);

        mockMvc.perform(get("/api/v1/discover")
                        .param("mode", "GENERAL")
                        .with(authentication(auth))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[*].candidate.userId", not(hasItem(currentUser.getId().toString()))));
    }

    @Test
    @DisplayName("GET /api/v1/discover with search filters candidates by name or skill")
    void shouldSearchCandidates() throws Exception {
        UsernamePasswordAuthenticationToken auth = createAuthToken(currentUser);

        mockMvc.perform(get("/api/v1/discover")
                        .param("search", "Alice")
                        .with(authentication(auth))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].candidate.displayName", is("Alice Smith")));
    }

    @Test
    @DisplayName("GET /api/v1/discover/recommended returns top matches ordered by compatibility score")
    void shouldGetRecommendedCandidates() throws Exception {
        UsernamePasswordAuthenticationToken auth = createAuthToken(currentUser);

        mockMvc.perform(get("/api/v1/discover/recommended")
                        .with(authentication(auth))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", not(empty())))
                .andExpect(jsonPath("$.items[0].candidate.displayName", is("Alice Smith")))
                .andExpect(jsonPath("$.items[0].score", greaterThanOrEqualTo(80)));
    }

    @Test
    @DisplayName("GET /api/v1/users/{id}/public-profile returns safe public information and skills")
    void shouldReturnPublicProfile() throws Exception {
        UsernamePasswordAuthenticationToken auth = createAuthToken(currentUser);

        mockMvc.perform(get("/api/v1/users/" + candidateAlice.getId() + "/public-profile")
                        .with(authentication(auth))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId", is(candidateAlice.getId().toString())))
                .andExpect(jsonPath("$.displayName", is("Alice Smith")))
                .andExpect(jsonPath("$.collegeName", is("Stanford")))
                .andExpect(jsonPath("$.teachingSkills", not(empty())))
                .andExpect(jsonPath("$.learningSkills", not(empty())))
                .andExpect(jsonPath("$.email").doesNotExist())
                .andExpect(jsonPath("$.authUserId").doesNotExist());
    }

    @Test
    @DisplayName("GET /api/v1/users/{id}/public-profile with non-existent ID returns 404")
    void shouldReturn404ForUnknownUser() throws Exception {
        UsernamePasswordAuthenticationToken auth = createAuthToken(currentUser);

        mockMvc.perform(get("/api/v1/users/" + UUID.randomUUID() + "/public-profile")
                        .with(authentication(auth))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }
}
