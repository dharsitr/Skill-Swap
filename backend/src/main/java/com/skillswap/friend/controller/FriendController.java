package com.skillswap.friend.controller;

import com.skillswap.common.security.AuthenticatedUserPrincipal;
import com.skillswap.friend.dto.FriendRequestDto;
import com.skillswap.friend.dto.FriendSummaryDto;
import com.skillswap.friend.dto.FriendshipStatusResponse;
import com.skillswap.friend.dto.SendFriendRequest;
import com.skillswap.friend.service.FriendService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/friends")
@Tag(name = "Friends & Connections", description = "Endpoints for student friend requests and peer connections")
@SecurityRequirement(name = "BearerAuth")
public class FriendController {

    private final FriendService friendService;

    public FriendController(FriendService friendService) {
        this.friendService = friendService;
    }

    @GetMapping("/status/{targetUserId}")
    @Operation(summary = "Get connection status with user", description = "Returns NONE, PENDING_SENT, PENDING_RECEIVED, or ACCEPTED connection status with a given peer.")
    public ResponseEntity<FriendshipStatusResponse> getFriendshipStatus(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID targetUserId
    ) {
        FriendshipStatusResponse response = friendService.getFriendshipStatus(principal.getUserId(), targetUserId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/request")
    @Operation(summary = "Send a friend request", description = "Sends a new friend request to a fellow student.")
    public ResponseEntity<FriendRequestDto> sendFriendRequest(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @Valid @RequestBody SendFriendRequest request
    ) {
        FriendRequestDto response = friendService.sendFriendRequest(principal.getUserId(), request.receiverId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/requests/{id}/accept")
    @Operation(summary = "Accept a friend request", description = "Accepts an incoming friend request and unlocks direct chat messaging.")
    public ResponseEntity<FriendRequestDto> acceptFriendRequest(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID id
    ) {
        FriendRequestDto response = friendService.acceptFriendRequest(principal.getUserId(), id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/requests/{id}/decline")
    @Operation(summary = "Decline a friend request", description = "Declines an incoming friend request.")
    public ResponseEntity<FriendRequestDto> declineFriendRequest(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID id
    ) {
        FriendRequestDto response = friendService.declineFriendRequest(principal.getUserId(), id);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/requests/{id}/cancel")
    @Operation(summary = "Cancel a sent friend request", description = "Cancels a pending friend request sent by current user.")
    public ResponseEntity<Void> cancelFriendRequest(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID id
    ) {
        friendService.cancelFriendRequest(principal.getUserId(), id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{friendUserId}")
    @Operation(summary = "Remove friend", description = "Removes an accepted friend connection.")
    public ResponseEntity<Void> removeFriend(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID friendUserId
    ) {
        friendService.removeFriend(principal.getUserId(), friendUserId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/requests/incoming")
    @Operation(summary = "Get incoming friend requests", description = "Lists all pending friend requests sent to current user.")
    public ResponseEntity<List<FriendRequestDto>> getIncomingRequests(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal
    ) {
        List<FriendRequestDto> response = friendService.getPendingIncomingRequests(principal.getUserId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/requests/outgoing")
    @Operation(summary = "Get outgoing friend requests", description = "Lists all pending friend requests sent by current user.")
    public ResponseEntity<List<FriendRequestDto>> getOutgoingRequests(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal
    ) {
        List<FriendRequestDto> response = friendService.getPendingOutgoingRequests(principal.getUserId());
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @Operation(summary = "Get friends list", description = "Lists all connected friends for current user.")
    public ResponseEntity<List<FriendSummaryDto>> getFriends(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal
    ) {
        List<FriendSummaryDto> response = friendService.getFriends(principal.getUserId());
        return ResponseEntity.ok(response);
    }
}
