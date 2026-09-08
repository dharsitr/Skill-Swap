package com.skillswap.safety.service;

import com.skillswap.common.exception.ApiException;
import com.skillswap.common.exception.ResourceNotFoundException;
import com.skillswap.common.response.PageResponse;
import com.skillswap.profile.entity.Profile;
import com.skillswap.profile.repository.ProfileRepository;
import com.skillswap.safety.dto.CreateReportRequest;
import com.skillswap.safety.dto.ModerationReportDetailResponse;
import com.skillswap.safety.dto.ReportResponse;
import com.skillswap.safety.dto.UpdateReportStatusRequest;
import com.skillswap.safety.entity.Report;
import com.skillswap.safety.entity.ReportStatus;
import com.skillswap.safety.repository.ReportRepository;
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
public class ReportService {

    private static final Logger log = LoggerFactory.getLogger(ReportService.class);

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final SessionRepository sessionRepository;
    private final ProfileRepository profileRepository;
    private final com.skillswap.notification.service.NotificationService notificationService;

    public ReportService(
            ReportRepository reportRepository,
            UserRepository userRepository,
            SessionRepository sessionRepository,
            ProfileRepository profileRepository,
            com.skillswap.notification.service.NotificationService notificationService
    ) {
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.profileRepository = profileRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public ReportResponse createReport(UUID reporterId, CreateReportRequest request) {
        if (reporterId.equals(request.getReportedUserId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You cannot report yourself");
        }

        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", reporterId));

        User reportedUser = userRepository.findById(request.getReportedUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getReportedUserId()));

        Session session = null;
        if (request.getSessionId() != null) {
            session = sessionRepository.findById(request.getSessionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Session", "id", request.getSessionId()));

            boolean isParticipant = session.getTeacher().getId().equals(reporterId) || session.getLearner().getId().equals(reporterId);
            if (!isParticipant) {
                throw new ApiException(HttpStatus.FORBIDDEN, "You are not a participant in the specified session");
            }
        }

        String sanitizedDescription = null;
        if (request.getDescription() != null && !request.getDescription().trim().isEmpty()) {
            String trimmed = request.getDescription().trim();
            sanitizedDescription = com.skillswap.common.util.InputSanitizer.sanitize(trimmed, 2000);
            if (sanitizedDescription != null && sanitizedDescription.length() > 2000) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Report description cannot exceed 2000 characters");
            }
        }

        Report report = new Report(reporter, reportedUser, session, request.getReason(), sanitizedDescription);
        Report saved = reportRepository.save(report);

        log.info("User {} submitted report id: {} against user {} (reason: {})",
                reporterId, saved.getId(), request.getReportedUserId(), request.getReason());

        Profile reportedProfile = profileRepository.findByUserId(request.getReportedUserId()).orElse(null);
        return ReportResponse.fromEntity(saved, reportedProfile);
    }

    @Transactional(readOnly = true)
    public PageResponse<ReportResponse> getMyReports(UUID reporterId, Pageable pageable) {
        Page<Report> page = reportRepository.findByReporterIdOrderByCreatedAtDesc(reporterId, pageable);

        if (page.isEmpty()) {
            return PageResponse.of(Collections.emptyList(), page.getNumber(), page.getSize(), page.getTotalElements());
        }

        Set<UUID> reportedIds = page.getContent().stream()
                .map(r -> r.getReportedUser().getId())
                .collect(Collectors.toSet());

        Map<UUID, Profile> profileMap = profileRepository.findByUserIds(reportedIds).stream()
                .collect(Collectors.toMap(p -> p.getUser().getId(), p -> p, (a, b) -> a));

        List<ReportResponse> items = page.getContent().stream()
                .map(r -> ReportResponse.fromEntity(r, profileMap.get(r.getReportedUser().getId())))
                .toList();

        return PageResponse.of(items, page.getNumber(), page.getSize(), page.getTotalElements());
    }

    @Transactional(readOnly = true)
    public PageResponse<ModerationReportDetailResponse> getModerationReports(ReportStatus status, Pageable pageable) {
        Page<Report> page = (status != null)
                ? reportRepository.findByStatusOrderByCreatedAtDesc(status, pageable)
                : reportRepository.findAllByOrderByCreatedAtDesc(pageable);

        if (page.isEmpty()) {
            return PageResponse.of(Collections.emptyList(), page.getNumber(), page.getSize(), page.getTotalElements());
        }

        Set<UUID> allUserIds = new HashSet<>();
        for (Report r : page.getContent()) {
            allUserIds.add(r.getReporter().getId());
            allUserIds.add(r.getReportedUser().getId());
        }

        Map<UUID, Profile> profileMap = profileRepository.findByUserIds(allUserIds).stream()
                .collect(Collectors.toMap(p -> p.getUser().getId(), p -> p, (a, b) -> a));

        List<ModerationReportDetailResponse> items = page.getContent().stream()
                .map(r -> ModerationReportDetailResponse.fromEntity(
                        r,
                        profileMap.get(r.getReporter().getId()),
                        profileMap.get(r.getReportedUser().getId())
                ))
                .toList();

        return PageResponse.of(items, page.getNumber(), page.getSize(), page.getTotalElements());
    }

    @Transactional(readOnly = true)
    public ModerationReportDetailResponse getModerationReportById(UUID reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report", "id", reportId));

        Profile reporterProfile = profileRepository.findByUserId(report.getReporter().getId()).orElse(null);
        Profile reportedProfile = profileRepository.findByUserId(report.getReportedUser().getId()).orElse(null);

        return ModerationReportDetailResponse.fromEntity(report, reporterProfile, reportedProfile);
    }

    @Transactional
    public ModerationReportDetailResponse updateReportStatus(UUID moderatorId, UUID reportId, UpdateReportStatusRequest request) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report", "id", reportId));

        User moderator = userRepository.findById(moderatorId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", moderatorId));

        report.setStatus(request.getStatus());
        if (request.getModeratorNotes() != null) {
            String sanitizedNotes = com.skillswap.common.util.InputSanitizer.sanitize(request.getModeratorNotes().trim(), 2000);
            report.setModeratorNotes(sanitizedNotes);
        }

        if (request.getStatus() == ReportStatus.RESOLVED || request.getStatus() == ReportStatus.DISMISSED) {
            report.setResolvedBy(moderator);
            report.setResolvedAt(Instant.now());
        }

        Report saved = reportRepository.save(report);
        log.info("Moderator {} updated report {} status to {}", moderatorId, reportId, request.getStatus());

        try {
            notificationService.createNotification(
                    saved.getReporter().getId(),
                    com.skillswap.notification.entity.NotificationType.SAFETY_UPDATE,
                    "Report Status Updated",
                    "Your report regarding safety has been reviewed and marked as " + request.getStatus() + ".",
                    "REPORT",
                    saved.getId(),
                    "/settings"
            );
        } catch (Exception e) {
            log.warn("Failed to create report status notification: {}", e.getMessage());
        }

        Profile reporterProfile = profileRepository.findByUserId(saved.getReporter().getId()).orElse(null);
        Profile reportedProfile = profileRepository.findByUserId(saved.getReportedUser().getId()).orElse(null);

        return ModerationReportDetailResponse.fromEntity(saved, reporterProfile, reportedProfile);
    }
}
