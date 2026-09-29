/**
 * SkillSwap Matching Engine (Phase 7)
 * 
 * Simple, explainable, and deterministic matching algorithm:
 * - If User A wants to learn a skill User B teaches -> match.
 * - If User B wants to learn a skill User A teaches -> stronger mutual match (2-way swap).
 * - Calculates a normalized relevance/match score.
 * - Generates clear, human-readable explanations of why the candidate is recommended.
 */

export type MatchType = "mutual" | "can_learn" | "can_teach" | "explore";

export interface MatchResult {
  matchType: MatchType;
  score: number; // 0 to 100+
  canLearnFromCandidate: string[]; // Skills candidate teaches that you want to learn
  canTeachCandidate: string[];     // Skills you teach that candidate wants to learn
  sharedAvailableDays: string[];
  reasons: string[];               // Human-readable bullet points
  badgeText: string;
}

export interface UserSkillProfile {
  teachSkills: string[];
  learnSkills: string[];
  availableDays?: string[];
}

/**
 * Normalizes skill string for accurate case-insensitive comparison.
 */
function normalizeSkill(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Calculates skill compatibility and explainable match between the current user
 * and a candidate peer.
 */
export function calculateMatch(
  currentUser: UserSkillProfile,
  candidate: UserSkillProfile
): MatchResult {
  const userLearnSet = new Map<string, string>();
  currentUser.learnSkills.forEach((s) => userLearnSet.set(normalizeSkill(s), s));

  const userTeachSet = new Map<string, string>();
  currentUser.teachSkills.forEach((s) => userTeachSet.set(normalizeSkill(s), s));

  const candidateLearnSet = new Map<string, string>();
  candidate.learnSkills.forEach((s) => candidateLearnSet.set(normalizeSkill(s), s));

  const candidateTeachSet = new Map<string, string>();
  candidate.teachSkills.forEach((s) => candidateTeachSet.set(normalizeSkill(s), s));

  // What candidate teaches that user wants to learn
  const canLearnFromCandidate: string[] = [];
  candidate.teachSkills.forEach((skill) => {
    const norm = normalizeSkill(skill);
    if (userLearnSet.has(norm)) {
      canLearnFromCandidate.push(skill);
    }
  });

  // What user teaches that candidate wants to learn
  const canTeachCandidate: string[] = [];
  currentUser.teachSkills.forEach((skill) => {
    const norm = normalizeSkill(skill);
    if (candidateLearnSet.has(norm)) {
      canTeachCandidate.push(skill);
    }
  });

  // Overlapping available days
  const userDays = new Set((currentUser.availableDays || []).map((d) => d.toLowerCase()));
  const sharedAvailableDays: string[] = (candidate.availableDays || []).filter((d) =>
    userDays.has(d.toLowerCase())
  );

  const isMutual = canLearnFromCandidate.length > 0 && canTeachCandidate.length > 0;
  const canLearn = canLearnFromCandidate.length > 0;
  const canTeach = canTeachCandidate.length > 0;

  let matchType: MatchType = "explore";
  let score = 10;
  const reasons: string[] = [];
  let badgeText = "Explore";

  if (isMutual) {
    matchType = "mutual";
    badgeText = "2-Way Swap Match";
    // Base 100 for mutual swaps + 15 per overlapping skill + 5 per overlapping day
    score =
      100 +
      canLearnFromCandidate.length * 15 +
      canTeachCandidate.length * 15 +
      sharedAvailableDays.length * 5;

    reasons.push(
      `Direct 2-way swap! They teach ${canLearnFromCandidate.slice(0, 2).join(", ")} and want to learn ${canTeachCandidate.slice(0, 2).join(", ")}.`
    );
  } else if (canLearn) {
    matchType = "can_learn";
    badgeText = "Can Mentor You";
    score = 65 + canLearnFromCandidate.length * 10 + sharedAvailableDays.length * 5;
    reasons.push(
      `Teaches ${canLearnFromCandidate.slice(0, 2).join(", ")}, which you are looking to learn.`
    );
  } else if (canTeach) {
    matchType = "can_teach";
    badgeText = "Looking for Your Skills";
    score = 45 + canTeachCandidate.length * 10 + sharedAvailableDays.length * 5;
    reasons.push(
      `Looking to learn ${canTeachCandidate.slice(0, 2).join(", ")}, which you have expertise in.`
    );
  } else {
    matchType = "explore";
    badgeText = "Explore";
    score = 15 + sharedAvailableDays.length * 5;
    reasons.push("Broaden your network and discover new disciplines together.");
  }

  if (sharedAvailableDays.length > 0) {
    reasons.push(
      `Both free on ${sharedAvailableDays.slice(0, 3).join(", ")}.`
    );
  }

  return {
    matchType,
    score,
    canLearnFromCandidate,
    canTeachCandidate,
    sharedAvailableDays,
    reasons,
    badgeText,
  };
}
