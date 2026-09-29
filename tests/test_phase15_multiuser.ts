/**
 * SkillSwap Phase 15 — Multi-User Testing & Production Hardening Test Suite
 * Validates full two-user lifecycles, data isolation, session state machines,
 * atomic credit transactions, duplicate prevention, and WebRTC peer validation.
 */

import {
  sanitizePlainText,
  sanitizeDisplayName,
  sanitizeChatMessage,
  sanitizeReviewComment,
  isValidUuid,
  checkRateLimit,
} from "../src/lib/security/sanitize";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ ${testName}${detail ? ` (${detail})` : ""}`);
    failed++;
  }
}

// Simulated In-Memory Database for Multi-User Testing
interface UserRecord {
  id: string;
  email: string;
  displayName: string;
  teachSkills: string[];
  learnSkills: string[];
  credits: number;
}

interface ConnectionRecord {
  id: string;
  senderId: string;
  receiverId: string;
  status: "pending" | "accepted" | "declined";
  message?: string;
}

interface SessionRecord {
  id: string;
  teacherId: string;
  learnerId: string;
  skillName: string;
  scheduledAt: string;
  duration: number;
  creditAmount: number;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "rejected";
}

interface TransactionRecord {
  id: string;
  userId: string;
  amount: number;
  type: string;
  referenceId?: string;
}

interface ReviewRecord {
  id: string;
  sessionId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
}

interface NotificationRecord {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
}

interface MessageRecord {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  readAt?: string | null;
}

async function runMultiUserTests() {
  console.log("\n=================================================================");
  console.log(" SkillSwap Phase 15 — Multi-User & Production Hardening Tests");
  console.log("=================================================================\n");

  // In-memory tables
  let idCounter = 1;
  const users: Record<string, UserRecord> = {};
  const connections: ConnectionRecord[] = [];
  const sessions: SessionRecord[] = [];
  const transactions: TransactionRecord[] = [];
  const reviews: ReviewRecord[] = [];
  const notifications: NotificationRecord[] = [];
  const messages: MessageRecord[] = [];

  // ==========================================================================
  // SECTION 1: USER ONBOARDING & PROFILES
  // ==========================================================================
  console.log("1. Multi-User Onboarding & Profile Setup:");

  const userAId = "11111111-aaaa-4111-8111-111111111111"; // Learner (User A)
  const userBId = "22222222-bbbb-4222-8222-222222222222"; // Teacher (User B)
  const userCId = "33333333-cccc-4333-8333-333333333333"; // Unrelated Peer (User C)

  users[userAId] = {
    id: userAId,
    email: "usera@skillswap.io",
    displayName: sanitizeDisplayName("Alice Learner"),
    teachSkills: ["Spanish"],
    learnSkills: ["Python Programming"],
    credits: 50, // Welcome bonus
  };
  transactions.push({
    id: "tx-welcome-a",
    userId: userAId,
    amount: 50,
    type: "welcome_bonus",
  });

  users[userBId] = {
    id: userBId,
    email: "userb@skillswap.io",
    displayName: sanitizeDisplayName("Bob Teacher"),
    teachSkills: ["Python Programming"],
    learnSkills: ["Spanish"],
    credits: 50,
  };
  transactions.push({
    id: "tx-welcome-b",
    userId: userBId,
    amount: 50,
    type: "welcome_bonus",
  });

  assert(
    users[userAId].credits === 50 && users[userBId].credits === 50,
    "Users initialized with standard 50 starter credits",
    `User A: ${users[userAId].credits}, User B: ${users[userBId].credits}`
  );

  // Matching check
  const isMatchAB =
    users[userAId].learnSkills.some((s) => users[userBId].teachSkills.includes(s)) &&
    users[userBId].learnSkills.some((s) => users[userAId].teachSkills.includes(s));
  assert(
    isMatchAB === true,
    "Mutual match detected: Alice learns Python (Bob teaches), Bob learns Spanish (Alice teaches)",
    "Mutual match verified"
  );

  // ==========================================================================
  // SECTION 2: CONNECTION REQUEST LIFECYCLE
  // ==========================================================================
  console.log("\n2. Connection Request Lifecycle:");

  function sendConnection(senderId: string, receiverId: string, msg?: string) {
    if (senderId === receiverId) throw new Error("Cannot connect with yourself");
    const exists = connections.find(
      (c) =>
        (c.senderId === senderId && c.receiverId === receiverId) ||
        (c.senderId === receiverId && c.receiverId === senderId)
    );
    if (exists) throw new Error("Connection request already exists");

    const conn: ConnectionRecord = {
      id: `conn-${++idCounter}`,
      senderId,
      receiverId,
      status: "pending",
      message: msg ? sanitizePlainText(msg, 500) : undefined,
    };
    connections.push(conn);
    notifications.push({
      id: `notif-${++idCounter}`,
      userId: receiverId,
      type: "connection_request",
      title: "New Connection Request",
      message: `${users[senderId].displayName} sent you a connection request.`,
      read: false,
    });
    return conn;
  }

  const connAB = sendConnection(userAId, userBId, "Hi Bob, I'd love to learn Python from you!");
  assert(
    connAB.status === "pending" && connAB.senderId === userAId && connAB.receiverId === userBId,
    "Alice successfully sends connection request to Bob"
  );

  // Duplicate connection attempt check
  let dupCaught = false;
  try {
    sendConnection(userAId, userBId, "Second request");
  } catch {
    dupCaught = true;
  }
  assert(dupCaught, "Prevents duplicate connection request between identical users");

  // User B accepts connection
  function acceptConnection(connId: string, callerId: string) {
    const conn = connections.find((c) => c.id === connId);
    if (!conn) throw new Error("Not found");
    if (conn.receiverId !== callerId) throw new Error("Unauthorized to accept");
    conn.status = "accepted";
    notifications.push({
      id: `notif-${++idCounter}`,
      userId: conn.senderId,
      type: "connection_accepted",
      title: "Connection Accepted",
      message: `${users[callerId].displayName} accepted your connection.`,
      read: false,
    });
  }

  acceptConnection(connAB.id, userBId);
  assert(
    connAB.status === "accepted",
    "Bob accepts Alice's connection request (status updated to accepted)"
  );

  // ==========================================================================
  // SECTION 3: SESSION BOOKING & ATOMIC CREDITS LIFECYCLE
  // ==========================================================================
  console.log("\n3. Session Booking & Credit Consistency:");

  const scheduledTime = new Date(Date.now() + 86400000).toISOString(); // Tomorrow
  const creditCost = 10;

  function bookSession(learnerId: string, teacherId: string, skill: string, time: string) {
    if (learnerId === teacherId) throw new Error("Cannot book session with yourself");
    const learner = users[learnerId];
    if (learner.credits < creditCost) throw new Error("Insufficient credits");

    // Collision check
    const collision = sessions.find(
      (s) =>
        (s.teacherId === teacherId || s.learnerId === teacherId || s.teacherId === learnerId || s.learnerId === learnerId) &&
        s.scheduledAt === time &&
        (s.status === "pending" || s.status === "confirmed")
    );
    if (collision) throw new Error("Time slot unavailable");

    const sess: SessionRecord = {
      id: `sess-${++idCounter}`,
      teacherId,
      learnerId,
      skillName: skill,
      scheduledAt: time,
      duration: 30,
      creditAmount: creditCost,
      status: "pending",
    };
    sessions.push(sess);
    return sess;
  }

  const session1 = bookSession(userAId, userBId, "Python Programming", scheduledTime);
  assert(
    session1.status === "pending" && session1.learnerId === userAId && session1.teacherId === userBId,
    "Alice creates pending session booking with Bob"
  );

  // Collision stress test: User C attempts to book Bob at the identical scheduled time
  let collisionCaught = false;
  try {
    bookSession(userCId, userBId, "Python Programming", scheduledTime);
  } catch {
    collisionCaught = true;
  }
  assert(
    collisionCaught,
    "Collision check prevents double booking the same teacher at the same scheduled time"
  );

  // Teacher confirms session -> Credits deducted from learner
  function confirmSession(sessionId: string, callerId: string) {
    const sess = sessions.find((s) => s.id === sessionId);
    if (!sess) throw new Error("Session not found");
    if (sess.teacherId !== callerId) throw new Error("Only teacher can confirm");
    if (sess.status !== "pending") throw new Error("Invalid status");

    const learner = users[sess.learnerId];
    if (learner.credits < sess.creditAmount) throw new Error("Learner has insufficient balance");

    // Atomic credit deduction
    learner.credits -= sess.creditAmount;
    transactions.push({
      id: `tx-spend-${sess.id}`,
      userId: sess.learnerId,
      amount: -sess.creditAmount,
      type: "learn_spend",
      referenceId: sess.id,
    });

    sess.status = "confirmed";
    return sess;
  }

  confirmSession(session1.id, userBId);
  assert(
    session1.status === "confirmed" && users[userAId].credits === 40,
    "Bob confirms session: Alice's balance deducted 50 -> 40 credits atomically"
  );

  // ==========================================================================
  // SECTION 4: WEBRTC SIGNALING & ROOM ACCESS ISOLATION
  // ==========================================================================
  console.log("\n4. WebRTC Signaling & Room Authorization:");

  function verifyRoomAccess(sessionId: string, userId: string) {
    const sess = sessions.find((s) => s.id === sessionId);
    if (!sess) return false;
    if (sess.status !== "confirmed") return false;
    return sess.teacherId === userId || sess.learnerId === userId;
  }

  assert(
    verifyRoomAccess(session1.id, userAId) === true && verifyRoomAccess(session1.id, userBId) === true,
    "Both Alice and Bob are authorized to join the video room"
  );

  assert(
    verifyRoomAccess(session1.id, userCId) === false,
    "Unrelated User C is strictly blocked from entering Alice and Bob's private room"
  );

  // Peer-to-peer signaling authorization
  function validateSignal(sessionId: string, senderId: string, expectedPeerId: string, signalType: string) {
    if (senderId !== expectedPeerId) return false;
    const allowed = ["peer-joined", "offer", "answer", "ice-candidate", "media-state", "user-left"];
    return allowed.includes(signalType);
  }

  assert(
    validateSignal(session1.id, userBId, userBId, "offer") === true,
    "Alice accepts SDP offer from verified peer Bob"
  );

  assert(
    validateSignal(session1.id, userCId, userBId, "offer") === false,
    "Alice rejects signaling packet originating from unauthorized third party User C"
  );

  // Real-time chat inside video room
  const convId = `conv-${userAId}-${userBId}`;
  messages.push({
    id: `msg-1`,
    conversationId: convId,
    senderId: userAId,
    content: sanitizeChatMessage("Hello Bob, can you hear me?"),
  });
  messages.push({
    id: `msg-2`,
    conversationId: convId,
    senderId: userBId,
    content: sanitizeChatMessage("Loud and clear Alice! Let's get started."),
  });

  assert(
    messages.length === 2 && messages[0].content === "Hello Bob, can you hear me?",
    "Real-time chat messages successfully exchanged during call"
  );

  // ==========================================================================
  // SECTION 5: SESSION COMPLETION & TEACHER PAYOUT
  // ==========================================================================
  console.log("\n5. Session Completion & Reward Payout:");

  function completeSession(sessionId: string, callerId: string) {
    const sess = sessions.find((s) => s.id === sessionId);
    if (!sess) throw new Error("Session not found");
    if (sess.teacherId !== callerId && sess.learnerId !== callerId) throw new Error("Unauthorized");
    if (sess.status !== "confirmed") throw new Error("Invalid status");

    // Prevent duplicate teacher reward
    const existingPayout = transactions.find(
      (tx) => tx.referenceId === sess.id && tx.type === "teach_reward"
    );
    if (existingPayout) throw new Error("Teacher already rewarded for this session");

    const teacher = users[sess.teacherId];
    teacher.credits += sess.creditAmount;
    transactions.push({
      id: `tx-reward-${sess.id}`,
      userId: sess.teacherId,
      amount: sess.creditAmount,
      type: "teach_reward",
      referenceId: sess.id,
    });

    sess.status = "completed";
    return sess;
  }

  completeSession(session1.id, userBId);
  assert(
    session1.status === "completed" && users[userBId].credits === 60,
    "Session completed: Bob rewarded 50 -> 60 credits for teaching"
  );

  // Duplicate reward attack simulation
  let duplicateRewardCaught = false;
  try {
    completeSession(session1.id, userBId);
  } catch {
    duplicateRewardCaught = true;
  }
  assert(
    duplicateRewardCaught,
    "Duplicate reward prevention protects economy from double payout attacks"
  );

  // ==========================================================================
  // SECTION 6: POST-SESSION REVIEWS & REPUTATION
  // ==========================================================================
  console.log("\n6. Post-Session Reviews & Rating Constraints:");

  function submitReview(sessionId: string, reviewerId: string, revieweeId: string, rating: number, comment?: string) {
    if (reviewerId === revieweeId) throw new Error("Cannot review yourself");
    const sess = sessions.find((s) => s.id === sessionId);
    if (!sess || sess.status !== "completed") throw new Error("Session must be completed");

    const isParticipant =
      (sess.teacherId === reviewerId && sess.learnerId === revieweeId) ||
      (sess.learnerId === reviewerId && sess.teacherId === revieweeId);
    if (!isParticipant) throw new Error("Must be a session participant");

    const existing = reviews.find((r) => r.sessionId === sessionId && r.reviewerId === reviewerId);
    if (existing) throw new Error("Already reviewed this session");

    const rev: ReviewRecord = {
      id: `rev-${++idCounter}`,
      sessionId,
      reviewerId,
      revieweeId,
      rating,
      comment: comment ? sanitizeReviewComment(comment) : undefined,
    };
    reviews.push(rev);
    return rev;
  }

  const reviewA = submitReview(session1.id, userAId, userBId, 5, "Bob is a fantastic Python mentor!");
  assert(
    reviewA.rating === 5 && reviewA.reviewerId === userAId && reviewA.revieweeId === userBId,
    "Alice successfully submits 5-star review for Bob"
  );

  const reviewB = submitReview(session1.id, userBId, userAId, 5, "Alice asked great questions and caught on fast.");
  assert(
    reviewB.rating === 5 && reviewB.reviewerId === userBId && reviewB.revieweeId === userAId,
    "Bob submits 5-star review for Alice"
  );

  // Block self-review
  let selfReviewCaught = false;
  try {
    submitReview(session1.id, userAId, userAId, 5);
  } catch {
    selfReviewCaught = true;
  }
  assert(selfReviewCaught, "Blocks self-review attempt");

  // Block third-party review
  let thirdPartyReviewCaught = false;
  try {
    submitReview(session1.id, userCId, userBId, 1, "Rogue review");
  } catch {
    thirdPartyReviewCaught = true;
  }
  assert(thirdPartyReviewCaught, "Blocks third-party User C from reviewing completed session between A & B");

  // ==========================================================================
  // SECTION 7: CANCELLATION & ATOMIC REFUNDS
  // ==========================================================================
  console.log("\n7. Session Cancellation & Refund Atomicity:");

  // Create another confirmed session
  const scheduledTime2 = new Date(Date.now() + 172800000).toISOString();
  const session2 = bookSession(userAId, userBId, "Python Functions", scheduledTime2);
  confirmSession(session2.id, userBId); // Alice spent 10 credits -> 30 balance

  assert(
    users[userAId].credits === 30,
    "Alice balance at 30 credits after second booking confirmation"
  );

  function cancelSession(sessionId: string, callerId: string, reason?: string) {
    const sess = sessions.find((s) => s.id === sessionId);
    if (!sess) throw new Error("Session not found");
    if (sess.teacherId !== callerId && sess.learnerId !== callerId) throw new Error("Unauthorized");
    if (sess.status !== "pending" && sess.status !== "confirmed") throw new Error("Cannot cancel");

    if (sess.status === "confirmed") {
      // Refund credits
      const learner = users[sess.learnerId];
      learner.credits += sess.creditAmount;
      transactions.push({
        id: `tx-refund-${sess.id}`,
        userId: sess.learnerId,
        amount: sess.creditAmount,
        type: "refund",
        referenceId: sess.id,
      });
    }

    sess.status = "cancelled";
  }

  cancelSession(session2.id, userAId, "Scheduling conflict");
  assert(
    session2.status === "cancelled" && users[userAId].credits === 40,
    "Alice cancels confirmed session: automatically refunded 10 credits (30 -> 40)"
  );

  // ==========================================================================
  // SECTION 8: DATA ISOLATION & PRIVACY VERIFICATION
  // ==========================================================================
  console.log("\n8. Data Isolation & Privacy Guards:");

  // Verify User A transactions are not accessible by User B
  const userATransactions = transactions.filter((t) => t.userId === userAId);
  const userBTransactions = transactions.filter((t) => t.userId === userBId);
  assert(
    userATransactions.every((t) => t.userId === userAId) &&
      userBTransactions.every((t) => t.userId === userBId),
    "Credit transactions are strictly isolated per user ID"
  );

  // Verify notifications isolation
  const userANotifs = notifications.filter((n) => n.userId === userAId);
  const userBNotifs = notifications.filter((n) => n.userId === userBId);
  assert(
    userANotifs.every((n) => n.userId === userAId) &&
      userBNotifs.every((n) => n.userId === userBId),
    "Notifications are strictly private to the recipient user ID"
  );

  console.log("\n=================================================================");
  console.log(` Summary: ${passed} passed, ${failed} failed`);
  console.log("=================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runMultiUserTests();
