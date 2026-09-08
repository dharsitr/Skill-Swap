package com.skillswap.personalization.service;

import com.skillswap.exchange.entity.ExchangeRequest;
import com.skillswap.exchange.repository.ExchangeRequestRepository;
import com.skillswap.personalization.dto.UserActivityDto;
import com.skillswap.profile.entity.Profile;
import com.skillswap.profile.repository.ProfileRepository;
import com.skillswap.review.entity.Review;
import com.skillswap.review.repository.ReviewRepository;
import com.skillswap.session.entity.Session;
import com.skillswap.session.entity.SessionStatus;
import com.skillswap.session.repository.SessionRepository;
import com.skillswap.skill.entity.UserSkill;
import com.skillswap.skill.repository.UserSkillRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserActivityService {

    private final SessionRepository sessionRepository;
    private final ExchangeRequestRepository exchangeRequestRepository;
    private final UserSkillRepository userSkillRepository;
    private final ReviewRepository reviewRepository;
    private final ProfileRepository profileRepository;

    public UserActivityService(
            SessionRepository sessionRepository,
            ExchangeRequestRepository exchangeRequestRepository,
            UserSkillRepository userSkillRepository,
            ReviewRepository reviewRepository,
            ProfileRepository profileRepository
    ) {
        this.sessionRepository = sessionRepository;
        this.exchangeRequestRepository = exchangeRequestRepository;
        this.userSkillRepository = userSkillRepository;
        this.reviewRepository = reviewRepository;
        this.profileRepository = profileRepository;
    }

    @Transactional(readOnly = true)
    public List<UserActivityDto> getRecentActivity(UUID userId, int limit) {
        int effectiveLimit = Math.min(Math.max(limit, 1), 30);
        List<UserActivityDto> activities = new ArrayList<>();

        // 1. Sessions
        List<Session> sessions = sessionRepository.findByParticipant(userId, PageRequest.of(0, 10)).getContent();
        for (Session session : sessions) {
            boolean isTeacher = session.getTeacher().getId().equals(userId);
            UUID partnerId = isTeacher ? session.getLearner().getId() : session.getTeacher().getId();
            Profile partnerProfile = profileRepository.findByUserId(partnerId).orElse(null);
            String partnerName = partnerProfile != null ? partnerProfile.getDisplayName() : "Peer";

            String skillName = session.getSkill() != null ? session.getSkill().getName() : "Skill";

            if (session.getStatus() == SessionStatus.COMPLETED) {
                activities.add(new UserActivityDto(
                        session.getId(),
                        "SESSION_COMPLETED",
                        "Completed Session in " + skillName,
                        (isTeacher ? "Taught " : "Learned from ") + partnerName,
                        session.getUpdatedAt() != null ? session.getUpdatedAt() : session.getCreatedAt(),
                        "SESSION",
                        session.getId(),
                        "/sessions/" + session.getId()
                ));
            } else if (session.getStatus() == SessionStatus.SCHEDULED) {
                activities.add(new UserActivityDto(
                        session.getId(),
                        "SESSION_SCHEDULED",
                        "Scheduled Session for " + skillName,
                        "Upcoming session with " + partnerName,
                        session.getCreatedAt(),
                        "SESSION",
                        session.getId(),
                        "/sessions/" + session.getId()
                ));
            }
        }

        // 2. Outgoing requests
        List<ExchangeRequest> outgoing = exchangeRequestRepository.findByRequesterId(userId, PageRequest.of(0, 10)).getContent();
        for (ExchangeRequest req : outgoing) {
            Profile targetProfile = profileRepository.findByUserId(req.getRecipient().getId()).orElse(null);
            String targetName = targetProfile != null ? targetProfile.getDisplayName() : "Peer";
            String skillName = req.getSkill() != null ? req.getSkill().getName() : "Skill";

            activities.add(new UserActivityDto(
                    req.getId(),
                    "REQUEST_SENT",
                    "Sent Exchange Request",
                    "Proposed " + skillName + " session to " + targetName + " [" + req.getStatus().name() + "]",
                    req.getCreatedAt(),
                    "EXCHANGE_REQUEST",
                    req.getId(),
                    "/requests"
            ));
        }

        // 3. Incoming requests
        List<ExchangeRequest> incoming = exchangeRequestRepository.findByRecipientId(userId, PageRequest.of(0, 10)).getContent();
        for (ExchangeRequest req : incoming) {
            Profile requesterProfile = profileRepository.findByUserId(req.getRequester().getId()).orElse(null);
            String requesterName = requesterProfile != null ? requesterProfile.getDisplayName() : "Peer";
            String skillName = req.getSkill() != null ? req.getSkill().getName() : "Skill";

            activities.add(new UserActivityDto(
                    req.getId(),
                    "REQUEST_RECEIVED",
                    "Received Exchange Request",
                    requesterName + " requested a session for " + skillName + " [" + req.getStatus().name() + "]",
                    req.getCreatedAt(),
                    "EXCHANGE_REQUEST",
                    req.getId(),
                    "/requests"
            ));
        }

        // 4. Skills added
        List<UserSkill> skills = userSkillRepository.findByUserId(userId);
        for (UserSkill skill : skills) {
            activities.add(new UserActivityDto(
                    skill.getId(),
                    "SKILL_ADDED",
                    "Added " + skill.getRelationshipType().name() + " Skill",
                    skill.getSkill().getName() + " (" + skill.getProficiency().name() + ")",
                    skill.getCreatedAt() != null ? skill.getCreatedAt() : skill.getUpdatedAt(),
                    "SKILL",
                    skill.getSkill().getId(),
                    "/skills"
            ));
        }

        // 5. Reviews received
        List<Review> reviews = reviewRepository.findByRevieweeIdOrderByCreatedAtDesc(userId, PageRequest.of(0, 10)).getContent();
        for (Review review : reviews) {
            Profile reviewerProfile = profileRepository.findByUserId(review.getReviewer().getId()).orElse(null);
            String reviewerName = reviewerProfile != null ? reviewerProfile.getDisplayName() : "Peer";

            String comment = review.getComment();
            String commentPreview = comment != null && comment.length() > 40
                    ? comment.substring(0, 37) + "..."
                    : (comment != null ? comment : "Great session!");

            activities.add(new UserActivityDto(
                    review.getId(),
                    "REVIEW_RECEIVED",
                    "Received " + review.getRating() + "-Star Review",
                    "From " + reviewerName + ": \"" + commentPreview + "\"",
                    review.getCreatedAt(),
                    "REVIEW",
                    review.getId(),
                    "/reviews"
            ));
        }

        // Sort descending by timestamp
        activities.sort((a, b) -> {
            if (a.timestamp() == null && b.timestamp() == null) return 0;
            if (a.timestamp() == null) return 1;
            if (b.timestamp() == null) return -1;
            return b.timestamp().compareTo(a.timestamp());
        });

        return activities.stream().limit(effectiveLimit).collect(Collectors.toList());
    }
}
