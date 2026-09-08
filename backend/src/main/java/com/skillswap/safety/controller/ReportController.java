package com.skillswap.safety.controller;

import com.skillswap.common.response.PageResponse;
import com.skillswap.common.security.AuthenticatedUserPrincipal;
import com.skillswap.safety.dto.CreateReportRequest;
import com.skillswap.safety.dto.ReportResponse;
import com.skillswap.safety.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/reports")
@Tag(name = "User Reporting", description = "Endpoints for reporting inappropriate behavior and viewing submitted reports")
@SecurityRequirement(name = "BearerAuth")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @PostMapping
    @Operation(summary = "Submit a report", description = "Submits a user behavior report for moderator review.")
    public ResponseEntity<ReportResponse> createReport(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @Valid @RequestBody CreateReportRequest request
    ) {
        ReportResponse response = reportService.createReport(principal.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/my")
    @Operation(summary = "Get my submitted reports", description = "Lists reports submitted by the authenticated user.")
    public ResponseEntity<PageResponse<ReportResponse>> getMyReports(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        PageResponse<ReportResponse> response = reportService.getMyReports(principal.getUserId(), pageRequest);
        return ResponseEntity.ok(response);
    }
}
