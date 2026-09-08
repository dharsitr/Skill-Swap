package com.skillswap.skill;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillswap.common.security.AuthenticatedUserPrincipal;
import com.skillswap.skill.dto.CreateUserSkillRequest;
import com.skillswap.skill.dto.UpdateUserSkillRequest;
import com.skillswap.skill.entity.Skill;
import com.skillswap.skill.entity.SkillCategory;
import com.skillswap.skill.entity.SkillProficiency;
import com.skillswap.skill.entity.SkillRelationshipType;
import com.skillswap.skill.repository.SkillCategoryRepository;
import com.skillswap.skill.repository.SkillRepository;
import com.skillswap.user.entity.User;
import com.skillswap.user.service.UserService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class UserSkillControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserService userService;

    @Autowired
    private SkillCategoryRepository categoryRepository;

    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private UsernamePasswordAuthenticationToken createAuthToken(User user) {
        AuthenticatedUserPrincipal principal = new AuthenticatedUserPrincipal(
                user.getId(),
                user.getAuthUserId(),
                "student@college.edu",
                user.getStatus()
        );

        return new UsernamePasswordAuthenticationToken(
                principal,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
    }

    private Skill getOrCreateSkill(String name) {
        return skillRepository.findByNameIgnoreCase(name)
                .orElseGet(() -> {
                    SkillCategory category = categoryRepository.findByNameIgnoreCase("Programming")
                            .orElseGet(() -> categoryRepository.save(new SkillCategory(null, "Programming", "Desc")));
                    return skillRepository.save(new Skill(null, category, name, "Description"));
                });
    }

    @Test
    @DisplayName("GET /api/v1/profile/me/skills without token should return 401 Unauthorized")
    void shouldReturn401WhenUnauthenticated() throws Exception {
        SecurityContextHolder.clearContext();
        mockMvc.perform(get("/api/v1/profile/me/skills")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)))
                .andExpect(jsonPath("$.error", is("Unauthorized")));
    }

    @Test
    @DisplayName("GET /api/v1/profile/me/skills should return user's teaching and learning skills")
    void shouldReturnUserSkillProfile() throws Exception {
        User user = userService.getOrCreateUser("auth-" + UUID.randomUUID(), "Alice", "MIT");
        UsernamePasswordAuthenticationToken auth = createAuthToken(user);

        mockMvc.perform(get("/api/v1/profile/me/skills")
                        .with(authentication(auth))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.teaching", notNullValue()))
                .andExpect(jsonPath("$.learning", notNullValue()));
    }

    @Test
    @DisplayName("POST /api/v1/profile/me/skills should successfully add a teaching skill")
    void shouldAddTeachingSkill() throws Exception {
        User user = userService.getOrCreateUser("auth-" + UUID.randomUUID(), "Bob", "Stanford");
        UsernamePasswordAuthenticationToken auth = createAuthToken(user);
        Skill skill = getOrCreateSkill("Python");

        CreateUserSkillRequest request = new CreateUserSkillRequest(
                skill.getId(),
                SkillRelationshipType.TEACH,
                SkillProficiency.ADVANCED,
                "Experienced with Python 3 and Django"
        );

        mockMvc.perform(post("/api/v1/profile/me/skills")
                        .with(authentication(auth))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.skillName", is(skill.getName())))
                .andExpect(jsonPath("$.relationshipType", is("TEACH")))
                .andExpect(jsonPath("$.proficiency", is("ADVANCED")))
                .andExpect(jsonPath("$.description", is("Experienced with Python 3 and Django")));
    }

    @Test
    @DisplayName("POST /api/v1/profile/me/skills duplicate addition should return 409 Conflict")
    void shouldRejectDuplicateSkillRelationship() throws Exception {
        User user = userService.getOrCreateUser("auth-" + UUID.randomUUID(), "Charlie", "Berkeley");
        UsernamePasswordAuthenticationToken auth = createAuthToken(user);
        Skill skill = getOrCreateSkill("Java");

        CreateUserSkillRequest request = new CreateUserSkillRequest(
                skill.getId(),
                SkillRelationshipType.TEACH,
                SkillProficiency.INTERMEDIATE,
                "First addition"
        );

        // First addition
        mockMvc.perform(post("/api/v1/profile/me/skills")
                        .with(authentication(auth))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated());

        // Duplicate addition
        mockMvc.perform(post("/api/v1/profile/me/skills")
                        .with(authentication(auth))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status", is(409)))
                .andExpect(jsonPath("$.error", is("Conflict")))
                .andExpect(jsonPath("$.message", containsString("Skill already exists")));
    }

    @Test
    @DisplayName("POST /api/v1/profile/me/skills with EXPERT on LEARN should return 400 Bad Request")
    void shouldRejectExpertOnLearningSkill() throws Exception {
        User user = userService.getOrCreateUser("auth-" + UUID.randomUUID(), "David", "Harvard");
        UsernamePasswordAuthenticationToken auth = createAuthToken(user);
        Skill skill = getOrCreateSkill("Machine Learning");

        CreateUserSkillRequest request = new CreateUserSkillRequest(
                skill.getId(),
                SkillRelationshipType.LEARN,
                SkillProficiency.EXPERT,
                "Want to learn at expert level"
        );

        mockMvc.perform(post("/api/v1/profile/me/skills")
                        .with(authentication(auth))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.message", containsString("Learning proficiency level can only be")));
    }

    @Test
    @DisplayName("PUT /api/v1/profile/me/skills/{id} should update proficiency and description")
    void shouldUpdateUserSkill() throws Exception {
        User user = userService.getOrCreateUser("auth-" + UUID.randomUUID(), "Eve", "Princeton");
        UsernamePasswordAuthenticationToken auth = createAuthToken(user);
        Skill skill = getOrCreateSkill("TypeScript");

        CreateUserSkillRequest addReq = new CreateUserSkillRequest(
                skill.getId(),
                SkillRelationshipType.TEACH,
                SkillProficiency.INTERMEDIATE,
                "Initial note"
        );

        String createdResponse = mockMvc.perform(post("/api/v1/profile/me/skills")
                        .with(authentication(auth))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String skillId = objectMapper.readTree(createdResponse).get("id").asText();

        UpdateUserSkillRequest updateReq = new UpdateUserSkillRequest(
                SkillProficiency.EXPERT,
                "Upgraded to expert with production TypeScript mastery"
        );

        mockMvc.perform(put("/api/v1/profile/me/skills/" + skillId)
                        .with(authentication(auth))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.proficiency", is("EXPERT")))
                .andExpect(jsonPath("$.description", is("Upgraded to expert with production TypeScript mastery")));
    }

    @Test
    @DisplayName("PUT /api/v1/profile/me/skills/{id} for another user's skill should return 404 Not Found")
    void shouldProtectOwnershipOnUpdate() throws Exception {
        User user1 = userService.getOrCreateUser("auth-" + UUID.randomUUID(), "User One", "Caltech");
        User user2 = userService.getOrCreateUser("auth-" + UUID.randomUUID(), "User Two", "Columbia");

        UsernamePasswordAuthenticationToken auth1 = createAuthToken(user1);
        UsernamePasswordAuthenticationToken auth2 = createAuthToken(user2);
        Skill skill = getOrCreateSkill("Rust");

        CreateUserSkillRequest addReq = new CreateUserSkillRequest(
                skill.getId(),
                SkillRelationshipType.TEACH,
                SkillProficiency.BEGINNER,
                "User 1's skill"
        );

        String createdResponse = mockMvc.perform(post("/api/v1/profile/me/skills")
                        .with(authentication(auth1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String skillId = objectMapper.readTree(createdResponse).get("id").asText();

        UpdateUserSkillRequest updateReq = new UpdateUserSkillRequest(
                SkillProficiency.ADVANCED,
                "Hacked update attempt by user 2"
        );

        // User 2 attempts to edit User 1's skill
        mockMvc.perform(put("/api/v1/profile/me/skills/" + skillId)
                        .with(authentication(auth2))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)));
    }

    @Test
    @DisplayName("DELETE /api/v1/profile/me/skills/{id} should remove user skill")
    void shouldDeleteUserSkill() throws Exception {
        User user = userService.getOrCreateUser("auth-" + UUID.randomUUID(), "Frank", "Duke");
        UsernamePasswordAuthenticationToken auth = createAuthToken(user);
        Skill skill = getOrCreateSkill("C++");

        CreateUserSkillRequest addReq = new CreateUserSkillRequest(
                skill.getId(),
                SkillRelationshipType.LEARN,
                SkillProficiency.BEGINNER,
                "Want to learn C++"
        );

        String createdResponse = mockMvc.perform(post("/api/v1/profile/me/skills")
                        .with(authentication(auth))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String skillId = objectMapper.readTree(createdResponse).get("id").asText();

        mockMvc.perform(delete("/api/v1/profile/me/skills/" + skillId)
                        .with(authentication(auth))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Skill removed from profile successfully")));

        // Verify it no longer exists
        mockMvc.perform(get("/api/v1/profile/me/skills")
                        .with(authentication(auth))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.learning", hasSize(0)));
    }
}
