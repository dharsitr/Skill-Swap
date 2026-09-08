package com.skillswap.safety.service;

import com.skillswap.common.exception.ApiException;
import com.skillswap.common.exception.ResourceNotFoundException;
import com.skillswap.common.response.PageResponse;
import com.skillswap.profile.entity.Profile;
import com.skillswap.profile.repository.ProfileRepository;
import com.skillswap.safety.dto.CreateDisputeRequest;
import com.skillswap.safety.dto.DisputeResponse;
import com.skillswap.safety.dto.ModerationDisputeDetailResponse;
import com.skillswap.safety.dto.UpdateDisputeStatusRequest;
import com.skillswap.safety.entity.Dispute;
import com.skillswap.safety.entity.DisputeStatus;
import com.skillswap.safety.repository.DisputeRepository;
import com.skillswap.session.entity.Session;
import com.skillswap.session.repository.SessionRepository;
import com.skillswap.user.entity.User;
import com.skillswap.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DisputeService {

    private static final Logger log = LoggerFactory.getLogger(DisputeService.class);

    private final DisputeRepository disputeRepository;
    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final com.skillswap.notification.service.NotificationService notificationService;

    public DisputeService(
            DisputeRepository disputeRepository,
            SessionRepository sessionRepository,
            UserRepository userRepository,
            ProfileRepository profileRepository,
            com.skillswap.notification.service.NotificationService notificationService
    ) {
        this.disputeRepository = disputeRepository;
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public DisputeResponse createDispute(UUID userId, CreateDisputeRequest request) {
        Session session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", request.getSessionId()));

        boolean isTeacher = session.getTeacher().getId().equals(userId);
        boolean isLearner = session.getLearner().getId().equals(userId);

        if (!isTeacher && !isLearner) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You are not a participant in this session");
        }

        if (disputeRepository.existsBySessionIdAndCreatedById(request.getSessionId(), userId)) {
            throw new ApiException(HttpStatus.CONFLICT, "You have already raised a dispute for this session");
        }

        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        String trimmedDescription = request.getDescription().trim();
        String sanitizedDescription = com.skillswap.common.util.InputSanitizer.sanitize(trimmedDescription, 2000);
        if (sanitizedDescription == null || sanitizedDescription.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Dispute description cannot be blank");
        }
        if (sanitizedDescription.length() > 2000) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Dispute description cannot exceed 2000 characters");
        }

        Dispute dispute = new Dispute(session, creator, request.getReason(), sanitizedDescription);
        Dispute saved = disputeRepository.save(dispute);

        log.info("User {} created dispute id: {} for session: {} (reason: {})",
                userId, saved.getId(), session.getId(), request.getReason());

        Profile creatorProfile = profileRepository.findByUserId(userId).orElse(null);
        return DisputeResponse.fromEntity(saved, creatorProfile);
    }

    @Transactional(readOnly = true)
    public PageResponse<DisputeResponse> getMyDisputes(UUID userId, Pageable pageable) {
        Page<Dispute> page = disputeRepository.findByCreatedByIdOrderByCreatedAtDesc(userId, pageable);

        if (page.isEmpty()) {
            return PageResponse.of(Collections.emptyList(), page.getNumber(), page.getSize(), page.getTotalElements());
        }

        Profile creatorProfile = profileRepository.findByUserId(userId).orElse(null);

        List<DisputeResponse> items = page.getContent().stream()
                .map(d -> DisputeResponse.fromEntity(d, creatorProfile))
                .toList();

        return PageResponse.of(items, page.getNumber(), page.getSize(), page.getTotalElements());
    }

    @Transactional(readOnly = true)
    public DisputeResponse getDisputeForSession(UUID userId, UUID sessionId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", sessionId));

        boolean isTeacher = session.getTeacher().getId().equals(userId);
        boolean isLearner = session.getLearner().getId().equals(userId);

        if (!isTeacher && !isLearner) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You are not a participant in this session");
        }

        Optional<Dispute> disputeOpt = disputeRepository.findBySessionIdAndCreatedById(sessionId, userId);
        if (disputeOpt.isEmpty()) {
            return null;
        }

        Profile creatorProfile = profileRepository.findByUserId(userId).orElse(null);
        return DisputeResponse.fromEntity(disputeOpt.get(), creatorProfile);
    }

    @Transactional(readOnly = true)
    public PageResponse<ModerationDisputeDetailResponse> getModerationDisputes(DisputeStatus status, Pageable pageable) {
        Page<Dispute> page = (status != null)
                ? disputeRepository.findByStatusOrderByCreatedAtDesc(status, pageable)
                : disputeRepository.findAllByOrderByCreatedAtDesc(pageable);

        if (page.isEmpty()) {
            return PageResponse.of(Collections.emptyList(), page.getNumber(), page.getSize(), page.getTotalElements());
        }

        Set<UUID> allUserIds = new HashSet<>();
        for (Dispute d : page.getContent()) {
            allUserIds.add(d.getCreatedBy().getId());
            allUserIds.add(d.getSession().getTeacher().getId());
            allUserIds.add(d.getSession().getLearner().getId());
        }

        Map<UUID, Profile> profileMap = profileRepository.findByUserIds(allUserIds).stream()
                .collect(Collectors.toMap(p -> p.getUser().getId(), p -> p, (a, b) -> a));

        List<ModerationDisputeDetailResponse> items = page.getContent().stream()
                .map(d -> ModerationDisputeDetailResponse.fromEntity(
                        d,
                        profileMap.get(d.getSession().getTeacher().getId()),
                        profileMap.get(d.getSession().getLearner().getId()),
                        profileMap.get(d.getCreatedBy().getId())
                ))
                .toList();

        return PageResponse.of(items, page.getNumber(), page.getSize(), page.getTotalElements());
    }

    @Transactional(readOnly = true)
    public ModerationDisputeDetailResponse getModerationDisputeById(UUID disputeId) {
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResourceNotFoundException("Dispute", "id", disputeId));

        Profile teacherProfile = profileRepository.findByUserId(dispute.getSession().getTeacher().getId()).orElse(null);
        Profile learnerProfile = profileRepository.findByUserId(dispute.getSession().getLearner().getId()).orElse(null);
        Profile creatorProfile = profileRepository.findByUserId(dispute.getCreatedBy().getId()).orElse(null);

        return ModerationDisputeDetailResponse.fromEntity(dispute, teacherProfile, learnerProfile, creatorProfile);
    }

    @Transactional
    public ModerationDisputeDetailResponse updateDisputeStatus(UUID moderatorId, UUID disputeId, UpdateDisputeStatusRequest request) {
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResourceNotFoundException("Dispute", "id", disputeId));

        User moderator = userRepository.findById(moderatorId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", moderatorId));

        dispute.setStatus(request.getStatus());
        if (request.getModeratorNotes() != null) {
            String sanitizedNotes = com.skillswap.common.util.InputSanitizer.sanitize(request.getModeratorNotes().trim(), 2000);
            dispute.setModeratorNotes(sanitizedNotes);
        }

        if (request.getStatus() == DisputeStatus.RESOLVED || request.getStatus() == DisputeStatus.REJECTED) {
            dispute.setResolvedBy(moderator);
            dispute.setResolvedAt(Instant.now());
        }

        Dispute saved = disputeRepository.save(dispute);
        log.info("Moderator {} updated dispute {} status to {}", moderatorId, disputeId, request.getStatus());

        try {
            notificationService.createNotification(
                    saved.getCreatedBy().getId(),
                    com.skillswap.notification.entity.NotificationType.DISPUTE_UPDATED,
                    "Session Dispute Updated",
                    "Your dispute for " + saved.getSession().getSkill().getName() + " is now " + request.getStatus() + ".",
                    "DISPUTE",
                    saved.getId(),
                    "/sessions/" + saved.getSession().getId()
            );
        } catch (Exception e) {
            log.warn("Failed to create dispute update notification: {}", e.getMessage());
        }

        Profile teacherProfile = profileRepository.findByUserId(saved.getSession().getTeacher().getId()).orElse(null);
        Profile learnerProfile = profileRepository.findByUserId(saved.getSession().getLearner().getId()).orElse(null);
        Profile creatorProfile = profileRepository.findByUserId(saved.getCreatedBy().getId()).orElse(null);

        return ModerationDisputeDetailResponse.fromEntity(saved, teacherProfile, learnerProfile, creatorProfile);
    }
}
