package com.skillswap.exchange.service;

import com.skillswap.common.exception.ApiException;
import com.skillswap.common.exception.ResourceNotFoundException;
import com.skillswap.common.response.PageResponse;
import com.skillswap.exchange.dto.*;
import com.skillswap.exchange.entity.ExchangeRequest;
import com.skillswap.exchange.entity.ExchangeRequestStatus;
import com.skillswap.exchange.repository.ExchangeRequestRepository;
import com.skillswap.profile.entity.Profile;
import com.skillswap.profile.repository.ProfileRepository;
import com.skillswap.session.entity.Session;
import com.skillswap.session.entity.SessionStatus;
import com.skillswap.session.repository.SessionRepository;
import com.skillswap.skill.entity.Skill;
import com.skillswap.skill.entity.SkillRelationshipType;
import com.skillswap.skill.repository.SkillRepository;
import com.skillswap.skill.repository.UserSkillRepository;
import com.skillswap.user.entity.User;
import com.skillswap.user.entity.UserStatus;
import com.skillswap.user.repository.UserRepository;
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
public class ExchangeRequestService {

    private static final Logger log = LoggerFactory.getLogger(ExchangeRequestService.class);

    private final ExchangeRequestRepository exchangeRequestRepository;
    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final SkillRepository skillRepository;
    private final UserSkillRepository userSkillRepository;
    private final com.skillswap.safety.service.UserBlockService userBlockService;
    private final com.skillswap.notification.service.NotificationService notificationService;

    public ExchangeRequestService(
            ExchangeRequestRepository exchangeRequestRepository,
            SessionRepository sessionRepository,
            UserRepository userRepository,
            ProfileRepository profileRepository,
            SkillRepository skillRepository,
            UserSkillRepository userSkillRepository,
            com.skillswap.safety.service.UserBlockService userBlockService,
            com.skillswap.notification.service.NotificationService notificationService
    ) {
        this.exchangeRequestRepository = exchangeRequestRepository;
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.skillRepository = skillRepository;
        this.userSkillRepository = userSkillRepository;
        this.userBlockService = userBlockService;
        this.notificationService = notificationService;
    }

    @Transactional
    public ExchangeRequestResponse createRequest(UUID requesterUserId, CreateExchangeRequest request) {
        if (requesterUserId.equals(request.getRecipientId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You cannot send an exchange request to yourself");
        }

        User requester = userRepository.findById(requesterUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", requesterUserId));
        if (requester.getStatus() != UserStatus.ACTIVE) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Account is not active");
        }

        User recipient = userRepository.findById(request.getRecipientId())
                .orElseThrow(() -> new ResourceNotFoundException("Recipient", "id", request.getRecipientId()));
        if (recipient.getStatus() != UserStatus.ACTIVE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Recipient account is not active");
        }

        if (userBlockService.isBlocked(requesterUserId, request.getRecipientId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Cannot send an exchange request due to block and privacy settings");
        }

        Skill skill = skillRepository.findById(request.getSkillId())
                .orElseThrow(() -> new ResourceNotFoundException("Skill", "id", request.getSkillId()));

        // Authoritative validation: Requester must want to LEARN this skill
        boolean requesterLearns = userSkillRepository.existsByUserIdAndSkillIdAndRelationshipType(
                requesterUserId,
                request.getSkillId(),
                SkillRelationshipType.LEARN
        );
        if (!requesterLearns) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You do not have this skill in your learning goals");
        }

        // Authoritative validation: Recipient must TEACH this skill
        boolean recipientTeaches = userSkillRepository.existsByUserIdAndSkillIdAndRelationshipType(
                request.getRecipientId(),
                request.getSkillId(),
                SkillRelationshipType.TEACH
        );
        if (!recipientTeaches) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "The recipient does not teach this skill");
        }

        // Prevent duplicate active requests
        boolean activeExists = exchangeRequestRepository.existsByRequesterIdAndRecipientIdAndSkillIdAndStatus(
                requesterUserId,
                request.getRecipientId(),
                request.getSkillId(),
                ExchangeRequestStatus.PENDING
        );
        if (activeExists) {
            throw new ApiException(HttpStatus.CONFLICT, "An active exchange request already exists for this skill and recipient");
        }

        String sanitizedMessage = (request.getMessage() != null && !request.getMessage().isBlank())
                ? request.getMessage().trim()
                : null;

        ExchangeRequest exchangeRequest = new ExchangeRequest(
                null,
                requester,
                recipient,
                skill,
                sanitizedMessage,
                ExchangeRequestStatus.PENDING
        );

        ExchangeRequest saved = exchangeRequestRepository.save(exchangeRequest);
        log.info("Created ExchangeRequest id: {} (requester: {}, recipient: {}, skill: {})",
                saved.getId(), requesterUserId, request.getRecipientId(), skill.getName());

