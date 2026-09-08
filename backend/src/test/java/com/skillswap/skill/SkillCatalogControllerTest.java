package com.skillswap.skill;

import com.skillswap.skill.entity.Skill;
import com.skillswap.skill.entity.SkillCategory;
import com.skillswap.skill.repository.SkillCategoryRepository;
import com.skillswap.skill.repository.SkillRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class SkillCatalogControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SkillCategoryRepository categoryRepository;

    @Autowired
    private SkillRepository skillRepository;

    private SkillCategory programmingCategory;
    private SkillCategory designCategory;
    private Skill pythonSkill;

    @BeforeEach
    void setUp() {
        programmingCategory = categoryRepository.save(new SkillCategory(null, "Programming", "Core coding languages"));
        designCategory = categoryRepository.save(new SkillCategory(null, "Design", "UI and UX"));

        pythonSkill = skillRepository.save(new Skill(null, programmingCategory, "Python", "Python scripting and data"));
        skillRepository.save(new Skill(null, programmingCategory, "Java", "Enterprise Java"));
        skillRepository.save(new Skill(null, designCategory, "Figma", "UI wireframing"));
    }

    @Test
    @DisplayName("GET /api/v1/skills/categories should return all categories")
    void shouldReturnAllCategories() throws Exception {
        mockMvc.perform(get("/api/v1/skills/categories")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.items", notNullValue()))
                .andExpect(jsonPath("$.items", hasSize(greaterThanOrEqualTo(2))))
                .andExpect(jsonPath("$.items[*].name", hasItems("Programming", "Design")));
    }

    @Test
    @DisplayName("GET /api/v1/skills should return all skills")
    void shouldReturnAllSkills() throws Exception {
        mockMvc.perform(get("/api/v1/skills")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.items", notNullValue()))
                .andExpect(jsonPath("$.items", hasSize(greaterThanOrEqualTo(3))))
                .andExpect(jsonPath("$.items[*].name", hasItems("Python", "Java", "Figma")));
    }

    @Test
    @DisplayName("GET /api/v1/skills with search query should filter case-insensitively")
    void shouldFilterSkillsBySearch() throws Exception {
        mockMvc.perform(get("/api/v1/skills")
                        .param("search", "py")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.items", notNullValue()))
                .andExpect(jsonPath("$.items[*].name", hasItem("Python")))
                .andExpect(jsonPath("$.items[*].name", not(hasItem("Java"))));
    }

    @Test
    @DisplayName("GET /api/v1/skills with categoryId should filter by category")
    void shouldFilterSkillsByCategory() throws Exception {
        mockMvc.perform(get("/api/v1/skills")
                        .param("categoryId", programmingCategory.getId().toString())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.items", notNullValue()))
                .andExpect(jsonPath("$.items[*].name", hasItems("Python", "Java")))
                .andExpect(jsonPath("$.items[*].name", not(hasItem("Figma"))));
    }

    @Test
    @DisplayName("GET /api/v1/skills/{id} should return skill details or 404")
    void shouldReturnSkillById() throws Exception {
        mockMvc.perform(get("/api/v1/skills/" + pythonSkill.getId())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(pythonSkill.getId().toString())))
                .andExpect(jsonPath("$.name", is("Python")))
                .andExpect(jsonPath("$.category.name", is("Programming")));
    }

    @Test
    @DisplayName("GET /api/v1/skills/{id} with non-existent id should return 404 Not Found")
    void shouldReturn404ForUnknownSkillId() throws Exception {
        UUID unknownId = UUID.randomUUID();
        mockMvc.perform(get("/api/v1/skills/" + unknownId)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.error", is("Not Found")));
    }
}
