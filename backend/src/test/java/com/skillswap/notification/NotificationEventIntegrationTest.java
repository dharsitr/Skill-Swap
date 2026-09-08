package com.skillswap.notification;

import com.skillswap.exchange.dto.CreateExchangeRequest;
import com.skillswap.exchange.service.ExchangeRequestService;
import com.skillswap.notification.entity.NotificationType;
import com.skillswap.notification.service.NotificationService;
import com.skillswap.review.dto.CreateReviewRequest;
import com.skillswap.review.service.ReviewService;
import com.skillswap.session.entity.Session;
import com.skillswap.session.repository.SessionRepository;
import com.skillswap.session.service.SessionService;
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
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class NotificationEventIntegrationTest {

    @Autowired
    private UserService userService;

    @Autowired
    private SkillCategoryRepository categoryRepository;

    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private UserSkillRepository userSkillRepository;

    @Autowired
    private ExchangeRequestService exchangeRequestService;

    @Autowired
    private SessionService sessionService;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private ReviewService reviewService;

    @Autowired
    private NotificationService notificationService;

    private User alice;
    private User bob;
    private Skill pythonSkill;

    @BeforeEach
    void setUp() {
        alice = userService.getOrCreateUser("auth-alice-events-" + UUID.randomUUID(), "Alice Student", "MIT");
        bob = userService.getOrCreateUser("auth-bob-events-" + UUID.randomUUID(), "Bob Tutor", "Stanford");

        SkillCategory techCat = categoryRepository.save(new SkillCategory(null, "Tech-" + UUID.randomUUID(), "Technical skills"));
        pythonSkill = skillRepository.save(new Skill(null, techCat, "Python Mastery-" + UUID.randomUUID(), "Python programming"));

        // Alice learns Python, Bob teaches Python
        userSkillRepository.save(new UserSkill(null, alice, pythonSkill, SkillRelationshipType.LEARN, SkillProficiency.BEGINNER, "Learn"));
        userSkillRepository.save(new UserSkill(null, bob, pythonSkill, SkillRelationshipType.TEACH, SkillProficiency.EXPERT, "Teach"));
    }

    @Test
    @DisplayName("Exchange request lifecycle generates persistent recipient & requester notifications")
    void testExchangeRequestAndSessionAndReviewNotificationFlow() {
        // Step 1: Alice creates exchange request for Bob
        var req = exchangeRequestService.createRequest(alice.getId(), new CreateExchangeRequest(bob.getId(), pythonSkill.getId(), "Let's learn!"));

        // Bob should receive EXCHANGE_REQUEST_RECEIVED
        var bobNotifs = notificationService.getMyNotifications(bob.getId(), null, Pageable.unpaged());
        assertEquals(1, bobNotifs.getItems().size());
        assertEquals(NotificationType.EXCHANGE_REQUEST_RECEIVED, bobNotifs.getItems().get(0).type());

        // Step 2: Bob accepts the request
        exchangeRequestService.acceptRequest(bob.getId(), req.getId());

        // Alice should receive EXCHANGE_REQUEST_ACCEPTED & SESSION_CREATED
        var aliceNotifs = notificationService.getMyNotifications(alice.getId(), null, Pageable.unpaged());
        assertEquals(2, aliceNotifs.getItems().size());
        assertTrue(aliceNotifs.getItems().stream().anyMatch(n -> n.type() == NotificationType.EXCHANGE_REQUEST_ACCEPTED));
        assertTrue(aliceNotifs.getItems().stream().anyMatch(n -> n.type() == NotificationType.SESSION_CREATED));

        // Step 3: Session starts and completes
        Session session = sessionRepository.findAll().stream()
                .filter(s -> s.getExchangeRequest().getId().equals(req.getId()))
                .findFirst()
                .orElseThrow();

        sessionService.startSession(bob.getId(), session.getId());
        sessionService.completeSession(bob.getId(), session.getId());

        // Alice should receive SESSION_STARTED and SESSION_COMPLETED notifications
        var aliceUpdatedNotifs = notificationService.getMyNotifications(alice.getId(), null, Pageable.unpaged());
        assertTrue(aliceUpdatedNotifs.getItems().stream().anyMatch(n -> n.type() == NotificationType.SESSION_STARTED));
        assertTrue(aliceUpdatedNotifs.getItems().stream().anyMatch(n -> n.type() == NotificationType.SESSION_COMPLETED));

        // Step 4: Alice reviews Bob
        reviewService.createReview(alice.getId(), new CreateReviewRequest(session.getId(), 5, "Outstanding teacher!"));

        // Bob should receive REVIEW_RECEIVED notification
        var bobUpdatedNotifs = notificationService.getMyNotifications(bob.getId(), null, Pageable.unpaged());
        assertTrue(bobUpdatedNotifs.getItems().stream().anyMatch(n -> n.type() == NotificationType.REVIEW_RECEIVED));
    }
}
