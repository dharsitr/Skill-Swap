package com.skillswap.credit.service;

import com.skillswap.common.exception.ApiException;
import com.skillswap.common.exception.ResourceNotFoundException;
import com.skillswap.credit.dto.SessionSettlementResponse;
import com.skillswap.credit.entity.CreditTransaction;
import com.skillswap.credit.entity.CreditTransactionDirection;
import com.skillswap.credit.entity.CreditTransactionType;
import com.skillswap.credit.entity.CreditWallet;
import com.skillswap.credit.repository.CreditTransactionRepository;
import com.skillswap.credit.repository.CreditWalletRepository;
import com.skillswap.session.entity.Session;
import com.skillswap.session.entity.SessionStatus;
import com.skillswap.session.repository.SessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class SessionSettlementService {

    private static final Logger log = LoggerFactory.getLogger(SessionSettlementService.class);

    public static final int DEFAULT_SESSION_CREDIT_AMOUNT = 5;

    private final SessionRepository sessionRepository;
    private final CreditWalletRepository creditWalletRepository;
    private final CreditTransactionRepository creditTransactionRepository;
    private final CreditWalletService creditWalletService;
    private final com.skillswap.common.security.SecurityAuditLogger securityAuditLogger;

    public SessionSettlementService(
            SessionRepository sessionRepository,
            CreditWalletRepository creditWalletRepository,
            CreditTransactionRepository creditTransactionRepository,
            CreditWalletService creditWalletService,
            com.skillswap.common.security.SecurityAuditLogger securityAuditLogger
    ) {
        this.sessionRepository = sessionRepository;
        this.creditWalletRepository = creditWalletRepository;
        this.creditTransactionRepository = creditTransactionRepository;
        this.creditWalletService = creditWalletService;
        this.securityAuditLogger = securityAuditLogger;
    }

    @Transactional
    public SessionSettlementResponse settleSession(UUID currentUserId, UUID sessionId) {
        Session session = sessionRepository.findByIdWithDetails(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", sessionId));

        // Validate caller is a participant in the session
        boolean isParticipant = session.getTeacher().getId().equals(currentUserId)
                || session.getLearner().getId().equals(currentUserId);
        if (!isParticipant) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You are not a participant in this session");
        }

        // Validate session is completed
        if (session.getStatus() != SessionStatus.COMPLETED) {
            throw new ApiException(HttpStatus.CONFLICT, "Only completed sessions can be settled");
        }

        // Check if already settled (Idempotency)
        boolean alreadySettled = creditTransactionRepository.existsBySessionIdAndType(
                sessionId,
                CreditTransactionType.SESSION_SPENDING
        );
        if (alreadySettled) {
            log.info("Session id: {} is already settled. Returning idempotent response.", sessionId);
            return new SessionSettlementResponse(sessionId, "ALREADY_SETTLED", DEFAULT_SESSION_CREDIT_AMOUNT);
        }

        UUID learnerId = session.getLearner().getId();
        UUID teacherId = session.getTeacher().getId();

        // Ensure both wallets exist before acquiring update locks
        creditWalletService.getOrCreateWallet(session.getLearner());
        creditWalletService.getOrCreateWallet(session.getTeacher());

        // Lock wallets in deterministic order to prevent deadlocks
        UUID firstId = learnerId.compareTo(teacherId) < 0 ? learnerId : teacherId;
        UUID secondId = learnerId.compareTo(teacherId) < 0 ? teacherId : learnerId;

        creditWalletRepository.findByUserIdForUpdate(firstId);
        creditWalletRepository.findByUserIdForUpdate(secondId);

        CreditWallet learnerWallet = creditWalletRepository.findByUserId(learnerId)
                .orElseThrow(() -> new ResourceNotFoundException("CreditWallet", "userId", learnerId));
        CreditWallet teacherWallet = creditWalletRepository.findByUserId(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException("CreditWallet", "userId", teacherId));

        // Check learner balance
        if (learnerWallet.getBalance() < DEFAULT_SESSION_CREDIT_AMOUNT) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Insufficient credits to settle this session. Learner available balance: "
                            + learnerWallet.getBalance() + ", required: " + DEFAULT_SESSION_CREDIT_AMOUNT
            );
        }

        // Atomically debit learner
        learnerWallet.setBalance(learnerWallet.getBalance() - DEFAULT_SESSION_CREDIT_AMOUNT);
        creditWalletRepository.save(learnerWallet);

        CreditTransaction learnerTx = new CreditTransaction(
                learnerWallet,
                session.getLearner(),
                DEFAULT_SESSION_CREDIT_AMOUNT,
                CreditTransactionDirection.DEBIT,
                CreditTransactionType.SESSION_SPENDING,
                session,
                "Credits spent for completed learning session: " + session.getSkill().getName()
        );
        creditTransactionRepository.save(learnerTx);

        // Atomically credit teacher
        teacherWallet.setBalance(teacherWallet.getBalance() + DEFAULT_SESSION_CREDIT_AMOUNT);
        creditWalletRepository.save(teacherWallet);

        CreditTransaction teacherTx = new CreditTransaction(
                teacherWallet,
                session.getTeacher(),
                DEFAULT_SESSION_CREDIT_AMOUNT,
                CreditTransactionDirection.CREDIT,
                CreditTransactionType.SESSION_EARNING,
                session,
                "Credits earned for completed teaching session: " + session.getSkill().getName()
        );
        creditTransactionRepository.save(teacherTx);

        log.info("Successfully settled session id: {} for {} credits. Learner new balance: {}, Teacher new balance: {}",
                sessionId, DEFAULT_SESSION_CREDIT_AMOUNT, learnerWallet.getBalance(), teacherWallet.getBalance());

        securityAuditLogger.logCreditTransaction(
                learnerId,
                teacherId,
                java.math.BigDecimal.valueOf(DEFAULT_SESSION_CREDIT_AMOUNT),
                "SESSION_SETTLEMENT",
                sessionId
        );

        return new SessionSettlementResponse(sessionId, "SETTLED", DEFAULT_SESSION_CREDIT_AMOUNT);
    }
}
