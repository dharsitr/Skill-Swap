package com.skillswap.friend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillswap.common.security.AuthenticatedUserPrincipal;
import com.skillswap.friend.dto.SendFriendRequest;
import com.skillswap.friend.entity.FriendRequest;
import com.skillswap.friend.repository.FriendRequestRepository;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class FriendControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserService userService;

    @Autowired
    private FriendRequestRepository friendRequestRepository;

    private User alice;
    private User bob;

    @BeforeEach
    void setUp() {
        alice = userService.getOrCreateUser("sub-alice-" + UUID.randomUUID(), "Alice Student", "MIT");
        bob = userService.getOrCreateUser("sub-bob-" + UUID.randomUUID(), "Bob Tutor", "Stanford");
    }

    private UsernamePasswordAuthenticationToken createAuthToken(User user) {
        AuthenticatedUserPrincipal principal = new AuthenticatedUserPrincipal(
                user.getId(),
                user.getAuthUserId(),
                user.getAuthUserId() + "@college.edu",
                user.getStatus()
        );
        return new UsernamePasswordAuthenticationToken(
                principal,
                "token",
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
    }

    @Test
    @DisplayName("Friendship status returns NONE when no requests exist")
    void testGetFriendshipStatus_None() throws Exception {
        mockMvc.perform(get("/api/v1/friends/status/" + bob.getId())
                        .with(authentication(createAuthToken(alice))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("NONE"))
                .andExpect(jsonPath("$.requestId").doesNotExist());
    }

    @Test
    @DisplayName("Alice sends friend request to Bob, status becomes PENDING_SENT for Alice and PENDING_RECEIVED for Bob")
    void testSendFriendRequest_Success() throws Exception {
        SendFriendRequest request = new SendFriendRequest(bob.getId());

        mockMvc.perform(post("/api/v1/friends/request")
                        .with(authentication(createAuthToken(alice)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.senderId").value(alice.getId().toString()))
                .andExpect(jsonPath("$.receiverId").value(bob.getId().toString()));

        // Check Alice's status with Bob
        mockMvc.perform(get("/api/v1/friends/status/" + bob.getId())
                        .with(authentication(createAuthToken(alice))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING_SENT"));

        // Check Bob's status with Alice
        mockMvc.perform(get("/api/v1/friends/status/" + alice.getId())
                        .with(authentication(createAuthToken(bob))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING_RECEIVED"));
    }

    @Test
    @DisplayName("Bob accepts friend request, status becomes ACCEPTED and provisions conversation")
    void testAcceptFriendRequest_Success() throws Exception {
        FriendRequest fr = new FriendRequest(alice, bob);
        fr = friendRequestRepository.save(fr);

        mockMvc.perform(post("/api/v1/friends/requests/" + fr.getId() + "/accept")
                        .with(authentication(createAuthToken(bob))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACCEPTED"));

        // Alice sees ACCEPTED and valid conversationId
        mockMvc.perform(get("/api/v1/friends/status/" + bob.getId())
                        .with(authentication(createAuthToken(alice))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACCEPTED"))
                .andExpect(jsonPath("$.conversationId").isNotEmpty());

        // Bob's friends list includes Alice
        mockMvc.perform(get("/api/v1/friends")
                        .with(authentication(createAuthToken(bob))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].userId").value(alice.getId().toString()));
    }

    @Test
    @DisplayName("Bob declines friend request")
    void testDeclineFriendRequest() throws Exception {
        FriendRequest fr = new FriendRequest(alice, bob);
        fr = friendRequestRepository.save(fr);

        mockMvc.perform(post("/api/v1/friends/requests/" + fr.getId() + "/decline")
                        .with(authentication(createAuthToken(bob))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DECLINED"));
    }

    @Test
    @DisplayName("Alice cancels her sent friend request")
    void testCancelFriendRequest() throws Exception {
        FriendRequest fr = new FriendRequest(alice, bob);
        fr = friendRequestRepository.save(fr);

        mockMvc.perform(delete("/api/v1/friends/requests/" + fr.getId() + "/cancel")
                        .with(authentication(createAuthToken(alice))))
                .andExpect(status().isNoContent());

        assertThat(friendRequestRepository.findById(fr.getId())).isEmpty();
    }
}
