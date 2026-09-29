/**
 * Production-Safe Structured Logger
 * Ensures secrets, tokens, passwords, and sensitive credentials are never logged to console/aggregators.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'access_token',
  'refresh_token',
  'secret',
  'api_key',
  'authorization',
  'cookie',
  'sdp',
  'candidate',
]);

function sanitize(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data === 'string') {
    // Basic redaction of JWTs or bearer tokens if present in strings
    return data.replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, 'Bearer [REDACTED]');
  }
  if (Array.isArray(data)) {
    return data.map(sanitize);
  }
  if (typeof data === 'object') {
    const cleanObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        cleanObj[key] = '[REDACTED]';
      } else {
        cleanObj[key] = sanitize(value);
      }
    }
    return cleanObj;
  }
  return data;
}

class Logger {
  private isProd = process.env.NODE_ENV === 'production';

  debug(message: string, context?: unknown) {
    if (!this.isProd) {
      console.debug(`[DEBUG] ${message}`, context ? sanitize(context) : '');
    }
  }

  info(message: string, context?: unknown) {
    console.info(`[INFO] ${message}`, context ? sanitize(context) : '');
  }

  warn(message: string, context?: unknown) {
    console.warn(`[WARN] ${message}`, context ? sanitize(context) : '');
  }

  error(message: string, error?: unknown) {
    const sanitizedContext = error instanceof Error
      ? { message: error.message, name: error.name }
      : sanitize(error);

    console.error(`[ERROR] ${message}`, sanitizedContext);
  }
}

export const logger = new Logger();
