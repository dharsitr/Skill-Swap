package com.skillswap.availability;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillswap.availability.dto.CreateAvailabilityRequest;
import com.skillswap.availability.dto.UpdateAvailabilityRequest;
import com.skillswap.availability.entity.UserAvailability;
import com.skillswap.availability.repository.UserAvailabilityRepository;
import com.skillswap.common.security.AuthenticatedUserPrincipal;
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

import java.time.DayOfWeek;
import java.time.LocalTime;
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
class AvailabilityControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserService userService;

    @Autowired
    private UserAvailabilityRepository availabilityRepository;

    private User studentUser;

    @BeforeEach
    void setUp() {
        studentUser = userService.getOrCreateUser("auth-student-" + UUID.randomUUID(), "Alice Student", "MIT");
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
    @DisplayName("GET /api/v1/availability/me returns availability slots for authenticated user")
    void testGetMyAvailability_Success() throws Exception {
        UserAvailability slot = new UserAvailability(
                studentUser,
                DayOfWeek.MONDAY,
                LocalTime.of(9, 0),
                LocalTime.of(12, 0),
                "UTC",
                true
        );
        availabilityRepository.save(slot);

        mockMvc.perform(get("/api/v1/availability/me")
                        .with(authentication(createAuthToken(studentUser))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].dayOfWeek", is("MONDAY")))
                .andExpect(jsonPath("$[0].startTime", is("09:00:00")))
                .andExpect(jsonPath("$[0].endTime", is("12:00:00")));
    }

    @Test
    @DisplayName("POST /api/v1/availability creates a new availability slot")
    void testCreateAvailability_Success() throws Exception {
        CreateAvailabilityRequest request = new CreateAvailabilityRequest(
                DayOfWeek.WEDNESDAY,
                LocalTime.of(14, 0),
                LocalTime.of(17, 0),
                "UTC",
                true
        );

        mockMvc.perform(post("/api/v1/availability")
                        .with(authentication(createAuthToken(studentUser)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.dayOfWeek", is("WEDNESDAY")))
                .andExpect(jsonPath("$.startTime", is("14:00:00")))
                .andExpect(jsonPath("$.endTime", is("17:00:00")))
                .andExpect(jsonPath("$.active", is(true)));
    }

    @Test
    @DisplayName("PUT /api/v1/availability/{id} updates existing slot")
    void testUpdateAvailability_Success() throws Exception {
        UserAvailability slot = availabilityRepository.save(new UserAvailability(
                studentUser,
                DayOfWeek.THURSDAY,
                LocalTime.of(10, 0),
                LocalTime.of(12, 0),
                "UTC",
                true
        ));

        UpdateAvailabilityRequest request = new UpdateAvailabilityRequest(
                DayOfWeek.THURSDAY,
                LocalTime.of(11, 0),
                LocalTime.of(14, 0),
                "UTC",
                true
        );

        mockMvc.perform(put("/api/v1/availability/" + slot.getId())
                        .with(authentication(createAuthToken(studentUser)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.startTime", is("11:00:00")))
                .andExpect(jsonPath("$.endTime", is("14:00:00")));
    }

    @Test
    @DisplayName("DELETE /api/v1/availability/{id} deletes slot")
    void testDeleteAvailability_Success() throws Exception {
        UserAvailability slot = availabilityRepository.save(new UserAvailability(
                studentUser,
                DayOfWeek.FRIDAY,
                LocalTime.of(15, 0),
                LocalTime.of(18, 0),
                "UTC",
                true
        ));

        mockMvc.perform(delete("/api/v1/availability/" + slot.getId())
                        .with(authentication(createAuthToken(studentUser))))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/availability/me")
                        .with(authentication(createAuthToken(studentUser))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }
}