        try {
            Profile requesterProfile = profileRepository.findByUserId(requesterUserId).orElse(null);
            String requesterName = (requesterProfile != null && requesterProfile.getDisplayName() != null)
                    ? requesterProfile.getDisplayName() : "A student";
            notificationService.createNotification(
                    request.getRecipientId(),
                    com.skillswap.notification.entity.NotificationType.EXCHANGE_REQUEST_RECEIVED,
                    "New Exchange Request",
                    requesterName + " sent you an exchange request for " + skill.getName() + ".",
                    "EXCHANGE_REQUEST",
                    saved.getId(),
                    "/requests"
            );
        } catch (Exception e) {
            log.warn("Failed to create notification for exchange request: {}", e.getMessage());
        }

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public ExchangeRequestResponse getRequest(UUID currentUserId, UUID requestId) {
        ExchangeRequest request = exchangeRequestRepository.findByIdWithDetails(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("ExchangeRequest", "id", requestId));

        if (!request.getRequester().getId().equals(currentUserId) && !request.getRecipient().getId().equals(currentUserId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You are not authorized to view this exchange request");
        }

        return mapToResponse(request);
    }

    @Transactional(readOnly = true)
    public PageResponse<ExchangeRequestResponse> getIncomingRequests(
            UUID currentUserId,
            ExchangeRequestStatus status,
            Pageable pageable
    ) {
        Page<ExchangeRequest> page = (status != null)
                ? exchangeRequestRepository.findByRecipientIdAndStatus(currentUserId, status, pageable)
                : exchangeRequestRepository.findByRecipientId(currentUserId, pageable);

        return mapPageToResponse(page);
    }

    @Transactional(readOnly = true)
    public PageResponse<ExchangeRequestResponse> getOutgoingRequests(
            UUID currentUserId,
            ExchangeRequestStatus status,
            Pageable pageable
    ) {
        Page<ExchangeRequest> page = (status != null)
                ? exchangeRequestRepository.findByRequesterIdAndStatus(currentUserId, status, pageable)
                : exchangeRequestRepository.findByRequesterId(currentUserId, pageable);

        return mapPageToResponse(page);
    }

    @Transactional
    public ExchangeRequestResponse acceptRequest(UUID currentUserId, UUID requestId) {
        ExchangeRequest request = exchangeRequestRepository.findByIdForUpdate(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("ExchangeRequest", "id", requestId));

        if (!request.getRecipient().getId().equals(currentUserId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only the recipient can accept this exchange request");
        }

        if (request.getStatus() != ExchangeRequestStatus.PENDING) {
            throw new ApiException(HttpStatus.CONFLICT, "This exchange request is no longer pending");
        }

        if (sessionRepository.existsByExchangeRequestId(request.getId())) {
            throw new ApiException(HttpStatus.CONFLICT, "A session already exists for this exchange request");
        }

        request.setStatus(ExchangeRequestStatus.ACCEPTED);
        exchangeRequestRepository.save(request);

        // Atomically create Session: teacher = recipient, learner = requester
        Session session = new Session(
                null,
                request,
                request.getRecipient(),
                request.getRequester(),
                request.getSkill(),
                SessionStatus.SCHEDULED
        );
        Session savedSession = sessionRepository.save(session);

        log.info("Accepted ExchangeRequest id: {} and created Session id: {}", request.getId(), session.getId());

        try {
            Profile recipientProfile = profileRepository.findByUserId(currentUserId).orElse(null);
            String recipientName = (recipientProfile != null && recipientProfile.getDisplayName() != null)
                    ? recipientProfile.getDisplayName() : "Teacher";
            notificationService.createNotification(
                    request.getRequester().getId(),
                    com.skillswap.notification.entity.NotificationType.EXCHANGE_REQUEST_ACCEPTED,
                    "Exchange Request Accepted",
                    recipientName + " accepted your exchange request for " + request.getSkill().getName() + "!",
                    "SESSION",
                    savedSession.getId(),
                    "/sessions/" + savedSession.getId()
            );
            notificationService.createNotification(
                    request.getRequester().getId(),
                    com.skillswap.notification.entity.NotificationType.SESSION_CREATED,
                    "Session Scheduled",
                    "Your session for " + request.getSkill().getName() + " has been scheduled.",
                    "SESSION",
                    savedSession.getId(),
                    "/sessions/" + savedSession.getId()
            );
        } catch (Exception e) {
            log.warn("Failed to create acceptance notifications: {}", e.getMessage());
        }

        return mapToResponse(request);
    }

    @Transactional
    public ExchangeRequestResponse rejectRequest(UUID currentUserId, UUID requestId) {
        ExchangeRequest request = exchangeRequestRepository.findByIdForUpdate(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("ExchangeRequest", "id", requestId));

        if (!request.getRecipient().getId().equals(currentUserId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only the recipient can reject this exchange request");
        }

        if (request.getStatus() != ExchangeRequestStatus.PENDING) {
            throw new ApiException(HttpStatus.CONFLICT, "This exchange request is no longer pending");
        }

        request.setStatus(ExchangeRequestStatus.REJECTED);
        ExchangeRequest saved = exchangeRequestRepository.save(request);
        log.info("Rejected ExchangeRequest id: {}", saved.getId());

        try {
            Profile recipientProfile = profileRepository.findByUserId(currentUserId).orElse(null);
            String recipientName = (recipientProfile != null && recipientProfile.getDisplayName() != null)
                    ? recipientProfile.getDisplayName() : "User";
            notificationService.createNotification(
                    request.getRequester().getId(),
                    com.skillswap.notification.entity.NotificationType.EXCHANGE_REQUEST_REJECTED,
                    "Exchange Request Declined",
                    recipientName + " declined your exchange request for " + request.getSkill().getName() + ".",
                    "EXCHANGE_REQUEST",
                    saved.getId(),
                    "/requests"
            );
        } catch (Exception e) {
            log.warn("Failed to create rejection notification: {}", e.getMessage());
        }

        return mapToResponse(saved);
    }

    @Transactional
    public ExchangeRequestResponse cancelRequest(UUID currentUserId, UUID requestId) {
        ExchangeRequest request = exchangeRequestRepository.findByIdForUpdate(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("ExchangeRequest", "id", requestId));

        if (!request.getRequester().getId().equals(currentUserId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only the requester can cancel this exchange request");
        }

        if (request.getStatus() != ExchangeRequestStatus.PENDING) {
            throw new ApiException(HttpStatus.CONFLICT, "This exchange request is no longer pending");
        }

        request.setStatus(ExchangeRequestStatus.CANCELLED);
        ExchangeRequest saved = exchangeRequestRepository.save(request);
        log.info("Cancelled ExchangeRequest id: {}", saved.getId());
        return mapToResponse(saved);
    }

    private ExchangeRequestResponse mapToResponse(ExchangeRequest request) {
        Profile requesterProfile = profileRepository.findByUserId(request.getRequester().getId()).orElse(null);
        Profile recipientProfile = profileRepository.findByUserId(request.getRecipient().getId()).orElse(null);

        ExchangeParticipantDto requesterDto = toParticipantDto(request.getRequester(), requesterProfile);
        ExchangeParticipantDto recipientDto = toParticipantDto(request.getRecipient(), recipientProfile);
        ExchangeRequestSkillDto skillDto = new ExchangeRequestSkillDto(
                request.getSkill().getId(),
                request.getSkill().getName(),
                request.getSkill().getCategory() != null ? request.getSkill().getCategory().getName() : null
        );

        return new ExchangeRequestResponse(
                request.getId(),
                requesterDto,
                recipientDto,
                skillDto,
                request.getMessage(),
                request.getStatus(),
                request.getCreatedAt(),
                request.getUpdatedAt()
        );
    }

    private PageResponse<ExchangeRequestResponse> mapPageToResponse(Page<ExchangeRequest> page) {
        if (page.isEmpty()) {
            return PageResponse.of(Collections.emptyList(), page.getNumber(), page.getSize(), page.getTotalElements());
        }

        Set<UUID> userIds = new HashSet<>();
        for (ExchangeRequest r : page.getContent()) {
            userIds.add(r.getRequester().getId());
            userIds.add(r.getRecipient().getId());
        }

        Map<UUID, Profile> profileMap = profileRepository.findByUserIds(userIds)
                .stream()
                .collect(Collectors.toMap(p -> p.getUser().getId(), p -> p, (a, b) -> a));

        List<ExchangeRequestResponse> items = page.getContent().stream().map(r -> {
            ExchangeParticipantDto requesterDto = toParticipantDto(r.getRequester(), profileMap.get(r.getRequester().getId()));
            ExchangeParticipantDto recipientDto = toParticipantDto(r.getRecipient(), profileMap.get(r.getRecipient().getId()));
            ExchangeRequestSkillDto skillDto = new ExchangeRequestSkillDto(
                    r.getSkill().getId(),
                    r.getSkill().getName(),
                    r.getSkill().getCategory() != null ? r.getSkill().getCategory().getName() : null
            );

            return new ExchangeRequestResponse(
                    r.getId(),
                    requesterDto,
                    recipientDto,
                    skillDto,
                    r.getMessage(),
                    r.getStatus(),
                    r.getCreatedAt(),
                    r.getUpdatedAt()
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
