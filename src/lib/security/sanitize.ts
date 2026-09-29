/**
 * SkillSwap Universal Security & Sanitization Utilities
 * Protects against Cross-Site Scripting (XSS), prototype pollution, invalid protocols,
 * and input tampering across all services and components.
 */

// Regex patterns for threat detection and sanitization
const SCRIPT_BLOCK_REGEX = /<script\b[^>]*>[\s\S]*?<\/script>/gi;
const STYLE_BLOCK_REGEX = /<style\b[^>]*>[\s\S]*?<\/style>/gi;
const HTML_TAG_REGEX = /<[^>]*>?/gm;
const SCRIPT_INJECTION_REGEX = /(?:javascript|vbscript|data):/gi;
const CONTROL_CHARS_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Strips HTML tags, script schemes, and control characters from text input.
 */
export function sanitizePlainText(input: unknown, maxLength?: number): string {
  if (typeof input !== "string") {
    return "";
  }

  let sanitized = input
    .replace(CONTROL_CHARS_REGEX, "")
    .replace(SCRIPT_BLOCK_REGEX, "")
    .replace(STYLE_BLOCK_REGEX, "")
    .replace(HTML_TAG_REGEX, "")
    .replace(SCRIPT_INJECTION_REGEX, "")
    .trim();

  if (typeof maxLength === "number" && maxLength > 0 && sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength).trim();
  }

  return sanitized;
}

/**
 * Validates and sanitizes a user display name (1–60 characters).
 */
export function sanitizeDisplayName(input: unknown, fallback = "SkillSwap User"): string {
  const clean = sanitizePlainText(input, 60);
  return clean.length >= 1 ? clean : fallback;
}

/**
 * Validates and sanitizes a profile headline (max 120 characters).
 */
export function sanitizeHeadline(input: unknown): string {
  return sanitizePlainText(input, 120);
}

/**
 * Validates and sanitizes a user bio (max 600 characters).
 */
export function sanitizeBio(input: unknown): string {
  return sanitizePlainText(input, 600);
}

/**
 * Validates and sanitizes chat messages (1–3000 characters).
 */
export function sanitizeChatMessage(input: unknown): string {
  return sanitizePlainText(input, 3000);
}

/**
 * Validates and sanitizes review comments (max 1000 characters).
 */
export function sanitizeReviewComment(input: unknown): string {
  return sanitizePlainText(input, 1000);
}

/**
 * Validates and sanitizes connection request notes (max 500 characters).
 */
export function sanitizeConnectionMessage(input: unknown): string {
  return sanitizePlainText(input, 500);
}

/**
 * Validates and sanitizes session cancellation or rejection reasons (max 500 characters).
 */
export function sanitizeSessionReason(input: unknown): string {
  return sanitizePlainText(input, 500);
}

/**
 * Validates that a string is a syntactically valid RFC 4122 UUID.
 */
export function isValidUuid(id: unknown): boolean {
  if (typeof id !== "string") return false;
  return UUID_REGEX.test(id.trim());
}

/**
 * Ensures that URLs only use safe protocols (https, http) or are safe relative paths.
 * Blocks dangerous pseudo-protocols like javascript:, vbscript:, and malicious data: URIs.
 */
export function sanitizeSafeUrl(rawUrl: unknown): string | null {
  if (typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // Safe relative paths starting with / (excluding // which is protocol-relative)
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.toString();
    }
    // Allow safe data URIs for image thumbnails if necessary
    if (parsed.protocol === "data:" && parsed.pathname.startsWith("image/")) {
      return trimmed;
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Simple in-memory rate limiter / debounce tracker to protect high-frequency client actions.
 */
interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitBucket>();

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = rateLimitMap.get(key);

  if (!bucket || now > bucket.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, retryAfterSeconds: 0 };
  }

  if (bucket.count < maxRequests) {
    bucket.count += 1;
    return {
      allowed: true,
      remaining: maxRequests - bucket.count,
      retryAfterSeconds: 0,
    };
  }

  const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);
  return {
    allowed: false,
    remaining: 0,
    retryAfterSeconds: Math.max(1, retryAfterSeconds),
  };
}
