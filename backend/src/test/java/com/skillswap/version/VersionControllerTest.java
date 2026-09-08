package com.skillswap.version;

import com.skillswap.version.dto.AppVersionResponse;
import com.skillswap.version.service.VersionService;
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
class VersionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private VersionService versionService;

    @Test
    @DisplayName("GET /api/v1/version should return 200 OK with name and version")
    void shouldReturnVersionInfo() throws Exception {
        mockMvc.perform(get("/api/v1/version")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.name", is("SkillSwap API")))
                .andExpect(jsonPath("$.version", is("0.1.0")));
    }

    @Test
    @DisplayName("VersionService unit test should return AppVersionResponse")
    void versionServiceShouldReturnConfiguredMetadata() {
        AppVersionResponse response = versionService.getVersionInfo();
        assertNotNull(response);
        assertEquals("SkillSwap API", response.getName());
        assertEquals("0.1.0", response.getVersion());
    }
}
