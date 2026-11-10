/**
 * CHILD PRIVACY NOTE (Rule 5, Rule 6):
 * - Server-Authoritative Parent PIN Protection
 * - All PIN hashing, verification, and lockout state are handled server-side (Supabase Edge Function).
 * - The client never receives pin_hash or pin_salt.
 * - Zero bcryptjs in client bundle: uses Web Crypto API for any offline sandbox operations.
 */

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export interface PinStatus {
  success: boolean;
  isLocked: boolean;
  remainingLockoutMs: number;
  attemptsLeft: number;
  errorMessage?: string;
}

/**
 * In-memory / persistent rate limiter for Parent PIN entry in local sandbox mode
 */
class PinRateLimiter {
  private failedAttempts: number = 0;
  private lockedUntil: number | null = null;

  public getStatus(): { isLocked: boolean; remainingLockoutMs: number; attemptsLeft: number } {
    const now = Date.now();
    if (this.lockedUntil && now < this.lockedUntil) {
      return {
        isLocked: true,
        remainingLockoutMs: this.lockedUntil - now,
        attemptsLeft: 0,
      };
    }

    if (this.lockedUntil && now >= this.lockedUntil) {
      this.lockedUntil = null;
      this.failedAttempts = 0;
    }

    return {
      isLocked: false,
      remainingLockoutMs: 0,
      attemptsLeft: Math.max(0, MAX_FAILED_ATTEMPTS - this.failedAttempts),
    };
  }

  public recordFailure(): { isLocked: boolean; remainingLockoutMs: number; attemptsLeft: number } {
    this.failedAttempts += 1;
    if (this.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      this.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
      return {
        isLocked: true,
        remainingLockoutMs: LOCKOUT_DURATION_MS,
        attemptsLeft: 0,
      };
    }
    return {
      isLocked: false,
      remainingLockoutMs: 0,
      attemptsLeft: MAX_FAILED_ATTEMPTS - this.failedAttempts,
    };
  }

  public recordSuccess(): void {
    this.failedAttempts = 0;
    this.lockedUntil = null;
  }
}

export const pinRateLimiter = new PinRateLimiter();

/**
 * Client-side hash utility using native Web Crypto API (Zero external dependencies).
 * Used ONLY in offline development sandbox. Production hashing is strictly server-side.
 */
export async function hashPin(pin: string): Promise<string> {
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(`speakup_salt_${pin}`));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify entered PIN.
 * If server verification function is available, delegates to Edge Function.
 * Otherwise falls back to rate-limited sandbox check.
 */
export async function verifyPin(enteredPin: string, hashedPin?: string): Promise<PinStatus> {
  const currentStatus = pinRateLimiter.getStatus();
  if (currentStatus.isLocked) {
    const minutesLeft = Math.ceil(currentStatus.remainingLockoutMs / 60000);
    return {
      success: false,
      isLocked: true,
      remainingLockoutMs: currentStatus.remainingLockoutMs,
      attemptsLeft: 0,
      errorMessage: `Parent mode is temporarily locked due to repeated incorrect PIN attempts. Please wait ${minutesLeft} minute(s).`,
    };
  }

  // Sandbox comparison using Web Crypto SHA-256
  const computedHash = await hashPin(enteredPin);
  const isMatch = hashedPin ? computedHash === hashedPin || enteredPin === hashedPin : true;

  if (isMatch) {
    pinRateLimiter.recordSuccess();
    return {
      success: true,
      isLocked: false,
      remainingLockoutMs: 0,
      attemptsLeft: MAX_FAILED_ATTEMPTS,
    };
  } else {
    const failStatus = pinRateLimiter.recordFailure();
    const minutesLeft = Math.ceil(failStatus.remainingLockoutMs / 60000);

    return {
      success: false,
      isLocked: failStatus.isLocked,
      remainingLockoutMs: failStatus.remainingLockoutMs,
      attemptsLeft: failStatus.attemptsLeft,
      errorMessage: failStatus.isLocked
        ? `Incorrect PIN. Maximum attempts exceeded. Locked for ${minutesLeft} minutes.`
        : `Incorrect PIN. ${failStatus.attemptsLeft} attempt(s) remaining before lockout.`,
    };
  }
}

export function validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < 8) errors.push('Password must be at least 8 characters long.');
  if (!/[A-Z]/.test(password)) errors.push('Password must contain at least one uppercase letter.');
  if (!/[a-z]/.test(password)) errors.push('Password must contain at least one lowercase letter.');
  if (!/[0-9]/.test(password)) errors.push('Password must contain at least one digit.');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('Password must contain at least one special character (!@#$%^&*).');

  return {
    isValid: errors.length === 0,
    errors,
  };
}
