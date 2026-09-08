package com.skillswap.chat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillswap.chat.dto.CreateConversationRequest;
import com.skillswap.chat.dto.SendMessageRequest;
import com.skillswap.chat.entity.Message;
import com.skillswap.chat.repository.ConversationRepository;
import com.skillswap.chat.repository.MessageRepository;
import com.skillswap.chat.service.ChatService;
import com.skillswap.common.security.AuthenticatedUserPrincipal;
import com.skillswap.exchange.entity.ExchangeRequest;
import com.skillswap.exchange.entity.ExchangeRequestStatus;
import com.skillswap.exchange.repository.ExchangeRequestRepository;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ConversationControllerTest {

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
    private ConversationRepository conversationRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private ChatService chatService;

    private User studentA;
    private User studentB;
    private User studentC;

    @BeforeEach
    void setUp() {
        studentA = userService.getOrCreateUser("auth-" + UUID.randomUUID(), "Alice Student", "MIT");
        studentB = userService.getOrCreateUser("auth-" + UUID.randomUUID(), "Bob Tutor", "Stanford");
        studentC = userService.getOrCreateUser("auth-" + UUID.randomUUID(), "Charlie Bystander", "Harvard");

        SkillCategory category = categoryRepository.save(new SkillCategory(null, "Tech-" + UUID.randomUUID(), "Tech Skills"));
        Skill skill = skillRepository.save(new Skill(null, category, "Java-" + UUID.randomUUID(), "Java Lang"));

        // Establish an accepted exchange request between studentA and studentB
        exchangeRequestRepository.save(new ExchangeRequest(
                null,
                studentA,
                studentB,
                skill,
                "Let's chat about Java",
                ExchangeRequestStatus.ACCEPTED
        ));
    }

    private UsernamePasswordAuthenticationToken createAuthToken(User user) {
        AuthenticatedUserPrincipal principal = new AuthenticatedUserPrincipal(
                user.getId(),
                user.getAuthUserId(),
                user.getAuthUserId() + "@campus.edu",
                user.getStatus()
        );
        return new UsernamePasswordAuthenticationToken(
                principal,
                "token",
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
    }

    @Test
    @DisplayName("POST /api/v1/conversations — creates new conversation between two eligible students")
    void createConversation_Success() throws Exception {
        CreateConversationRequest request = new CreateConversationRequest(studentB.getId());

        mockMvc.perform(post("/api/v1/conversations")
                        .with(authentication(createAuthToken(studentA)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.otherParticipant.userId").value(studentB.getId().toString()))
                .andExpect(jsonPath("$.otherParticipant.displayName").value("Bob Tutor"));

        assertThat(conversationRepository.findByParticipantIds(studentA.getId(), studentB.getId())).isPresent();
    }

    @Test
    @DisplayName("POST /api/v1/conversations — idempotent: returns existing conversation if already created")
    void createConversation_ReusesExisting() throws Exception {
        CreateConversationRequest request = new CreateConversationRequest(studentB.getId());

        // First creation
        String response1 = mockMvc.perform(post("/api/v1/conversations")
                        .with(authentication(createAuthToken(studentA)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String convId1 = objectMapper.readTree(response1).get("id").asText();

        // Second creation from reverse participant (studentB initiating to studentA)
        CreateConversationRequest reverseRequest = new CreateConversationRequest(studentA.getId());
        String response2 = mockMvc.perform(post("/api/v1/conversations")
                        .with(authentication(createAuthToken(studentB)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reverseRequest)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String convId2 = objectMapper.readTree(response2).get("id").asText();

        assertThat(convId1).isEqualTo(convId2);
    }

    @Test
    @DisplayName("POST /api/v1/conversations — rejects self-messaging (400 Bad Request)")
    void createConversation_SelfMessagingFails() throws Exception {
        CreateConversationRequest request = new CreateConversationRequest(studentA.getId());

        mockMvc.perform(post("/api/v1/conversations")
                        .with(authentication(createAuthToken(studentA)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/v1/conversations — lists user's conversations with unread counts")
    void getMyConversations_Success() throws Exception {
        chatService.getOrCreateConversation(studentA.getId(), studentB.getId());

        mockMvc.perform(get("/api/v1/conversations")
                        .with(authentication(createAuthToken(studentA))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].otherParticipant.userId").value(studentB.getId().toString()))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @DisplayName("GET /api/v1/conversations/{id} — 403 Forbidden for non-participant")
    void getConversation_ForbiddenForNonParticipant() throws Exception {
        var conv = chatService.getOrCreateConversation(studentA.getId(), studentB.getId());

        mockMvc.perform(get("/api/v1/conversations/{id}", conv.id())
                        .with(authentication(createAuthToken(studentC))))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/v1/conversations/{id}/messages — sends and persists message")
    void sendMessage_Success() throws Exception {
        var conv = chatService.getOrCreateConversation(studentA.getId(), studentB.getId());
        SendMessageRequest request = new SendMessageRequest("Hi Bob, are you available tomorrow?", "client-msg-1");

        mockMvc.perform(post("/api/v1/conversations/{id}/messages", conv.id())
                        .with(authentication(createAuthToken(studentA)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.content").value("Hi Bob, are you available tomorrow?"))
                .andExpect(jsonPath("$.senderId").value(studentA.getId().toString()))
                .andExpect(jsonPath("$.clientMessageId").value("client-msg-1"));

        // Verify message persistence
        List<Message> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conv.id());
        assertThat(messages).hasSize(1);
        assertThat(messages.get(0).getContent()).isEqualTo("Hi Bob, are you available tomorrow?");
    }

    @Test
    @DisplayName("POST /api/v1/conversations/{id}/messages — rejects blank/whitespace content")
    void sendMessage_BlankContentFails() throws Exception {
        var conv = chatService.getOrCreateConversation(studentA.getId(), studentB.getId());
        SendMessageRequest request = new SendMessageRequest("   ", null);

        mockMvc.perform(post("/api/v1/conversations/{id}/messages", conv.id())
                        .with(authentication(createAuthToken(studentA)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/v1/conversations/{id}/messages — rejects messages > 2000 characters")
    void sendMessage_OversizedContentFails() throws Exception {
        var conv = chatService.getOrCreateConversation(studentA.getId(), studentB.getId());
        String oversized = "a".repeat(2001);
        SendMessageRequest request = new SendMessageRequest(oversized, null);

        mockMvc.perform(post("/api/v1/conversations/{id}/messages", conv.id())
                        .with(authentication(createAuthToken(studentA)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/v1/conversations/{id}/messages — 403 Forbidden for non-participant")
    void sendMessage_ForbiddenForNonParticipant() throws Exception {
        var conv = chatService.getOrCreateConversation(studentA.getId(), studentB.getId());
        SendMessageRequest request = new SendMessageRequest("Sneaky message", null);

        mockMvc.perform(post("/api/v1/conversations/{id}/messages", conv.id())
                        .with(authentication(createAuthToken(studentC)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/v1/conversations/{id}/read & GET unread-count — marks unread messages as read")
    void markMessagesRead_Success() throws Exception {
        var conv = chatService.getOrCreateConversation(studentA.getId(), studentB.getId());

        // Student A sends 2 messages to Student B
        chatService.saveMessage(studentA.getId(), conv.id(), "Msg 1", "c1");
        chatService.saveMessage(studentA.getId(), conv.id(), "Msg 2", "c2");

        // Check Student B unread count
        mockMvc.perform(get("/api/v1/conversations/unread-count")
                        .with(authentication(createAuthToken(studentB))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(2));

        // Student B marks conversation as read
        mockMvc.perform(post("/api/v1/conversations/{id}/read", conv.id())
                        .with(authentication(createAuthToken(studentB))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.markedCount").value(2));

        // Check Student B unread count again -> 0
        mockMvc.perform(get("/api/v1/conversations/unread-count")
                        .with(authentication(createAuthToken(studentB))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(0));
    }

    @Test
    @DisplayName("POST /api/v1/conversations/{id}/messages — clientMessageId idempotency prevents duplicates")
    void sendMessage_IdempotentClientMessageId() throws Exception {
        var conv = chatService.getOrCreateConversation(studentA.getId(), studentB.getId());
        SendMessageRequest request = new SendMessageRequest("Repeated message", "uuid-client-123");

        // Send 1st time
        mockMvc.perform(post("/api/v1/conversations/{id}/messages", conv.id())
                        .with(authentication(createAuthToken(studentA)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Send 2nd time (network retry)
        mockMvc.perform(post("/api/v1/conversations/{id}/messages", conv.id())
                        .with(authentication(createAuthToken(studentA)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Verify only 1 message persisted
        List<Message> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conv.id());
        assertThat(messages).hasSize(1);
    }

    @Test
    @DisplayName("GET /api/v1/conversations — 401 Unauthorized without token")
    void getConversations_UnauthorizedWithoutToken() throws Exception {
        mockMvc.perform(get("/api/v1/conversations"))
                .andExpect(status().isUnauthorized());
    }
}
