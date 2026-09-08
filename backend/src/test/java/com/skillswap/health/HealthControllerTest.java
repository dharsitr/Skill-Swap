package com.skillswap.health;

import com.skillswap.health.dto.HealthStatusResponse;
import com.skillswap.health.dto.ReadinessResponse;
import com.skillswap.health.service.HealthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class HealthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private HealthService healthService;

    @Test
    @DisplayName("GET /api/v1/health should return 200 OK with status UP")
    void shouldReturnHealthStatusUp() throws Exception {
        mockMvc.perform(get("/api/v1/health")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status", is("UP")));
    }

    @Test
    @DisplayName("GET /api/v1/health/live should return 200 OK with status UP")
    void shouldReturnLivenessProbe() throws Exception {
        mockMvc.perform(get("/api/v1/health/live")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("UP")));
    }

    @Test
    @DisplayName("GET /api/v1/health/ready should return 200 OK and database UP when DB is connected")
    void shouldReturnReadinessProbe() throws Exception {
        mockMvc.perform(get("/api/v1/health/ready")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("READY")))
                .andExpect(jsonPath("$.database", is("UP")));
    }

    @Test
    @DisplayName("HealthService unit test should return HealthStatusResponse with UP")
    void healthServiceShouldReturnUp() {
        HealthStatusResponse response = healthService.getHealthStatus();
        assertNotNull(response);
        assertEquals("UP", response.getStatus());

        ReadinessResponse readiness = healthService.getReadinessStatus();
        assertNotNull(readiness);
        assertEquals("READY", readiness.getStatus());
        assertEquals("UP", readiness.getDatabase());
    }
}
