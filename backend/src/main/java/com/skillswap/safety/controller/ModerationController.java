package com.skillswap.safety.controller;

import com.skillswap.common.response.PageResponse;
import com.skillswap.common.security.AuthenticatedUserPrincipal;
import com.skillswap.safety.dto.ModerationDisputeDetailResponse;
import com.skillswap.safety.dto.ModerationReportDetailResponse;
import com.skillswap.safety.dto.UpdateDisputeStatusRequest;
import com.skillswap.safety.dto.UpdateReportStatusRequest;
import com.skillswap.safety.entity.DisputeStatus;
import com.skillswap.safety.entity.ReportStatus;
import com.skillswap.safety.service.DisputeService;
import com.skillswap.safety.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/moderation")
@Tag(name = "Moderation", description = "Endpoints for moderators to review and resolve reports and disputes")
@SecurityRequirement(name = "BearerAuth")
public class ModerationController {

    private final ReportService reportService;
    private final DisputeService disputeService;

    public ModerationController(ReportService reportService, DisputeService disputeService) {
        this.reportService = reportService;
        this.disputeService = disputeService;
    }

    @GetMapping("/reports")
    @Operation(summary = "Get moderation reports", description = "Lists reports submitted by users with optional status filtering.")
    public ResponseEntity<PageResponse<ModerationReportDetailResponse>> getReports(
            @RequestParam(required = false) ReportStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        PageResponse<ModerationReportDetailResponse> response = reportService.getModerationReports(status, pageRequest);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/reports/{id}")
    @Operation(summary = "Get report details", description = "Retrieves full report details for moderation review.")
    public ResponseEntity<ModerationReportDetailResponse> getReportById(@PathVariable UUID id) {
        ModerationReportDetailResponse response = reportService.getModerationReportById(id);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/reports/{id}/status")
    @Operation(summary = "Update report status", description = "Updates status and moderator notes for a report.")
    public ResponseEntity<ModerationReportDetailResponse> updateReportStatus(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateReportStatusRequest request
    ) {
        ModerationReportDetailResponse response = reportService.updateReportStatus(principal.getUserId(), id, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/disputes")
    @Operation(summary = "Get moderation disputes", description = "Lists session disputes submitted by users with optional status filtering.")
    public ResponseEntity<PageResponse<ModerationDisputeDetailResponse>> getDisputes(
            @RequestParam(required = false) DisputeStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        PageResponse<ModerationDisputeDetailResponse> response = disputeService.getModerationDisputes(status, pageRequest);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/disputes/{id}")
    @Operation(summary = "Get dispute details", description = "Retrieves full dispute details for moderation review.")
    public ResponseEntity<ModerationDisputeDetailResponse> getDisputeById(@PathVariable UUID id) {
        ModerationDisputeDetailResponse response = disputeService.getModerationDisputeById(id);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/disputes/{id}/status")
    @Operation(summary = "Update dispute status", description = "Updates status and moderator notes for a session dispute.")
    public ResponseEntity<ModerationDisputeDetailResponse> updateDisputeStatus(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDisputeStatusRequest request
    ) {
        ModerationDisputeDetailResponse response = disputeService.updateDisputeStatus(principal.getUserId(), id, request);
        return ResponseEntity.ok(response);
    }
}
