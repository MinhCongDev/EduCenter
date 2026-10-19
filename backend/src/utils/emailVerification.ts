import crypto from 'crypto';

/**
 * Email verification token generation + a lightweight, per-process send
 * rate limiter.
 *
 * Note: the limiter lives in memory, so it is not shared across multiple
 * server instances and resets on restart. That is acceptable for the current
 * single-instance deployment; swap it for MongoDB/Redis if the API is scaled.
 */

const MAX_SENDS_PER_WINDOW = 5;
const WINDOW_MS = 15 * 60 * 1000;

export const VERIFICATION_TOKEN_TTL_MS = 15 * 60 * 1000;
export const MAX_VERIFICATION_SENDS = MAX_SENDS_PER_WINDOW;
export const VERIFICATION_WINDOW_MS = WINDOW_MS;

const sendHistory = new Map<string, number[]>();

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const prune = (timestamps: number[], now: number): number[] =>
  timestamps.filter((ts) => now - ts < WINDOW_MS);

/** Generate a URL-safe, high-entropy verification token. */
export const generateVerificationToken = (): string => crypto.randomBytes(64).toString('hex');

/** Hash a token before persisting it. */
export const hashVerificationToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

/** Check whether another verification email may be sent to this address. */
export const canSendVerificationEmail = (email: string): RateLimitResult => {
  const key = normalizeEmail(email);
  const now = Date.now();
  const recent = prune(sendHistory.get(key) ?? [], now);
  sendHistory.set(key, recent);

  if (recent.length < MAX_SENDS_PER_WINDOW) {
    return { allowed: true };
  }

  const oldest = recent[0];
  return {
    allowed: false,
    retryAfterSeconds: Math.max(1, Math.ceil((WINDOW_MS - (now - oldest)) / 1000)),
  };
};

/** Record a verification email send for rate-limiting purposes. */
export const recordVerificationEmailSent = (email: string): void => {
  const key = normalizeEmail(email);
  const now = Date.now();
  const recent = prune(sendHistory.get(key) ?? [], now);
  recent.push(now);
  sendHistory.set(key, recent);
};
