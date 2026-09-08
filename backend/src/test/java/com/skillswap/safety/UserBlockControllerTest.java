package com.skillswap.safety;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillswap.common.security.AuthenticatedUserPrincipal;
import com.skillswap.exchange.dto.CreateExchangeRequest;
import com.skillswap.safety.dto.BlockUserRequest;
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
class UserBlockControllerTest {

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
    private UserSkillRepository userSkillRepository;

    private User userA;
    private User userB;
    private Skill javaSkill;

    @BeforeEach
    void setUp() {
        userA = userService.getOrCreateUser("auth-a-" + UUID.randomUUID(), "Alice Adams", "MIT");
        userB = userService.getOrCreateUser("auth-b-" + UUID.randomUUID(), "Bob Baker", "Harvard");

        SkillCategory cat = categoryRepository.save(new SkillCategory(null, "Tech-" + UUID.randomUUID(), "Tech"));
        javaSkill = skillRepository.save(new Skill(null, cat, "Java-" + UUID.randomUUID(), "Java"));

        // User A wants to LEARN Java, User B TEACHES Java
        userSkillRepository.save(new UserSkill(null, userA, javaSkill, SkillRelationshipType.LEARN, SkillProficiency.BEGINNER, "Learning"));
        userSkillRepository.save(new UserSkill(null, userB, javaSkill, SkillRelationshipType.TEACH, SkillProficiency.EXPERT, "Teaching"));
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
    @DisplayName("User A successfully blocks User B")
    void testBlockUser_Success() throws Exception {
        BlockUserRequest request = new BlockUserRequest(userB.getId());

        mockMvc.perform(post("/api/v1/blocks")
                        .with(authentication(createAuthToken(userA)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.blockedUserId").value(userB.getId().toString()))
                .andExpect(jsonPath("$.blockedUserName").value("Bob Baker"));

        // Verify block status
        mockMvc.perform(get("/api/v1/blocks/status/" + userB.getId())
                        .with(authentication(createAuthToken(userA))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.blockedByMe").value(true))
                .andExpect(jsonPath("$.blockedByTarget").value(false));
    }

    @Test
    @DisplayName("Reject self-block")
    void testBlockUser_Self_BadRequest() throws Exception {
        BlockUserRequest request = new BlockUserRequest(userA.getId());

        mockMvc.perform(post("/api/v1/blocks")
                        .with(authentication(createAuthToken(userA)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("cannot block yourself")));
    }

    @Test
    @DisplayName("Unblock User B")
    void testUnblockUser_Success() throws Exception {
        // First block
        mockMvc.perform(post("/api/v1/blocks")
                        .with(authentication(createAuthToken(userA)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new BlockUserRequest(userB.getId()))))
                .andExpect(status().isCreated());

        // Then unblock
        mockMvc.perform(delete("/api/v1/blocks/" + userB.getId())
                        .with(authentication(createAuthToken(userA))))
                .andExpect(status().isNoContent());

        // Verify no longer blocked
        mockMvc.perform(get("/api/v1/blocks/status/" + userB.getId())
                        .with(authentication(createAuthToken(userA))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.blockedByMe").value(false));
    }

    @Test
    @DisplayName("Blocked user cannot send exchange request")
    void testBlockedUser_CannotSendExchangeRequest() throws Exception {
        // User B blocks User A
        mockMvc.perform(post("/api/v1/blocks")
                        .with(authentication(createAuthToken(userB)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new BlockUserRequest(userA.getId()))))
                .andExpect(status().isCreated());

        // User A attempts to create exchange request to User B
        CreateExchangeRequest req = new CreateExchangeRequest(userB.getId(), javaSkill.getId(), "Let's learn");

        mockMvc.perform(post("/api/v1/exchange-requests")
                        .with(authentication(createAuthToken(userA)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value(containsString("block and privacy settings")));
    }
}
