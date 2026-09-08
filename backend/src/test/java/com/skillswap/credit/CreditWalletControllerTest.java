package com.skillswap.credit;

import com.skillswap.common.security.AuthenticatedUserPrincipal;
import com.skillswap.credit.entity.CreditTransactionType;
import com.skillswap.credit.entity.CreditWallet;
import com.skillswap.credit.repository.CreditTransactionRepository;
import com.skillswap.credit.repository.CreditWalletRepository;
import com.skillswap.credit.service.CreditWalletService;
import com.skillswap.credit.service.SessionSettlementService;
import com.skillswap.exchange.entity.ExchangeRequest;
import com.skillswap.exchange.entity.ExchangeRequestStatus;
import com.skillswap.exchange.repository.ExchangeRequestRepository;
import com.skillswap.session.entity.Session;
import com.skillswap.session.entity.SessionStatus;
import com.skillswap.session.repository.SessionRepository;
import com.skillswap.skill.entity.Skill;
import com.skillswap.skill.entity.SkillCategory;
import com.skillswap.skill.repository.SkillCategoryRepository;
import com.skillswap.skill.repository.SkillRepository;
import com.skillswap.user.entity.User;
import com.skillswap.user.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class CreditWalletControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserService userService;

    @Autowired
    private SkillCategoryRepository categoryRepository;

    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private ExchangeRequestRepository exchangeRequestRepository;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private CreditWalletRepository creditWalletRepository;

    @Autowired
    private CreditTransactionRepository creditTransactionRepository;

    @Autowired
    private CreditWalletService creditWalletService;

    private User studentA; // Teacher
    private User studentB; // Learner
    private User studentC; // Bystander
    private Skill pythonSkill;

    @BeforeEach
    void setUp() {
        studentA = userService.getOrCreateUser("auth-" + UUID.randomUUID(), "Alice Teacher", "MIT");
        studentB = userService.getOrCreateUser("auth-" + UUID.randomUUID(), "Bob Learner", "Stanford");
        studentC = userService.getOrCreateUser("auth-" + UUID.randomUUID(), "Charlie Bystander", "Harvard");

        SkillCategory category = categoryRepository.save(new SkillCategory(null, "Programming-" + UUID.randomUUID(), "Tech skills"));
        pythonSkill = skillRepository.save(new Skill(null, category, "Python-" + UUID.randomUUID(), "Python programming"));
    }

    private UsernamePasswordAuthenticationToken createAuthToken(User user) {
        AuthenticatedUserPrincipal principal = new AuthenticatedUserPrincipal(
                user.getId(),
                user.getAuthUserId(),
                user.getAuthUserId() + "@campus.edu",
                user.getStatus()
        );
        return new UsernamePasswordAuthenticationToken(
                principal,
                "token",
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
    }

    private Session createCompletedSession(User teacher, User learner, Skill skill) {
        ExchangeRequest request = exchangeRequestRepository.save(new ExchangeRequest(
                null,
                learner,
                teacher,
                skill,
                "Learn Python",
                ExchangeRequestStatus.ACCEPTED
        ));

        return sessionRepository.save(new Session(
                null,
                request,
                teacher,
                learner,
                skill,
                SessionStatus.COMPLETED
        ));
    }


    @Test
    @DisplayName("GET /api/v1/wallet — returns authenticated user wallet with initial balance")
    void getWallet_ReturnsWalletWithInitialBalance() throws Exception {
        mockMvc.perform(get("/api/v1/wallet")
                        .with(authentication(createAuthToken(studentA))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.userId").value(studentA.getId().toString()))
                .andExpect(jsonPath("$.balance").value(CreditWalletService.INITIAL_CREDIT_AMOUNT));
    }

    @Test
    @DisplayName("GET /api/v1/wallet/balance — returns credit balance")
    void getBalance_ReturnsCurrentBalance() throws Exception {
        mockMvc.perform(get("/api/v1/wallet/balance")
                        .with(authentication(createAuthToken(studentA))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.balance").value(CreditWalletService.INITIAL_CREDIT_AMOUNT));
    }

    @Test
    @DisplayName("GET /api/v1/wallet/transactions — returns transaction history including INITIAL_CREDIT")
    void getTransactions_ReturnsPaginatedHistory() throws Exception {
        mockMvc.perform(get("/api/v1/wallet/transactions")
                        .with(authentication(createAuthToken(studentA)))
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].amount").value(CreditWalletService.INITIAL_CREDIT_AMOUNT))
                .andExpect(jsonPath("$.items[0].direction").value("CREDIT"))
                .andExpect(jsonPath("$.items[0].type").value("INITIAL_CREDIT"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @DisplayName("GET /api/v1/wallet/transactions/{id} — returns single transaction for owner")
    void getTransaction_ReturnsSingleTransactionForOwner() throws Exception {
        creditWalletService.getOrCreateWallet(studentA);
        UUID txId = creditTransactionRepository.findByUserId(studentA.getId(), null)
                .getContent().get(0).getId();

        mockMvc.perform(get("/api/v1/wallet/transactions/{id}", txId)
                        .with(authentication(createAuthToken(studentA))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(txId.toString()))
                .andExpect(jsonPath("$.amount").value(CreditWalletService.INITIAL_CREDIT_AMOUNT));
    }

    @Test
    @DisplayName("GET /api/v1/wallet/transactions/{id} — 403 Forbidden when accessing another user's transaction")
    void getTransaction_ForbiddenForOtherUser() throws Exception {
        creditWalletService.getOrCreateWallet(studentA);
        UUID txIdA = creditTransactionRepository.findByUserId(studentA.getId(), null)
                .getContent().get(0).getId();

        mockMvc.perform(get("/api/v1/wallet/transactions/{id}", txIdA)
                        .with(authentication(createAuthToken(studentB))))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/v1/sessions/{id}/settle — successfully settles completed session atomically")
    void settleSession_Success() throws Exception {
        Session session = createCompletedSession(studentA, studentB, pythonSkill);

        // Before settlement: both students have 10 initial credits
        int initialBalance = CreditWalletService.INITIAL_CREDIT_AMOUNT;
        int settlementCost = SessionSettlementService.DEFAULT_SESSION_CREDIT_AMOUNT;

        mockMvc.perform(post("/api/v1/sessions/{id}/settle", session.getId())
                        .with(authentication(createAuthToken(studentA))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId").value(session.getId().toString()))
                .andExpect(jsonPath("$.status").value("SETTLED"))
                .andExpect(jsonPath("$.amount").value(settlementCost));

        // Verify balances after settlement
        CreditWallet walletTeacher = creditWalletRepository.findByUserId(studentA.getId()).orElseThrow();
        CreditWallet walletLearner = creditWalletRepository.findByUserId(studentB.getId()).orElseThrow();

        assertThat(walletTeacher.getBalance()).isEqualTo(initialBalance + settlementCost);
        assertThat(walletLearner.getBalance()).isEqualTo(initialBalance - settlementCost);

        // Verify transactions
        assertThat(creditTransactionRepository.existsBySessionIdAndType(session.getId(), CreditTransactionType.SESSION_EARNING)).isTrue();
        assertThat(creditTransactionRepository.existsBySessionIdAndType(session.getId(), CreditTransactionType.SESSION_SPENDING)).isTrue();

        // Verify audit reconciliation
        assertThat(creditWalletService.reconcileWallet(studentA.getId())).isTrue();
        assertThat(creditWalletService.reconcileWallet(studentB.getId())).isTrue();
    }

    @Test
    @DisplayName("POST /api/v1/sessions/{id}/settle — duplicate settlement is idempotent and returns ALREADY_SETTLED")
    void settleSession_IdempotentDuplicateSettlement() throws Exception {
        Session session = createCompletedSession(studentA, studentB, pythonSkill);

        // First settlement
        mockMvc.perform(post("/api/v1/sessions/{id}/settle", session.getId())
                        .with(authentication(createAuthToken(studentA))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SETTLED"));

        // Second settlement attempt
        mockMvc.perform(post("/api/v1/sessions/{id}/settle", session.getId())
                        .with(authentication(createAuthToken(studentB))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ALREADY_SETTLED"));

        // Verify no duplicate transactions were created
        CreditWallet walletTeacher = creditWalletRepository.findByUserId(studentA.getId()).orElseThrow();
        CreditWallet walletLearner = creditWalletRepository.findByUserId(studentB.getId()).orElseThrow();

        int initialBalance = CreditWalletService.INITIAL_CREDIT_AMOUNT;
        int settlementCost = SessionSettlementService.DEFAULT_SESSION_CREDIT_AMOUNT;

        assertThat(walletTeacher.getBalance()).isEqualTo(initialBalance + settlementCost);
        assertThat(walletLearner.getBalance()).isEqualTo(initialBalance - settlementCost);
    }

    @Test
    @DisplayName("POST /api/v1/sessions/{id}/settle — 409 Conflict when learner has insufficient credits")
    void settleSession_InsufficientCredits() throws Exception {
        Session session = createCompletedSession(studentA, studentB, pythonSkill);

        // Drain studentB's wallet to 2 credits (< 5 required)
        CreditWallet walletB = creditWalletService.getOrCreateWallet(studentB);
        walletB.setBalance(2);
        creditWalletRepository.save(walletB);

        mockMvc.perform(post("/api/v1/sessions/{id}/settle", session.getId())
                        .with(authentication(createAuthToken(studentA))))
                .andExpect(status().isConflict());

        // Verify balances were not changed (atomic rollback)
        CreditWallet walletBAfter = creditWalletRepository.findByUserId(studentB.getId()).orElseThrow();
        CreditWallet walletAAfter = creditWalletRepository.findByUserId(studentA.getId()).orElseThrow();

        assertThat(walletBAfter.getBalance()).isEqualTo(2);
        assertThat(walletAAfter.getBalance()).isEqualTo(CreditWalletService.INITIAL_CREDIT_AMOUNT);
        assertThat(creditTransactionRepository.existsBySessionId(session.getId())).isFalse();
    }

    @Test
    @DisplayName("POST /api/v1/sessions/{id}/settle — 409 Conflict when session is SCHEDULED (not COMPLETED)")
    void settleSession_NonCompletedSessionFails() throws Exception {
        ExchangeRequest request = exchangeRequestRepository.save(new ExchangeRequest(
                null,
                studentB,
                studentA,
                pythonSkill,
                "Learn Python",
                ExchangeRequestStatus.ACCEPTED
        ));

        Session scheduledSession = sessionRepository.save(new Session(
                null,
                request,
                studentA,
                studentB,
                pythonSkill,
                SessionStatus.SCHEDULED
        ));

        mockMvc.perform(post("/api/v1/sessions/{id}/settle", scheduledSession.getId())
                        .with(authentication(createAuthToken(studentA))))
                .andExpect(status().isConflict());
    }


    @Test
    @DisplayName("POST /api/v1/sessions/{id}/settle — 403 Forbidden when caller is not a participant")
    void settleSession_ForbiddenForNonParticipant() throws Exception {
        Session session = createCompletedSession(studentA, studentB, pythonSkill);

        mockMvc.perform(post("/api/v1/sessions/{id}/settle", session.getId())
                        .with(authentication(createAuthToken(studentC))))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/v1/wallet — 401 Unauthorized without authentication token")
    void getWallet_UnauthorizedWithoutToken() throws Exception {
        mockMvc.perform(get("/api/v1/wallet"))
                .andExpect(status().isUnauthorized());
    }
}
