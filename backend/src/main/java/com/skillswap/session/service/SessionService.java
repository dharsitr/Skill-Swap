package com.skillswap.session.service;

import com.skillswap.common.exception.ApiException;
import com.skillswap.common.exception.ResourceNotFoundException;
import com.skillswap.common.response.PageResponse;
import com.skillswap.exchange.dto.ExchangeParticipantDto;
import com.skillswap.exchange.dto.ExchangeRequestSkillDto;
import com.skillswap.profile.entity.Profile;
import com.skillswap.profile.repository.ProfileRepository;
import com.skillswap.session.dto.SessionResponse;
import com.skillswap.session.entity.Session;
import com.skillswap.session.entity.SessionStatus;
import com.skillswap.session.repository.SessionRepository;
import com.skillswap.user.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class SessionService {

    private static final Logger log = LoggerFactory.getLogger(SessionService.class);

    private final SessionRepository sessionRepository;
    private final ProfileRepository profileRepository;
    private final com.skillswap.notification.service.NotificationService notificationService;

    public SessionService(
            SessionRepository sessionRepository,
            ProfileRepository profileRepository,
            com.skillswap.notification.service.NotificationService notificationService
    ) {
        this.sessionRepository = sessionRepository;
        this.profileRepository = profileRepository;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public PageResponse<SessionResponse> getMySessions(
            UUID currentUserId,
            SessionStatus status,
            Pageable pageable
    ) {
        Page<Session> page = (status != null)
                ? sessionRepository.findByParticipantAndStatus(currentUserId, status, pageable)
                : sessionRepository.findByParticipant(currentUserId, pageable);

        return mapPageToResponse(page);
    }

    @Transactional(readOnly = true)
    public SessionResponse getSession(UUID currentUserId, UUID sessionId) {
        Session session = sessionRepository.findByIdWithDetails(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", sessionId));

        validateParticipant(session, currentUserId);
        return mapToResponse(session);
    }

    @Transactional
    public SessionResponse startSession(UUID currentUserId, UUID sessionId) {
        Session session = sessionRepository.findByIdWithDetails(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", sessionId));

        validateParticipant(session, currentUserId);

        if (session.getStatus() != SessionStatus.SCHEDULED) {
            throw new ApiException(HttpStatus.CONFLICT, "Only scheduled sessions can be started");
        }

        session.setStatus(SessionStatus.IN_PROGRESS);
        Session saved = sessionRepository.save(session);
        log.info("Started Session id: {} by user: {}", saved.getId(), currentUserId);

        try {
            UUID partnerId = session.getTeacher().getId().equals(currentUserId)
                    ? session.getLearner().getId()
                    : session.getTeacher().getId();
            notificationService.createNotification(
                    partnerId,
                    com.skillswap.notification.entity.NotificationType.SESSION_STARTED,
                    "Session Started",
                    "Your session for " + session.getSkill().getName() + " has started.",
                    "SESSION",
                    saved.getId(),
                    "/sessions/" + saved.getId()
            );
        } catch (Exception e) {
            log.warn("Failed to create session started notification: {}", e.getMessage());
        }

        return mapToResponse(saved);
    }

    @Transactional
    public SessionResponse completeSession(UUID currentUserId, UUID sessionId) {
        Session session = sessionRepository.findByIdWithDetails(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", sessionId));

        validateParticipant(session, currentUserId);

        if (session.getStatus() != SessionStatus.IN_PROGRESS) {
            throw new ApiException(HttpStatus.CONFLICT, "Only in-progress sessions can be completed");
        }

        session.setStatus(SessionStatus.COMPLETED);
        Session saved = sessionRepository.save(session);
        log.info("Completed Session id: {} by user: {}", saved.getId(), currentUserId);

        try {
            UUID partnerId = session.getTeacher().getId().equals(currentUserId)
                    ? session.getLearner().getId()
                    : session.getTeacher().getId();
            notificationService.createNotification(
                    partnerId,
                    com.skillswap.notification.entity.NotificationType.SESSION_COMPLETED,
                    "Session Completed",
                    "Your session for " + session.getSkill().getName() + " has been completed. Leave a review to help the community!",
                    "SESSION",
                    saved.getId(),
                    "/sessions/" + saved.getId()
            );
        } catch (Exception e) {
            log.warn("Failed to create session completed notification: {}", e.getMessage());
        }

        return mapToResponse(saved);
    }

    @Transactional
    public SessionResponse cancelSession(UUID currentUserId, UUID sessionId) {
        Session session = sessionRepository.findByIdWithDetails(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", sessionId));

        validateParticipant(session, currentUserId);

        if (session.getStatus() != SessionStatus.SCHEDULED) {
            throw new ApiException(HttpStatus.CONFLICT, "Only scheduled sessions can be cancelled");
        }

        session.setStatus(SessionStatus.CANCELLED);
        Session saved = sessionRepository.save(session);
        log.info("Cancelled Session id: {} by user: {}", saved.getId(), currentUserId);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public com.skillswap.session.dto.SessionCallAccessResponse verifyCallAccess(UUID currentUserId, UUID sessionId) {
        Session session = sessionRepository.findByIdWithDetails(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", sessionId));

        validateParticipant(session, currentUserId);

        if (session.getStatus() != SessionStatus.SCHEDULED && session.getStatus() != SessionStatus.IN_PROGRESS) {
            throw new ApiException(HttpStatus.CONFLICT, "Session status " + session.getStatus() + " does not allow video calling");
        }

        boolean isTeacher = session.getTeacher().getId().equals(currentUserId);
        String role = isTeacher ? "TEACHER" : "LEARNER";
        boolean isInitiator = isTeacher; // Teacher initiates offer deterministically

        User partner = isTeacher ? session.getLearner() : session.getTeacher();
        Profile partnerProfile = profileRepository.findByUserId(partner.getId()).orElse(null);
        String partnerName = partnerProfile != null ? partnerProfile.getDisplayName() : "Student";
        String partnerAvatar = partnerProfile != null ? partnerProfile.getAvatarUrl() : null;

        return new com.skillswap.session.dto.SessionCallAccessResponse(
                session.getId(),
                true,
                role,
                isInitiator,
                partner.getId(),
                partnerName,
                partnerAvatar,
                session.getSkill().getName(),
                session.getStatus()
        );
    }

    private void validateParticipant(Session session, UUID currentUserId) {
        boolean isParticipant = session.getTeacher().getId().equals(currentUserId)
                || session.getLearner().getId().equals(currentUserId);
        if (!isParticipant) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You are not a participant in this session");
        }
    }

    private SessionResponse mapToResponse(Session session) {
        Profile teacherProfile = profileRepository.findByUserId(session.getTeacher().getId()).orElse(null);
        Profile learnerProfile = profileRepository.findByUserId(session.getLearner().getId()).orElse(null);

        ExchangeParticipantDto teacherDto = toParticipantDto(session.getTeacher(), teacherProfile);
        ExchangeParticipantDto learnerDto = toParticipantDto(session.getLearner(), learnerProfile);
        ExchangeRequestSkillDto skillDto = new ExchangeRequestSkillDto(
                session.getSkill().getId(),
                session.getSkill().getName(),
                session.getSkill().getCategory() != null ? session.getSkill().getCategory().getName() : null
        );

        return new SessionResponse(
                session.getId(),
                session.getExchangeRequest().getId(),
                teacherDto,
                learnerDto,
                skillDto,
                session.getStatus(),
                session.getCreatedAt(),
                session.getUpdatedAt()
        );
    }

    private PageResponse<SessionResponse> mapPageToResponse(Page<Session> page) {
        if (page.isEmpty()) {
            return PageResponse.of(Collections.emptyList(), page.getNumber(), page.getSize(), page.getTotalElements());
        }

        Set<UUID> userIds = new HashSet<>();
        for (Session s : page.getContent()) {
            userIds.add(s.getTeacher().getId());
            userIds.add(s.getLearner().getId());
        }

        Map<UUID, Profile> profileMap = profileRepository.findByUserIds(userIds)
                .stream()
                .collect(Collectors.toMap(p -> p.getUser().getId(), p -> p, (a, b) -> a));

        List<SessionResponse> items = page.getContent().stream().map(s -> {
            ExchangeParticipantDto teacherDto = toParticipantDto(s.getTeacher(), profileMap.get(s.getTeacher().getId()));
            ExchangeParticipantDto learnerDto = toParticipantDto(s.getLearner(), profileMap.get(s.getLearner().getId()));
            ExchangeRequestSkillDto skillDto = new ExchangeRequestSkillDto(
                    s.getSkill().getId(),
                    s.getSkill().getName(),
                    s.getSkill().getCategory() != null ? s.getSkill().getCategory().getName() : null
            );

            return new SessionResponse(
                    s.getId(),
                    s.getExchangeRequest().getId(),
                    teacherDto,
                    learnerDto,
                    skillDto,
                    s.getStatus(),
                    s.getCreatedAt(),
                    s.getUpdatedAt()
            );
        }).toList();

        return PageResponse.of(items, page.getNumber(), page.getSize(), page.getTotalElements());
    }


    private ExchangeParticipantDto toParticipantDto(User user, Profile profile) {
        if (profile == null) {
            return new ExchangeParticipantDto(
                    user.getId(),
                    "Student",
                    null,
                    "Campus",
                    null,
                    null
            );
        }

        return new ExchangeParticipantDto(
                user.getId(),
                profile.getDisplayName(),
                profile.getAvatarUrl(),
                profile.getCollegeName(),
                profile.getDepartment(),
                profile.getYearOfStudy()
        );
    }
}
