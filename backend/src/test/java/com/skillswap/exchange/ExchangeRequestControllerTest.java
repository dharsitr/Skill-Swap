package com.skillswap.exchange;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillswap.common.security.AuthenticatedUserPrincipal;
import com.skillswap.exchange.dto.CreateExchangeRequest;
import com.skillswap.session.repository.SessionRepository;
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
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ExchangeRequestControllerTest {

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

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private User userA;
    private User userB;
    private User userC;
    private Skill pythonSkill;
    private Skill reactSkill;

    @BeforeEach
    void setUp() {
        userA = userService.getOrCreateUser("auth-user-a-" + UUID.randomUUID(), "Alice Student", "MIT");
        userB = userService.getOrCreateUser("auth-user-b-" + UUID.randomUUID(), "Bob Tutor", "Stanford");
        userC = userService.getOrCreateUser("auth-user-c-" + UUID.randomUUID(), "Charlie Bystander", "Harvard");

        SkillCategory programming = categoryRepository.save(new SkillCategory(null, "Programming-" + UUID.randomUUID(), "Coding"));
        pythonSkill = skillRepository.save(new Skill(null, programming, "Python-" + UUID.randomUUID(), "Python Lang"));
        reactSkill = skillRepository.save(new Skill(null, programming, "React-" + UUID.randomUUID(), "React UI"));

        // User A wants to LEARN Python
        userSkillRepository.save(new UserSkill(null, userA, pythonSkill, SkillRelationshipType.LEARN, SkillProficiency.BEGINNER, "Want to learn ML"));

        // User B TEACHES Python
        userSkillRepository.save(new UserSkill(null, userB, pythonSkill, SkillRelationshipType.TEACH, SkillProficiency.ADVANCED, "I can teach Python"));

        // User A TEACHES React
        userSkillRepository.save(new UserSkill(null, userA, reactSkill, SkillRelationshipType.TEACH, SkillProficiency.EXPERT, "I teach React"));
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
    @DisplayName("Should successfully create a pending exchange request when valid")
    void testCreateExchangeRequest_Success() throws Exception {
        CreateExchangeRequest request = new CreateExchangeRequest(userB.getId(), pythonSkill.getId(), "Hi Bob, let's exchange!");

        mockMvc.perform(post("/api/v1/exchange-requests")
                        .with(authentication(createAuthToken(userA)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.requester.id").value(userA.getId().toString()))
                .andExpect(jsonPath("$.recipient.id").value(userB.getId().toString()))
                .andExpect(jsonPath("$.skill.id").value(pythonSkill.getId().toString()))
                .andExpect(jsonPath("$.message").value("Hi Bob, let's exchange!"));
    }

    @Test
    @DisplayName("Should reject self exchange request with 400 Bad Request")
    void testCreateExchangeRequest_SelfRequest_BadRequest() throws Exception {
        CreateExchangeRequest request = new CreateExchangeRequest(userA.getId(), pythonSkill.getId(), "Self exchange");

        mockMvc.perform(post("/api/v1/exchange-requests")
                        .with(authentication(createAuthToken(userA)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("cannot send an exchange request to yourself")));
    }

    @Test
    @DisplayName("Should reject when requester does not have LEARN relationship with skill")
    void testCreateExchangeRequest_RequesterNotLearning_BadRequest() throws Exception {
        // User A teaches React but does not have LEARN relationship for React
        CreateExchangeRequest request = new CreateExchangeRequest(userB.getId(), reactSkill.getId(), "Learn React");

        mockMvc.perform(post("/api/v1/exchange-requests")
                        .with(authentication(createAuthToken(userA)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("learning goals")));
    }

    @Test
    @DisplayName("Should reject when recipient does not TEACH requested skill")
    void testCreateExchangeRequest_RecipientNotTeaching_BadRequest() throws Exception {
        // User A wants to learn React (add relationship), but User B does NOT teach React
        userSkillRepository.save(new UserSkill(null, userA, reactSkill, SkillRelationshipType.LEARN, SkillProficiency.BEGINNER, "Learn"));

        CreateExchangeRequest request = new CreateExchangeRequest(userB.getId(), reactSkill.getId(), "Learn React from Bob");

        mockMvc.perform(post("/api/v1/exchange-requests")
                        .with(authentication(createAuthToken(userA)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("does not teach this skill")));
    }

    @Test
    @DisplayName("Should reject duplicate active pending request with 409 Conflict")
    void testCreateExchangeRequest_DuplicatePending_Conflict() throws Exception {
        CreateExchangeRequest request = new CreateExchangeRequest(userB.getId(), pythonSkill.getId(), "First request");

        mockMvc.perform(post("/api/v1/exchange-requests")
                        .with(authentication(createAuthToken(userA)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Attempt second identical request
        mockMvc.perform(post("/api/v1/exchange-requests")
                        .with(authentication(createAuthToken(userA)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("already exists")));
    }

    @Test
    @DisplayName("Should retrieve incoming and outgoing requests with pagination")
    void testGetIncomingAndOutgoingRequests() throws Exception {
        CreateExchangeRequest req = new CreateExchangeRequest(userB.getId(), pythonSkill.getId(), "Exchange python");
        mockMvc.perform(post("/api/v1/exchange-requests")
                        .with(authentication(createAuthToken(userA)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        // User B sees incoming
        mockMvc.perform(get("/api/v1/exchange-requests/incoming")
                        .with(authentication(createAuthToken(userB))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].requester.displayName").value("Alice Student"))
                .andExpect(jsonPath("$.items[0].status").value("PENDING"));

        // User A sees outgoing
        mockMvc.perform(get("/api/v1/exchange-requests/outgoing")
                        .with(authentication(createAuthToken(userA))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].recipient.displayName").value("Bob Tutor"))
                .andExpect(jsonPath("$.items[0].status").value("PENDING"));
    }

    @Test
    @DisplayName("Should allow recipient to accept request and atomically create session")
    void testAcceptRequest_Success_CreatesSession() throws Exception {
        CreateExchangeRequest req = new CreateExchangeRequest(userB.getId(), pythonSkill.getId(), "Let's learn Python");
        MvcResult postResult = mockMvc.perform(post("/api/v1/exchange-requests")
                        .with(authentication(createAuthToken(userA)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();

        String requestId = objectMapper.readTree(postResult.getResponse().getContentAsString()).get("id").asText();

        // User B accepts
        mockMvc.perform(post("/api/v1/exchange-requests/" + requestId + "/accept")
                        .with(authentication(createAuthToken(userB))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACCEPTED"));

        // Verify session was created
        assertTrue(sessionRepository.existsByExchangeRequestId(UUID.fromString(requestId)));
    }

    @Test
    @DisplayName("Should prevent non-recipient from accepting request with 403 Forbidden")
    void testAcceptRequest_NonRecipient_Forbidden() throws Exception {
        CreateExchangeRequest req = new CreateExchangeRequest(userB.getId(), pythonSkill.getId(), "Let's learn Python");
        MvcResult postResult = mockMvc.perform(post("/api/v1/exchange-requests")
                        .with(authentication(createAuthToken(userA)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();

        String requestId = objectMapper.readTree(postResult.getResponse().getContentAsString()).get("id").asText();

        // Requester Alice tries to accept own request -> 403 Forbidden
        mockMvc.perform(post("/api/v1/exchange-requests/" + requestId + "/accept")
                        .with(authentication(createAuthToken(userA))))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Should allow recipient to reject request")
    void testRejectRequest_Success() throws Exception {
        CreateExchangeRequest req = new CreateExchangeRequest(userB.getId(), pythonSkill.getId(), "Let's learn Python");
        MvcResult postResult = mockMvc.perform(post("/api/v1/exchange-requests")
                        .with(authentication(createAuthToken(userA)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();

        String requestId = objectMapper.readTree(postResult.getResponse().getContentAsString()).get("id").asText();

        // User B rejects
        mockMvc.perform(post("/api/v1/exchange-requests/" + requestId + "/reject")
                        .with(authentication(createAuthToken(userB))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"));
    }

    @Test
    @DisplayName("Should allow requester to cancel pending request")
    void testCancelRequest_Success() throws Exception {
        CreateExchangeRequest req = new CreateExchangeRequest(userB.getId(), pythonSkill.getId(), "Let's learn Python");
        MvcResult postResult = mockMvc.perform(post("/api/v1/exchange-requests")
                        .with(authentication(createAuthToken(userA)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();

        String requestId = objectMapper.readTree(postResult.getResponse().getContentAsString()).get("id").asText();

        // User A cancels
        mockMvc.perform(post("/api/v1/exchange-requests/" + requestId + "/cancel")
                        .with(authentication(createAuthToken(userA))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    @DisplayName("Should prevent third party from viewing request with 403 Forbidden")
    void testGetRequest_Unauthorized_Forbidden() throws Exception {
        CreateExchangeRequest req = new CreateExchangeRequest(userB.getId(), pythonSkill.getId(), "Private request");
        MvcResult postResult = mockMvc.perform(post("/api/v1/exchange-requests")
                        .with(authentication(createAuthToken(userA)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();

        String requestId = objectMapper.readTree(postResult.getResponse().getContentAsString()).get("id").asText();

        // Bystander Charlie tries to access
        mockMvc.perform(get("/api/v1/exchange-requests/" + requestId)
                        .with(authentication(createAuthToken(userC))))
                .andExpect(status().isForbidden());
    }
}
