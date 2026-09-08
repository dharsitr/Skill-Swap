package com.skillswap.profile;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillswap.common.security.AuthenticatedUserPrincipal;
import com.skillswap.profile.dto.UpdateProfileRequest;
import com.skillswap.profile.entity.YearOfStudy;
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

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ProfileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserService userService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("GET /api/v1/profile/me without authentication should return 401 Unauthorized")
    void shouldReturn401WhenUnauthenticated() throws Exception {
        SecurityContextHolder.clearContext();
        mockMvc.perform(get("/api/v1/profile/me")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status", is(401)))
                .andExpect(jsonPath("$.error", is("Unauthorized")));
    }

    @Test
    @DisplayName("GET /api/v1/profile/me with authenticated principal should return student ProfileResponse")
    void shouldReturnCurrentProfileWhenAuthenticated() throws Exception {
        String authUserId = "auth-prof-" + UUID.randomUUID();
        User user = userService.getOrCreateUser(authUserId, "Alex Rivera", "Stanford University");

        AuthenticatedUserPrincipal principal = new AuthenticatedUserPrincipal(
                user.getId(),
                user.getAuthUserId(),
                "alex@example.com",
                user.getStatus()
        );

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                principal,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );

        mockMvc.perform(get("/api/v1/profile/me")
                        .with(authentication(auth))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.userId", is(user.getId().toString())))
                .andExpect(jsonPath("$.displayName", is("Alex Rivera")))
                .andExpect(jsonPath("$.collegeName", is("Stanford University")))
                .andExpect(jsonPath("$.yearOfStudy", is("FIRST_YEAR")));
    }

    @Test
    @DisplayName("PUT /api/v1/profile/me should successfully update profile fields")
    void shouldUpdateProfileSuccessfully() throws Exception {
        String authUserId = "auth-prof-" + UUID.randomUUID();
        User user = userService.getOrCreateUser(authUserId, "Original Name", "Original College");

        AuthenticatedUserPrincipal principal = new AuthenticatedUserPrincipal(
                user.getId(),
                user.getAuthUserId(),
                "student@example.com",
                user.getStatus()
        );

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                principal,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );

        UpdateProfileRequest updateRequest = new UpdateProfileRequest();
        updateRequest.setDisplayName("Updated Name");
        updateRequest.setCollegeName("MIT");
        updateRequest.setDepartment("Computer Science");
        updateRequest.setBio("Passionate about algorithms and web performance.");
        updateRequest.setYearOfStudy(YearOfStudy.THIRD_YEAR);
        updateRequest.setAvatarUrl("https://example.com/avatar.png");

        mockMvc.perform(put("/api/v1/profile/me")
                        .with(authentication(auth))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.displayName", is("Updated Name")))
                .andExpect(jsonPath("$.collegeName", is("MIT")))
                .andExpect(jsonPath("$.department", is("Computer Science")))
                .andExpect(jsonPath("$.bio", is("Passionate about algorithms and web performance.")))
                .andExpect(jsonPath("$.yearOfStudy", is("THIRD_YEAR")))
                .andExpect(jsonPath("$.avatarUrl", is("https://example.com/avatar.png")));
    }

    @Test
    @DisplayName("PUT /api/v1/profile/me with blank display name should return 400 Bad Request with validation errors")
    void shouldFailValidationOnBlankDisplayName() throws Exception {
        String authUserId = "auth-prof-" + UUID.randomUUID();
        User user = userService.getOrCreateUser(authUserId, "Valid Name", "College");

        AuthenticatedUserPrincipal principal = new AuthenticatedUserPrincipal(
                user.getId(),
                user.getAuthUserId(),
                "student@example.com",
                user.getStatus()
        );

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                principal,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );

        UpdateProfileRequest invalidRequest = new UpdateProfileRequest();
        invalidRequest.setDisplayName(""); // blank
        invalidRequest.setCollegeName("MIT");
        invalidRequest.setYearOfStudy(YearOfStudy.SECOND_YEAR);

        mockMvc.perform(put("/api/v1/profile/me")
                        .with(authentication(auth))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.validationErrors.displayName", notNullValue()));
    }
}
