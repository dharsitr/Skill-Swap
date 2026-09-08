package com.skillswap.scheduling.service;

import com.skillswap.common.exception.ApiException;
import com.skillswap.common.exception.ResourceConflictException;
import com.skillswap.common.exception.ResourceNotFoundException;
import com.skillswap.notification.entity.NotificationType;
import com.skillswap.notification.service.NotificationService;
import com.skillswap.profile.entity.Profile;
import com.skillswap.profile.repository.ProfileRepository;
import com.skillswap.scheduling.dto.RescheduleSessionRequest;
import com.skillswap.scheduling.dto.ScheduleSessionRequest;
import com.skillswap.scheduling.dto.SessionScheduleResponse;
import com.skillswap.scheduling.entity.SessionSchedule;
import com.skillswap.scheduling.repository.SessionScheduleRepository;
import com.skillswap.session.entity.Session;
import com.skillswap.session.entity.SessionStatus;
import com.skillswap.session.repository.SessionRepository;
import com.skillswap.user.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
public class SchedulingService {

    private static final Logger log = LoggerFactory.getLogger(SchedulingService.class);

    private final SessionScheduleRepository scheduleRepository;
    private final SessionRepository sessionRepository;
    private final ProfileRepository profileRepository;
    private final NotificationService notificationService;

    public SchedulingService(
            SessionScheduleRepository scheduleRepository,
            SessionRepository sessionRepository,
            ProfileRepository profileRepository,
            NotificationService notificationService
    ) {
        this.scheduleRepository = scheduleRepository;
        this.sessionRepository = sessionRepository;
        this.profileRepository = profileRepository;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public SessionScheduleResponse getSchedule(UUID userId, UUID sessionId) {
        findSessionAndValidateParticipant(userId, sessionId);
        SessionSchedule schedule = scheduleRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("No schedule found for session: " + sessionId));
        return mapToResponse(schedule);
    }

    @Transactional
    public SessionScheduleResponse scheduleSession(UUID userId, UUID sessionId, ScheduleSessionRequest request) {
        Session session = findSessionAndValidateParticipant(userId, sessionId);
        validateSessionState(session);
        validateTimeRange(request.getStartAt(), request.getEndAt());

        UUID teacherId = session.getTeacher().getId();
        UUID learnerId = session.getLearner().getId();
        validateNoConflict(teacherId, learnerId, request.getStartAt(), request.getEndAt(), session.getId());

        SessionSchedule schedule = scheduleRepository.findBySessionId(sessionId)
                .orElse(new SessionSchedule());

        schedule.setSession(session);
        schedule.setStartAt(request.getStartAt());
        schedule.setEndAt(request.getEndAt());
        schedule.setTimezone(request.getTimezone() != null && !request.getTimezone().isBlank() ? request.getTimezone() : "UTC");
        schedule.setStatus("SCHEDULED");

        SessionSchedule saved = scheduleRepository.save(schedule);
        log.info("Scheduled session {} from {} to {}", sessionId, request.getStartAt(), request.getEndAt());

        sendSchedulingNotification(session, userId, saved, false, null);

        return mapToResponse(saved);
    }

    @Transactional
    public SessionScheduleResponse rescheduleSession(UUID userId, UUID sessionId, RescheduleSessionRequest request) {
        Session session = findSessionAndValidateParticipant(userId, sessionId);
        validateSessionState(session);
        validateTimeRange(request.getStartAt(), request.getEndAt());

        UUID teacherId = session.getTeacher().getId();
        UUID learnerId = session.getLearner().getId();
        validateNoConflict(teacherId, learnerId, request.getStartAt(), request.getEndAt(), session.getId());

        SessionSchedule schedule = scheduleRepository.findBySessionId(sessionId)
                .orElse(new SessionSchedule());

        schedule.setSession(session);
        schedule.setStartAt(request.getStartAt());
        schedule.setEndAt(request.getEndAt());
        if (request.getTimezone() != null && !request.getTimezone().isBlank()) {
            schedule.setTimezone(request.getTimezone());
        }
        schedule.setStatus("RESCHEDULED");

        SessionSchedule saved = scheduleRepository.save(schedule);
        log.info("Rescheduled session {} to {} - {}", sessionId, request.getStartAt(), request.getEndAt());

        sendSchedulingNotification(session, userId, saved, true, request.getReason());

        return mapToResponse(saved);
    }

