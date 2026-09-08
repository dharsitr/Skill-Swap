package com.skillswap.scheduling;

import com.skillswap.common.exception.ApiException;
import com.skillswap.common.exception.ResourceConflictException;
import com.skillswap.exchange.entity.ExchangeRequest;
import com.skillswap.exchange.entity.ExchangeRequestStatus;
import com.skillswap.exchange.repository.ExchangeRequestRepository;
import com.skillswap.notification.entity.NotificationType;
import com.skillswap.notification.repository.NotificationRepository;
import com.skillswap.scheduling.dto.RescheduleSessionRequest;
import com.skillswap.scheduling.dto.ScheduleSessionRequest;
import com.skillswap.scheduling.dto.SessionScheduleResponse;
import com.skillswap.scheduling.service.SchedulingService;
import com.skillswap.session.entity.Session;
import com.skillswap.session.entity.SessionStatus;
import com.skillswap.session.repository.SessionRepository;
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
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class SchedulingServiceTest {

    @Autowired
    private SchedulingService schedulingService;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private ExchangeRequestRepository exchangeRequestRepository;

    @Autowired
    private SkillCategoryRepository categoryRepository;

    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private NotificationRepository notificationRepository;

    private User teacher;
    private User learner;
    private Session session;
    private UUID sessionId;

    @BeforeEach
    void setUp() {
        teacher = userService.getOrCreateUser("auth-teacher-" + UUID.randomUUID(), "Prof Alex", "MIT");
        learner = userService.getOrCreateUser("auth-learner-" + UUID.randomUUID(), "Student Jordan", "Harvard");

        SkillCategory category = categoryRepository.save(new SkillCategory(null, "CS-" + UUID.randomUUID(), "Computer Science"));
        Skill skill = skillRepository.save(new Skill(null, category, "Distributed Systems-" + UUID.randomUUID(), "Core CS"));

        ExchangeRequest req = exchangeRequestRepository.save(new ExchangeRequest(
                null,
                learner,
                teacher,
                skill,
                "Need help with distributed consensus",
                ExchangeRequestStatus.ACCEPTED
        ));

        session = sessionRepository.save(new Session(
                null,
                req,
                teacher,
                learner,
                skill,
                SessionStatus.SCHEDULED
        ));
        sessionId = session.getId();
    }

    @Test
    @DisplayName("Successfully schedules session and creates counterpart notification")
    void scheduleSession_Success() {
        Instant start = Instant.now().plus(2, ChronoUnit.DAYS);
        Instant end = start.plus(1, ChronoUnit.HOURS);
        ScheduleSessionRequest request = new ScheduleSessionRequest(start, end, "UTC");

        SessionScheduleResponse response = schedulingService.scheduleSession(teacher.getId(), sessionId, request);

        assertThat(response).isNotNull();
        assertThat(response.getSessionId()).isEqualTo(sessionId);
        assertThat(response.getStartAt()).isEqualTo(start);
        assertThat(response.getEndAt()).isEqualTo(end);
        assertThat(response.getStatus()).isEqualTo("SCHEDULED");

        var notifs = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(learner.getId(), org.springframework.data.domain.Pageable.unpaged()).getContent();
        assertThat(notifs).isNotEmpty();
        assertThat(notifs.get(0).getType()).isEqualTo(NotificationType.SESSION_SCHEDULED);
        assertThat(notifs.get(0).getTitle()).isEqualTo("Session Scheduled");
    }

    @Test
    @DisplayName("Fails when an unauthorized non-participant attempts to schedule")
    void scheduleSession_NonParticipant_ThrowsForbidden() {
        User stranger = userService.getOrCreateUser("auth-stranger-" + UUID.randomUUID(), "Stranger", "Stanford");

        Instant start = Instant.now().plus(1, ChronoUnit.DAYS);
        Instant end = start.plus(1, ChronoUnit.HOURS);
        ScheduleSessionRequest request = new ScheduleSessionRequest(start, end, "UTC");

        assertThatThrownBy(() -> schedulingService.scheduleSession(stranger.getId(), sessionId, request))
                .isInstanceOf(ApiException.class)
                .extracting("status")
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("Fails when scheduled start time is in the past")
    void scheduleSession_StartTimeInPast_ThrowsBadRequest() {
        Instant start = Instant.now().minus(1, ChronoUnit.HOURS);
        Instant end = Instant.now().plus(1, ChronoUnit.HOURS);
        ScheduleSessionRequest request = new ScheduleSessionRequest(start, end, "UTC");

        assertThatThrownBy(() -> schedulingService.scheduleSession(teacher.getId(), sessionId, request))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Scheduled start time must be in the future")
                .extracting("status")
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("Fails when end time is before start time")
    void scheduleSession_EndBeforeStart_ThrowsBadRequest() {
        Instant start = Instant.now().plus(1, ChronoUnit.DAYS);
        Instant end = start.minus(30, ChronoUnit.MINUTES);
        ScheduleSessionRequest request = new ScheduleSessionRequest(start, end, "UTC");

        assertThatThrownBy(() -> schedulingService.scheduleSession(teacher.getId(), sessionId, request))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Session end time must be after start time")
                .extracting("status")
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("Fails when session has already been cancelled")
    void scheduleSession_CancelledSession_ThrowsBadRequest() {
        session.setStatus(SessionStatus.CANCELLED);
        sessionRepository.save(session);

        Instant start = Instant.now().plus(1, ChronoUnit.DAYS);
        Instant end = start.plus(1, ChronoUnit.HOURS);
        ScheduleSessionRequest request = new ScheduleSessionRequest(start, end, "UTC");

        assertThatThrownBy(() -> schedulingService.scheduleSession(teacher.getId(), sessionId, request))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Cancelled sessions cannot be scheduled or rescheduled")
                .extracting("status")
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("Fails when teacher has an overlapping scheduled session")
    void scheduleSession_TeacherConflict_ThrowsConflict() {
        Instant start = Instant.now().plus(1, ChronoUnit.DAYS);
        Instant end = start.plus(1, ChronoUnit.HOURS);

        // Schedule first session
        ScheduleSessionRequest firstReq = new ScheduleSessionRequest(start, end, "UTC");
        schedulingService.scheduleSession(teacher.getId(), sessionId, firstReq);

        // Create a second session involving teacher
        User student2 = userService.getOrCreateUser("auth-s2-" + UUID.randomUUID(), "Student Two", "MIT");
        ExchangeRequest req2 = exchangeRequestRepository.save(new ExchangeRequest(
                null,
                student2,
                teacher,
                session.getSkill(),
                "Second request",
                ExchangeRequestStatus.ACCEPTED
        ));
        Session session2 = sessionRepository.save(new Session(
                null,
                req2,
                teacher,
                student2,
                session.getSkill(),
                SessionStatus.SCHEDULED
        ));

        // Attempting to schedule session2 at overlapping time should fail
        ScheduleSessionRequest conflictingReq = new ScheduleSessionRequest(
                start.plus(15, ChronoUnit.MINUTES),
                end.plus(15, ChronoUnit.MINUTES),
                "UTC"
        );

        assertThatThrownBy(() -> schedulingService.scheduleSession(teacher.getId(), session2.getId(), conflictingReq))
                .isInstanceOf(ResourceConflictException.class)
                .hasMessageContaining("Session time conflicts with an existing scheduled session for the teacher");
    }

    @Test
    @DisplayName("Successfully reschedules an active session and notifies counterpart")
    void rescheduleSession_Success() {
        Instant start = Instant.now().plus(1, ChronoUnit.DAYS);
        Instant end = start.plus(1, ChronoUnit.HOURS);
        ScheduleSessionRequest firstReq = new ScheduleSessionRequest(start, end, "UTC");
        schedulingService.scheduleSession(teacher.getId(), sessionId, firstReq);

        Instant newStart = Instant.now().plus(3, ChronoUnit.DAYS);
        Instant newEnd = newStart.plus(1, ChronoUnit.HOURS);
        RescheduleSessionRequest reschedReq = new RescheduleSessionRequest(newStart, newEnd, "UTC", "Conflict with midterms");

        SessionScheduleResponse response = schedulingService.rescheduleSession(learner.getId(), sessionId, reschedReq);

        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo("RESCHEDULED");
        assertThat(response.getStartAt()).isEqualTo(newStart);

        var notifs = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(teacher.getId(), org.springframework.data.domain.Pageable.unpaged()).getContent();
        assertThat(notifs).isNotEmpty();
        assertThat(notifs.get(0).getType()).isEqualTo(NotificationType.SESSION_RESCHEDULED);
        assertThat(notifs.get(0).getTitle()).isEqualTo("Session Rescheduled");
        assertThat(notifs.get(0).getMessage()).contains("Conflict with midterms");
    }
}
