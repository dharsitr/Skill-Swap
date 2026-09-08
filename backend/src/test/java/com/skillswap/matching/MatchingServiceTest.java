package com.skillswap.matching;

import com.skillswap.discovery.entity.DiscoveryMode;
import com.skillswap.matching.dto.MatchScoreResult;
import com.skillswap.matching.service.AvailabilityScorer;
import com.skillswap.matching.service.MatchingService;
import com.skillswap.matching.service.RatingScorer;
import com.skillswap.skill.entity.Skill;
import com.skillswap.skill.entity.SkillCategory;
import com.skillswap.skill.entity.SkillProficiency;
import com.skillswap.skill.entity.SkillRelationshipType;
import com.skillswap.skill.entity.UserSkill;
import com.skillswap.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class MatchingServiceTest {

    private MatchingService matchingService;
    private SkillCategory programmingCategory;
    private SkillCategory designCategory;
    private Skill pythonSkill;
    private Skill figmaSkill;
    private Skill reactSkill;

    @BeforeEach
    void setUp() {
        AvailabilityScorer availabilityScorer = new AvailabilityScorer();
        RatingScorer ratingScorer = new RatingScorer();
        matchingService = new MatchingService(availabilityScorer, ratingScorer);

        programmingCategory = new SkillCategory(UUID.randomUUID(), "Programming", "Coding skills");
        designCategory = new SkillCategory(UUID.randomUUID(), "Design", "Design skills");

        pythonSkill = new Skill(UUID.randomUUID(), programmingCategory, "Python", "Python programming");
        figmaSkill = new Skill(UUID.randomUUID(), designCategory, "Figma", "UI design with Figma");
        reactSkill = new Skill(UUID.randomUUID(), programmingCategory, "React", "Frontend React");
    }

    @Test
    @DisplayName("Exact skill match in LEARN mode should yield high score and explainable reasons")
    void shouldScoreExactLearnMatch() {
        UUID userAId = UUID.randomUUID();
        User userA = new User("auth-a");
        userA.setId(userAId);

        UUID userBId = UUID.randomUUID();
        User userB = new User("auth-b");
        userB.setId(userBId);

        // User A wants to LEARN Python (Beginner)
        UserSkill userALearnPython = new UserSkill(
                UUID.randomUUID(),
                userA,
                pythonSkill,
                SkillRelationshipType.LEARN,
                SkillProficiency.BEGINNER,
                "Want to learn Python basics"
        );

        // User B TEACHES Python (Advanced)
        UserSkill userBTeachPython = new UserSkill(
                UUID.randomUUID(),
                userB,
                pythonSkill,
                SkillRelationshipType.TEACH,
                SkillProficiency.ADVANCED,
                "Experienced with Python"
        );

        MatchScoreResult result = matchingService.calculateMatch(
                userAId,
                List.of(userALearnPython),
                userBId,
                List.of(userBTeachPython),
                DiscoveryMode.LEARN,
                null
        );

        assertTrue(result.getTotalScore() >= 50, "Expected score >= 50 for direct skill match");
        assertTrue(result.getMatchedSkills().contains("Python"));
        assertTrue(result.getExplanation().stream().anyMatch(e -> e.contains("Python")));
        assertTrue(result.getExplanation().stream().anyMatch(e -> e.contains("Advanced")));
    }

    @Test
    @DisplayName("Two-way reciprocal match should yield high match score and note 2-way match")
    void shouldScoreReciprocalMatch() {
        UUID userAId = UUID.randomUUID();
        User userA = new User("auth-a");
        userA.setId(userAId);

        UUID userBId = UUID.randomUUID();
        User userB = new User("auth-b");
        userB.setId(userBId);

        // User A: TEACH Figma (Expert), LEARN Python (Beginner)
        UserSkill aTeachFigma = new UserSkill(UUID.randomUUID(), userA, figmaSkill, SkillRelationshipType.TEACH, SkillProficiency.EXPERT, null);
        UserSkill aLearnPython = new UserSkill(UUID.randomUUID(), userA, pythonSkill, SkillRelationshipType.LEARN, SkillProficiency.BEGINNER, null);

        // User B: TEACH Python (Advanced), LEARN Figma (Beginner)
        UserSkill bTeachPython = new UserSkill(UUID.randomUUID(), userB, pythonSkill, SkillRelationshipType.TEACH, SkillProficiency.ADVANCED, null);
        UserSkill bLearnFigma = new UserSkill(UUID.randomUUID(), userB, figmaSkill, SkillRelationshipType.LEARN, SkillProficiency.BEGINNER, null);

        MatchScoreResult result = matchingService.calculateMatch(
                userAId,
                List.of(aTeachFigma, aLearnPython),
                userBId,
                List.of(bTeachPython, bLearnFigma),
                DiscoveryMode.GENERAL,
                null
        );

        assertTrue(result.getTotalScore() >= 80, "Reciprocal match should produce high score >= 80");
        assertTrue(result.getMatchedSkills().contains("Python"));
        assertTrue(result.getMatchedSkills().contains("Figma"));
        assertTrue(result.getExplanation().stream().anyMatch(e -> e.toLowerCase().contains("2-way")));
    }

    @Test
    @DisplayName("Matching engine must be strictly deterministic")
    void shouldBeDeterministic() {
        UUID userAId = UUID.randomUUID();
        User userA = new User("auth-a");
        userA.setId(userAId);

        UUID userBId = UUID.randomUUID();
        User userB = new User("auth-b");
        userB.setId(userBId);

        UserSkill aLearn = new UserSkill(UUID.randomUUID(), userA, reactSkill, SkillRelationshipType.LEARN, SkillProficiency.INTERMEDIATE, null);
        UserSkill bTeach = new UserSkill(UUID.randomUUID(), userB, reactSkill, SkillRelationshipType.TEACH, SkillProficiency.EXPERT, null);

        MatchScoreResult run1 = matchingService.calculateMatch(userAId, List.of(aLearn), userBId, List.of(bTeach), DiscoveryMode.LEARN, null);
        MatchScoreResult run2 = matchingService.calculateMatch(userAId, List.of(aLearn), userBId, List.of(bTeach), DiscoveryMode.LEARN, null);

        assertEquals(run1.getTotalScore(), run2.getTotalScore());
        assertEquals(run1.getMatchedSkills(), run2.getMatchedSkills());
        assertEquals(run1.getExplanation(), run2.getExplanation());
    }
}
