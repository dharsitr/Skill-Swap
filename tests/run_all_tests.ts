/**
 * SkillSwap Comprehensive Automated Test Runner
 * Executes all Phase 14 Security Hardening and Phase 15 Multi-User tests.
 */

import { execSync } from "child_process";

console.log("\n=======================================================");
console.log(" Running SkillSwap Full Test Suite (Phases 14 & 15)...");
console.log("=======================================================\n");

try {
  console.log("--> Running Phase 14 Security Hardening Tests...");
  execSync("npx tsx tests/test_phase14_security.ts", { stdio: "inherit" });

  console.log("\n--> Running Phase 15 Multi-User & Consistency Tests...");
  execSync("npx tsx tests/test_phase15_multiuser.ts", { stdio: "inherit" });

  console.log("\n--> Running Phase 17 Settings & Account Management Tests...");
  execSync("npx tsx tests/test_phase17_settings.ts", { stdio: "inherit" });

  console.log("\n=======================================================");
  console.log(" 🎉 ALL SKILLSWAP AUTOMATED TESTS PASSED SUCCESSFULLY!");
  console.log("=======================================================\n");
} catch (error) {
  console.error("\n❌ Test suite failure detected:", error);
  process.exit(1);
}

