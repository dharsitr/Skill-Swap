package com.skillswap.safety.controller;

import com.skillswap.common.response.PageResponse;
import com.skillswap.common.security.AuthenticatedUserPrincipal;
import com.skillswap.safety.dto.BlockStatusResponse;
import com.skillswap.safety.dto.BlockUserRequest;
import com.skillswap.safety.dto.UserBlockResponse;
import com.skillswap.safety.service.UserBlockService;
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

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/blocks")
@Tag(name = "User Blocking", description = "Endpoints for blocking and unblocking users to prevent unwanted interactions")
@SecurityRequirement(name = "BearerAuth")
public class UserBlockController {

    private final UserBlockService userBlockService;

    public UserBlockController(UserBlockService userBlockService) {
        this.userBlockService = userBlockService;
    }

    @PostMapping
    @Operation(summary = "Block a user", description = "Blocks a user to prevent new exchange requests, sessions, and messages.")
    public ResponseEntity<UserBlockResponse> blockUser(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @Valid @RequestBody BlockUserRequest request
    ) {
        UserBlockResponse response = userBlockService.blockUser(principal.getUserId(), request.getBlockedUserId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{blockedUserId}")
    @Operation(summary = "Unblock a user", description = "Unblocks a previously blocked user.")
    public ResponseEntity<Void> unblockUser(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID blockedUserId
    ) {
        userBlockService.unblockUser(principal.getUserId(), blockedUserId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    @Operation(summary = "Get blocked users", description = "Lists users blocked by the authenticated user.")
    public ResponseEntity<PageResponse<UserBlockResponse>> getBlockedUsers(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        PageResponse<UserBlockResponse> response = userBlockService.getBlockedUsers(principal.getUserId(), pageRequest);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/status/{userId}")
    @Operation(summary = "Get block status", description = "Checks whether the target user is blocked by or has blocked the current user.")
    public ResponseEntity<BlockStatusResponse> getBlockStatus(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID userId
    ) {
        BlockStatusResponse response = userBlockService.getBlockStatus(principal.getUserId(), userId);
        return ResponseEntity.ok(response);
    }
}
