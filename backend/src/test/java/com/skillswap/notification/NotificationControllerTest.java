package com.skillswap.notification;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillswap.common.security.AuthenticatedUserPrincipal;
import com.skillswap.notification.dto.UpdateNotificationPreferencesRequest;
import com.skillswap.notification.entity.NotificationType;
import com.skillswap.notification.service.NotificationService;
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
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserService userService;

    @Autowired
    private NotificationService notificationService;

    private User alice;
    private User bob;

    @BeforeEach
    void setUp() {
        alice = userService.getOrCreateUser("auth-alice-" + UUID.randomUUID(), "Alice Student", "MIT");
        bob = userService.getOrCreateUser("auth-bob-" + UUID.randomUUID(), "Bob Tutor", "Stanford");
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
    @DisplayName("Should list recipient's notifications with pagination and ordering")
    void shouldListNotifications() throws Exception {
        notificationService.createNotification(
                alice.getId(),
                NotificationType.EXCHANGE_REQUEST_RECEIVED,
                "Request 1",
                "Message 1",
                "EXCHANGE_REQUEST",
                UUID.randomUUID(),
                "/requests"
        );
        notificationService.createNotification(
                alice.getId(),
                NotificationType.SESSION_STARTED,
                "Session Started",
                "Message 2",
                "SESSION",
                UUID.randomUUID(),
                "/sessions"
        );

        mockMvc.perform(get("/api/v1/notifications")
                        .with(authentication(createAuthToken(alice))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(2)))
                .andExpect(jsonPath("$.items[0].title").value("Session Started"))
                .andExpect(jsonPath("$.items[0].read").value(false));
    }

    @Test
    @DisplayName("Should filter unread notifications when unreadOnly is true")
    void shouldFilterUnreadNotifications() throws Exception {
        notificationService.createNotification(
                alice.getId(),
                NotificationType.EXCHANGE_REQUEST_RECEIVED,
                "Unread 1",
                "Message",
                "EXCHANGE_REQUEST",
                null,
                "/requests"
        ).orElseThrow();

        var n2 = notificationService.createNotification(
                alice.getId(),
                NotificationType.SESSION_STARTED,
                "Read 2",
                "Message",
                "SESSION",
                null,
                "/sessions"
        ).orElseThrow();

        notificationService.markAsRead(alice.getId(), n2.id());

        mockMvc.perform(get("/api/v1/notifications")
                        .param("unreadOnly", "true")
                        .with(authentication(createAuthToken(alice))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].title").value("Unread 1"));
    }

    @Test
    @DisplayName("Should return accurate unread count")
    void shouldReturnUnreadCount() throws Exception {
        notificationService.createNotification(
                alice.getId(),
                NotificationType.EXCHANGE_REQUEST_RECEIVED,
                "N1",
                "Msg",
                null,
                null,
                null
        );
        notificationService.createNotification(
                alice.getId(),
                NotificationType.NEW_MESSAGE,
                "N2",
                "Msg",
                null,
                null,
                null
        );

        mockMvc.perform(get("/api/v1/notifications/unread-count")
                        .with(authentication(createAuthToken(alice))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(2));
    }

    @Test
    @DisplayName("Should mark individual notification as read")
    void shouldMarkAsRead() throws Exception {
        var notif = notificationService.createNotification(
                alice.getId(),
                NotificationType.EXCHANGE_REQUEST_RECEIVED,
                "N1",
                "Msg",
                null,
                null,
                null
        ).orElseThrow();

        mockMvc.perform(post("/api/v1/notifications/" + notif.id() + "/read")
                        .with(authentication(createAuthToken(alice))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.read").value(true))
                .andExpect(jsonPath("$.readAt").isNotEmpty());
    }

    @Test
    @DisplayName("Should reject mark read attempt by another user (IDOR protection)")
    void shouldRejectMarkReadByAnotherUser() throws Exception {
        var notif = notificationService.createNotification(
                alice.getId(),
                NotificationType.EXCHANGE_REQUEST_RECEIVED,
                "Alice's private notif",
                "Msg",
                null,
                null,
                null
        ).orElseThrow();

        mockMvc.perform(post("/api/v1/notifications/" + notif.id() + "/read")
                        .with(authentication(createAuthToken(bob))))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Should mark all unread notifications as read")
    void shouldMarkAllAsRead() throws Exception {
        notificationService.createNotification(alice.getId(), NotificationType.EXCHANGE_REQUEST_RECEIVED, "N1", "M1", null, null, null);
        notificationService.createNotification(alice.getId(), NotificationType.SESSION_STARTED, "N2", "M2", null, null, null);
        notificationService.createNotification(bob.getId(), NotificationType.NEW_MESSAGE, "N3", "M3", null, null, null);

        mockMvc.perform(post("/api/v1/notifications/read-all")
                        .with(authentication(createAuthToken(alice))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.markedCount").value(2));

        // Alice unread count should be 0, Bob unread count still 1
        mockMvc.perform(get("/api/v1/notifications/unread-count")
                        .with(authentication(createAuthToken(alice))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(0));

        mockMvc.perform(get("/api/v1/notifications/unread-count")
                        .with(authentication(createAuthToken(bob))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(1));
    }

    @Test
    @DisplayName("Should delete own notification and disallow deletion by another user")
    void shouldDeleteNotification() throws Exception {
        var notif = notificationService.createNotification(
                alice.getId(),
                NotificationType.EXCHANGE_REQUEST_RECEIVED,
                "N1",
                "Msg",
                null,
                null,
                null
        ).orElseThrow();

        // Bob cannot delete Alice's notification
        mockMvc.perform(delete("/api/v1/notifications/" + notif.id())
                        .with(authentication(createAuthToken(bob))))
                .andExpect(status().isForbidden());

        // Alice deletes her own notification
        mockMvc.perform(delete("/api/v1/notifications/" + notif.id())
                        .with(authentication(createAuthToken(alice))))
                .andExpect(status().isNoContent());

        // Verify count is 0
        mockMvc.perform(get("/api/v1/notifications/unread-count")
                        .with(authentication(createAuthToken(alice))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(0));
    }

    @Test
    @DisplayName("Should get and update notification preferences")
    void shouldManageNotificationPreferences() throws Exception {
        // Fetch default preferences
        mockMvc.perform(get("/api/v1/notification-preferences")
                        .with(authentication(createAuthToken(alice))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.exchangeRequests").value(true))
                .andExpect(jsonPath("$.sessions").value(true))
                .andExpect(jsonPath("$.messages").value(true))
                .andExpect(jsonPath("$.reviews").value(true))
                .andExpect(jsonPath("$.safety").value(true));

        // Update preferences: disable messages
        UpdateNotificationPreferencesRequest updateReq = new UpdateNotificationPreferencesRequest(
                null,
                null,
                false, // disable messages
                null,
                null
        );

        mockMvc.perform(patch("/api/v1/notification-preferences")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq))
                        .with(authentication(createAuthToken(alice))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.messages").value(false))
                .andExpect(jsonPath("$.exchangeRequests").value(true));

        // Verify message notification is suppressed
        var suppressed = notificationService.createNotification(
                alice.getId(),
                NotificationType.NEW_MESSAGE,
                "New Message",
                "Content",
                "CONVERSATION",
                UUID.randomUUID(),
                "/messages"
        );
        assertTrue(suppressed.isEmpty(), "Disabled message notification should be suppressed");

        // Verify review notification is still enabled
        var allowed = notificationService.createNotification(
                alice.getId(),
                NotificationType.REVIEW_RECEIVED,
                "New Review",
                "Content",
                "PROFILE",
                UUID.randomUUID(),
                "/profile"
        );
        assertTrue(allowed.isPresent(), "Enabled review notification should be created");
    }
}
