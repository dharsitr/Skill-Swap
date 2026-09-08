package com.skillswap.credit.service;

import com.skillswap.common.exception.ApiException;
import com.skillswap.common.exception.ResourceNotFoundException;
import com.skillswap.common.response.PageResponse;
import com.skillswap.credit.dto.CreditBalanceResponse;
import com.skillswap.credit.dto.CreditTransactionResponse;
import com.skillswap.credit.dto.CreditWalletResponse;
import com.skillswap.credit.entity.CreditTransaction;
import com.skillswap.credit.entity.CreditTransactionDirection;
import com.skillswap.credit.entity.CreditTransactionType;
import com.skillswap.credit.entity.CreditWallet;
import com.skillswap.credit.repository.CreditTransactionRepository;
import com.skillswap.credit.repository.CreditWalletRepository;
import com.skillswap.user.entity.User;
import com.skillswap.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class CreditWalletService {

    private static final Logger log = LoggerFactory.getLogger(CreditWalletService.class);

    public static final int INITIAL_CREDIT_AMOUNT = 10;

    private final CreditWalletRepository creditWalletRepository;
    private final CreditTransactionRepository creditTransactionRepository;
    private final UserRepository userRepository;

    public CreditWalletService(
            CreditWalletRepository creditWalletRepository,
            CreditTransactionRepository creditTransactionRepository,
            UserRepository userRepository
    ) {
        this.creditWalletRepository = creditWalletRepository;
        this.creditTransactionRepository = creditTransactionRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public CreditWallet getOrCreateWallet(User user) {
        return creditWalletRepository.findByUserId(user.getId()).orElseGet(() -> {
            log.info("Initializing credit wallet with {} initial credits for user id: {}", INITIAL_CREDIT_AMOUNT, user.getId());
            CreditWallet newWallet = new CreditWallet(user, INITIAL_CREDIT_AMOUNT);
            CreditWallet savedWallet = creditWalletRepository.save(newWallet);

            CreditTransaction initialTx = new CreditTransaction(
                    savedWallet,
                    user,
                    INITIAL_CREDIT_AMOUNT,
                    CreditTransactionDirection.CREDIT,
                    CreditTransactionType.INITIAL_CREDIT,
                    null,
                    "Welcome bonus credits for joining SkillSwap"
            );
            creditTransactionRepository.save(initialTx);

            return savedWallet;
        });
    }

    @Transactional
    public CreditWalletResponse getWallet(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        CreditWallet wallet = getOrCreateWallet(user);
        return CreditWalletResponse.from(wallet);
    }

    @Transactional
    public CreditBalanceResponse getBalance(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        CreditWallet wallet = getOrCreateWallet(user);
        return new CreditBalanceResponse(wallet.getBalance());
    }

    @Transactional(readOnly = true)
    public PageResponse<CreditTransactionResponse> getTransactions(UUID userId, Pageable pageable) {
        Page<CreditTransaction> page = creditTransactionRepository.findByUserId(userId, pageable);
        List<CreditTransactionResponse> items = page.getContent()
                .stream()
                .map(CreditTransactionResponse::from)
                .toList();

        return PageResponse.of(items, page.getNumber(), page.getSize(), page.getTotalElements());
    }

    @Transactional(readOnly = true)
    public CreditTransactionResponse getTransaction(UUID userId, UUID transactionId) {
        CreditTransaction transaction = creditTransactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("CreditTransaction", "id", transactionId));

        if (!transaction.getUser().getId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You are not authorized to view this transaction");
        }

        return CreditTransactionResponse.from(transaction);
    }

    @Transactional(readOnly = true)
    public boolean reconcileWallet(UUID userId) {
        CreditWallet wallet = creditWalletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("CreditWallet", "userId", userId));

        int totalCredits = creditTransactionRepository.sumAmountByWalletIdAndDirection(
                wallet.getId(),
                CreditTransactionDirection.CREDIT
        );
        int totalDebits = creditTransactionRepository.sumAmountByWalletIdAndDirection(
                wallet.getId(),
                CreditTransactionDirection.DEBIT
        );

        int calculatedBalance = totalCredits - totalDebits;
        boolean matches = wallet.getBalance() == calculatedBalance;
        if (!matches) {
            log.warn("Wallet reconciliation mismatch for user {}: wallet={}, calculated={}",
                    userId, wallet.getBalance(), calculatedBalance);
        }
        return matches;
    }
}