    private Session findSessionAndValidateParticipant(UUID userId, UUID sessionId) {
        Session session = sessionRepository.findByIdWithDetails(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + sessionId));

        boolean isParticipant = session.getTeacher().getId().equals(userId) ||
                               session.getLearner().getId().equals(userId);
        if (!isParticipant) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only session participants can schedule or reschedule this session");
        }

        return session;
    }

    private void validateSessionState(Session session) {
        if (session.getStatus() == SessionStatus.CANCELLED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cancelled sessions cannot be scheduled or rescheduled");
        }
        if (session.getStatus() == SessionStatus.COMPLETED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Completed sessions cannot be rescheduled");
        }
    }

    private void validateTimeRange(Instant startAt, Instant endAt) {
        if (startAt == null || endAt == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Start and end times are required");
        }
        if (startAt.isBefore(Instant.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Scheduled start time must be in the future");
        }
        if (!endAt.isAfter(startAt)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Session end time must be after start time");
        }
    }

    private void validateNoConflict(UUID teacherId, UUID learnerId, Instant startAt, Instant endAt, UUID currentSessionId) {
        List<SessionSchedule> teacherConflicts = scheduleRepository.findConflictingSchedulesForUser(
                teacherId, startAt, endAt, currentSessionId
        );
        if (!teacherConflicts.isEmpty()) {
            throw new ResourceConflictException("Session time conflicts with an existing scheduled session for the teacher");
        }

        List<SessionSchedule> learnerConflicts = scheduleRepository.findConflictingSchedulesForUser(
                learnerId, startAt, endAt, currentSessionId
        );
        if (!learnerConflicts.isEmpty()) {
            throw new ResourceConflictException("Session time conflicts with an existing scheduled session for the learner");
        }
    }

    private void sendSchedulingNotification(
            Session session,
            UUID initiatorId,
            SessionSchedule schedule,
            boolean isReschedule,
            String reason
    ) {
        User recipient = session.getTeacher().getId().equals(initiatorId)
                ? session.getLearner()
                : session.getTeacher();

        String initiatorName = profileRepository.findByUserId(initiatorId)
                .map(Profile::getDisplayName)
                .orElse("A participant");

        String skillName = session.getSkill() != null ? session.getSkill().getName() : "Skill Swap";

        String formattedTime;
        try {
            ZoneId zoneId = ZoneId.of(schedule.getTimezone());
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' hh:mm a").withZone(zoneId);
            formattedTime = formatter.format(schedule.getStartAt()) + " (" + schedule.getTimezone() + ")";
        } catch (Exception e) {
            formattedTime = schedule.getStartAt().toString();
        }

        NotificationType type = isReschedule
                ? NotificationType.SESSION_RESCHEDULED
                : NotificationType.SESSION_SCHEDULED;

        String title = isReschedule ? "Session Rescheduled" : "Session Scheduled";
        String message = isReschedule
                ? String.format("%s rescheduled the %s session to %s.%s",
                    initiatorName, skillName, formattedTime,
                    reason != null && !reason.isBlank() ? " Reason: " + reason : "")
                : String.format("%s scheduled a %s session for %s.",
                    initiatorName, skillName, formattedTime);

        notificationService.createNotification(
                recipient.getId(),
                type,
                title,
                message,
                "SESSION",
                session.getId(),
                "/sessions/" + session.getId()
        );
    }

    private SessionScheduleResponse mapToResponse(SessionSchedule schedule) {
        return new SessionScheduleResponse(
                schedule.getId(),
                schedule.getSession().getId(),
                schedule.getStartAt(),
                schedule.getEndAt(),
                schedule.getTimezone(),
                schedule.getStatus(),
                schedule.getCreatedAt(),
                schedule.getUpdatedAt()
        );
    }
}
