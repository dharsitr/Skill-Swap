package com.skillswap.credit.controller;

import com.skillswap.common.response.PageResponse;
import com.skillswap.common.security.AuthenticatedUserPrincipal;
import com.skillswap.credit.dto.CreditBalanceResponse;
import com.skillswap.credit.dto.CreditTransactionResponse;
import com.skillswap.credit.dto.CreditWalletResponse;
import com.skillswap.credit.service.CreditWalletService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/wallet")
@Tag(name = "Credit Wallet", description = "Endpoints for managing user credit wallet, balance, and transaction history")
@SecurityRequirement(name = "BearerAuth")
public class CreditWalletController {

    private final CreditWalletService creditWalletService;

    public CreditWalletController(CreditWalletService creditWalletService) {
        this.creditWalletService = creditWalletService;
    }

    @GetMapping
    @Operation(summary = "Get user wallet", description = "Retrieves the authenticated student's credit wallet.")
    public ResponseEntity<CreditWalletResponse> getWallet(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal
    ) {
        CreditWalletResponse response = creditWalletService.getWallet(principal.getUserId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/balance")
    @Operation(summary = "Get credit balance", description = "Retrieves the available credit balance for the authenticated user.")
    public ResponseEntity<CreditBalanceResponse> getBalance(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal
    ) {
        CreditBalanceResponse response = creditWalletService.getBalance(principal.getUserId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/transactions")
    @Operation(summary = "Get transaction history", description = "Retrieves paginated credit transactions for the authenticated user.")
    public ResponseEntity<PageResponse<CreditTransactionResponse>> getTransactions(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        PageResponse<CreditTransactionResponse> response = creditWalletService.getTransactions(principal.getUserId(), pageRequest);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/transactions/{id}")
    @Operation(summary = "Get transaction by ID", description = "Retrieves details of a specific credit transaction.")
    public ResponseEntity<CreditTransactionResponse> getTransaction(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID id
    ) {
        CreditTransactionResponse response = creditWalletService.getTransaction(principal.getUserId(), id);
        return ResponseEntity.ok(response);
    }
}
