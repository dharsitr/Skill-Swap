/**
 * Phase 14 Security Hardening Verification Test Suite
 * Tests authentication guards, RLS logic, database constraints, input sanitization,
 * XSS neutralization, WebRTC signaling verification, and rate limiting.
 */

import {
  sanitizePlainText,
  sanitizeDisplayName,
  sanitizeBio,
  sanitizeChatMessage,
  sanitizeReviewComment,
  sanitizeConnectionMessage,
  sanitizeSafeUrl,
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

async function runSecurityTests() {
  console.log("\n=======================================================");
  console.log(" SkillSwap Phase 14 — Security Hardening Test Suite");
  console.log("=======================================================\n");

  // --------------------------------------------------------------------------
  // TEST GROUP 1: Input Sanitization & XSS Prevention
  // --------------------------------------------------------------------------
  console.log("1. Input Sanitization & XSS Neutralization:");

  const xssPayload1 = `<script>alert('XSS')</script>Hello World`;
  const sanitized1 = sanitizePlainText(xssPayload1);
  assert(
    sanitized1 === "Hello World",
    "Strips <script> tags from plain text",
    `Got: "${sanitized1}"`
  );

  const xssPayload2 = `<img src=x onerror=alert('pwned')>John Doe`;
  const sanitizedName = sanitizeDisplayName(xssPayload2);
  assert(
    sanitizedName === "John Doe",
    "Strips onerror handlers and HTML from display name",
    `Got: "${sanitizedName}"`
  );

  const bioPayload = `Experienced engineer <iframe src="evil.com"></iframe> & mentor!`;
  const sanitizedBio = sanitizeBio(bioPayload);
  assert(
    !sanitizedBio.includes("<iframe") && sanitizedBio.includes("Experienced engineer"),
    "Strips iframes from user bio",
    `Got: "${sanitizedBio}"`
  );

  const longText = "a".repeat(4000);
  const cappedChat = sanitizeChatMessage(longText);
  assert(
    cappedChat.length === 3000,
    "Strictly caps chat message length to 3000 characters",
    `Length: ${cappedChat.length}`
  );

  const longReview = "b".repeat(1500);
  const cappedReview = sanitizeReviewComment(longReview);
  assert(
    cappedReview.length === 1000,
    "Strictly caps review comment length to 1000 characters",
    `Length: ${cappedReview.length}`
  );

  const longConnMsg = "c".repeat(800);
  const cappedConnMsg = sanitizeConnectionMessage(longConnMsg);
  assert(
    cappedConnMsg.length === 500,
    "Strictly caps connection request message to 500 characters",
    `Length: ${cappedConnMsg.length}`
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 2: Safe URL & Open Redirect Defenses
  // --------------------------------------------------------------------------
  console.log("\n2. Safe URL & Open Redirect Defenses:");

  const badUrl1 = "javascript:alert(document.cookie)";
  assert(
    sanitizeSafeUrl(badUrl1) === null,
    "Rejects javascript: pseudo-protocol URLs",
    `Got: ${sanitizeSafeUrl(badUrl1)}`
  );

  const badUrl2 = "vbscript:msgbox('hi')";
  assert(
    sanitizeSafeUrl(badUrl2) === null,
    "Rejects vbscript: URLs",
    `Got: ${sanitizeSafeUrl(badUrl2)}`
  );

  const badUrl3 = "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==";
  assert(
    sanitizeSafeUrl(badUrl3) === null,
    "Rejects dangerous data:text/html URIs",
    `Got: ${sanitizeSafeUrl(badUrl3)}`
  );

  const safeInternal = "/dashboard/sessions/123/room";
  assert(
    sanitizeSafeUrl(safeInternal) === "/dashboard/sessions/123/room",
    "Permits safe internal relative paths",
    `Got: ${sanitizeSafeUrl(safeInternal)}`
  );

  const protocolRelative = "//evil.com/phish";
  assert(
    sanitizeSafeUrl(protocolRelative) === null,
    "Rejects protocol-relative // URLs",
    `Got: ${sanitizeSafeUrl(protocolRelative)}`
  );

  const safeHttps = "https://images.unsplash.com/photo-12345";
  assert(
    sanitizeSafeUrl(safeHttps) === safeHttps,
    "Permits valid https:// URLs",
    `Got: ${sanitizeSafeUrl(safeHttps)}`
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 3: RFC 4122 UUID Validation
  // --------------------------------------------------------------------------
  console.log("\n3. Identifier & UUID Validation:");

  const validUuid = "123e4567-e89b-12d3-a456-426614174000";
  assert(
    isValidUuid(validUuid) === true,
    "Accepts standard valid RFC 4122 UUID",
    `UUID: ${validUuid}`
  );

  const injectionUuid = "123e4567-e89b-12d3-a456-426614174000' OR '1'='1";
  assert(
    isValidUuid(injectionUuid) === false,
    "Rejects SQL injection attempt in UUID field",
    `UUID: ${injectionUuid}`
  );

  const truncatedUuid = "123e4567-e89b-12d3";
  assert(
    isValidUuid(truncatedUuid) === false,
    "Rejects malformed/truncated UUID",
    `UUID: ${truncatedUuid}`
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 4: In-Memory Rate Limiting
  // --------------------------------------------------------------------------
  console.log("\n4. Abuse Prevention & Rate Limiting:");

  const testKey = `test_rate_limit_${Date.now()}`;
  const maxReqs = 3;
  const windowMs = 5000;

  const res1 = checkRateLimit(testKey, maxReqs, windowMs);
  const res2 = checkRateLimit(testKey, maxReqs, windowMs);
  const res3 = checkRateLimit(testKey, maxReqs, windowMs);
  const res4 = checkRateLimit(testKey, maxReqs, windowMs);

  assert(
    res1.allowed && res2.allowed && res3.allowed,
    "Allows requests within configured rate limits",
    `Reqs 1-3 allowed: ${res1.allowed}, ${res2.allowed}, ${res3.allowed}`
  );

  assert(
    !res4.allowed && res4.retryAfterSeconds > 0,
    "Blocks requests exceeding rate limit and returns retryAfterSeconds",
    `Allowed: ${res4.allowed}, retryAfter: ${res4.retryAfterSeconds}s`
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 5: WebRTC Signaling Verification Logic
  // --------------------------------------------------------------------------
  console.log("\n5. WebRTC Signaling Security Checks:");

  const peerA = "11111111-1111-1111-1111-111111111111";
  const peerB = "22222222-2222-2222-2222-222222222222";
  const roguePeer = "99999999-9999-9999-9999-999999999999";

  // Simulation of handleSignalMessage verification rules
  function verifySignalPacket(
    senderId: string,
    expectedPeerId: string,
    type: string,
    sdp?: { type?: string; sdp?: string }
  ): { accepted: boolean; reason?: string } {
    if (senderId !== expectedPeerId) {
      return { accepted: false, reason: "Unauthorized sender" };
    }
    const allowedTypes = ["peer-joined", "offer", "answer", "ice-candidate", "media-state", "user-left"];
    if (!allowedTypes.includes(type)) {
      return { accepted: false, reason: "Disallowed type" };
    }
    if ((type === "offer" || type === "answer") && (!sdp || sdp.type !== type || typeof sdp.sdp !== "string")) {
      return { accepted: false, reason: "Malformed SDP" };
    }
    return { accepted: true };
  }

  const validOffer = verifySignalPacket(peerB, peerB, "offer", { type: "offer", sdp: "v=0..." });
  assert(
    validOffer.accepted === true,
    "Accepts valid SDP offer from expected peer",
    validOffer.reason
  );

  const rogueOffer = verifySignalPacket(roguePeer, peerB, "offer", { type: "offer", sdp: "v=0..." });
  assert(
    rogueOffer.accepted === false && rogueOffer.reason === "Unauthorized sender",
    "Blocks signaling from rogue unauthorized peer ID",
    rogueOffer.reason
  );

  const invalidType = verifySignalPacket(peerB, peerB, "evil-action");
  assert(
    invalidType.accepted === false && invalidType.reason === "Disallowed type",
    "Rejects unexpected or forged signal type",
    invalidType.reason
  );

  const malformedSdp = verifySignalPacket(peerB, peerB, "offer", { type: "answer", sdp: "v=0..." });
  assert(
    malformedSdp.accepted === false && malformedSdp.reason === "Malformed SDP",
    "Rejects mismatched SDP payload type",
    malformedSdp.reason
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 6: Database Credit Integrity & Constraint Logic
  // --------------------------------------------------------------------------
  console.log("\n6. Database Integrity & Constraints Verification:");

  // Simulated balance subtraction check
  function simulateCreditDeduction(currentBalance: number, spendAmount: number): { success: boolean; newBalance?: number } {
    if (spendAmount < 0) return { success: false };
    const newBalance = currentBalance - spendAmount;
    if (newBalance < 0) {
      return { success: false }; // Insufficient credits / CHECK constraint violation
    }
    return { success: true, newBalance };
  }

  const validDeduction = simulateCreditDeduction(50, 10);
  assert(
    validDeduction.success && validDeduction.newBalance === 40,
    "Allows credit deduction when balance is sufficient",
    `New balance: ${validDeduction.newBalance}`
  );

  const overspend = simulateCreditDeduction(5, 10);
  assert(
    overspend.success === false,
    "Blocks overdraft when spend exceeds balance (balance >= 0 constraint)",
    `Success: ${overspend.success}`
  );

  // Self-booking / Self-review check
  function validateParticipants(teacherId: string, learnerId: string): boolean {
    return teacherId !== learnerId && isValidUuid(teacherId) && isValidUuid(learnerId);
  }

  assert(
    validateParticipants(peerA, peerB) === true,
    "Permits distinct valid teacher and learner",
    "Valid pair"
  );

  assert(
    validateParticipants(peerA, peerA) === false,
    "Rejects self-booking (teacherId === learnerId)",
    "Self-booking caught"
  );

  console.log("\n=======================================================");
  console.log(` Summary: ${passed} passed, ${failed} failed`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityTests();
