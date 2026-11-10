import { describe, it, expect, beforeEach } from 'vitest';
import { parentAuthService, ParentAccount } from '../src/services/auth/parentAuthService';
import { hashPin, verifyPin, pinRateLimiter } from '../src/services/security/pinSecurity';
import { ChildProfileSchema } from '../src/services/security/validation';

const store = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => store.get(key) || null,
  setItem: (key: string, value: string) => store.set(key, value),
  removeItem: (key: string) => store.delete(key),
  clear: () => store.clear(),
};
// @ts-expect-error polyfill for Node test runner
globalThis.localStorage = mockLocalStorage;

describe('Family Isolation & Child Safety Security Tests', () => {
  let parentA: ParentAccount;
  let parentB: ParentAccount;

  beforeEach(async () => {
    store.clear();
    pinRateLimiter.recordSuccess(); // Reset rate limiter state

    // Create Family A (Account holder: Parent A)
    const resultA = await parentAuthService.parentSignUp(
      'parentA@example.com',
      'Password123!',
      '1234'
    );
    expect(resultA.success).toBe(true);
    parentA = resultA.parent!;

    // Create Family B (Account holder: Parent B)
    const resultB = await parentAuthService.parentSignUp(
      'parentB@example.com',
      'Password456!',
      '5678'
    );
    expect(resultB.success).toBe(true);
    parentB = resultB.parent!;
  });

  it('RULE 1: Restricts children to nickname and age band only (rejects full names & PII)', () => {
    // Valid nickname
    const validResult = ChildProfileSchema.safeParse({
      nickname: 'Sammy',
      ageBand: '6-8',
    });
    expect(validResult.success).toBe(true);

    // Rejects email addresses entered as nicknames
    const emailResult = ChildProfileSchema.safeParse({
      nickname: 'sammy@school.edu',
      ageBand: '6-8',
    });
    expect(emailResult.success).toBe(false);

    // Rejects phone numbers / long digits entered as nicknames
    const phoneResult = ChildProfileSchema.safeParse({
      nickname: 'Sammy 5550199',
      ageBand: '6-8',
    });
    expect(phoneResult.success).toBe(false);
  });

  it('CROSS-TENANT ISOLATION: Parent A cannot access Parent B child data', async () => {
    // Parent A creates child "Leo"
    await parentAuthService.createChildProfile(parentA.id, 'Leo', '6-8', 'lion');

    // Parent B creates child "Maya"
    await parentAuthService.createChildProfile(parentB.id, 'Maya', '3-5', 'panda');

    // Query children for Parent A
    const childrenA = await parentAuthService.getChildrenForParent(parentA.id);
    expect(childrenA.length).toBe(1);
    expect(childrenA[0].nickname).toBe('Leo');

    // Confirm Parent B's child Maya is NOT visible to Parent A
    const containsMaya = childrenA.some((c) => c.nickname === 'Maya');
    expect(containsMaya).toBe(false);

    // Query children for Parent B
    const childrenB = await parentAuthService.getChildrenForParent(parentB.id);
    expect(childrenB.length).toBe(1);
    expect(childrenB[0].nickname).toBe('Maya');

    // Confirm Parent A's child Leo is NOT visible to Parent B
    const containsLeo = childrenB.some((c) => c.nickname === 'Leo');
    expect(containsLeo).toBe(false);
  });

  it('PARENT MODE PIN: Enforces cryptographic hashing, rate limiting, and 5-strike lockout without bcryptjs', async () => {
    const rawPin = '9876';
    const hashed = await hashPin(rawPin);

    // Hash should not equal plain PIN
    expect(hashed).not.toBe(rawPin);

    // Correct PIN succeeds
    const successResult = await verifyPin(rawPin, hashed);
    expect(successResult.success).toBe(true);
    expect(successResult.isLocked).toBe(false);

    // Fail 5 times to trigger brute-force lockout
    for (let i = 0; i < 5; i++) {
      await verifyPin('0000', hashed);
    }

    // 6th attempt must be rejected with active lockout
    const lockedResult = await verifyPin(rawPin, hashed);
    expect(lockedResult.success).toBe(false);
    expect(lockedResult.isLocked).toBe(true);
    expect(lockedResult.remainingLockoutMs).toBeGreaterThan(0);
    expect(lockedResult.errorMessage).toContain('Parent mode is temporarily locked');
  });

  it('CONSENT RECORDS & RIGHT TO WITHDRAW: Timestamped agreement with revocation', async () => {
    // Submit consent
    const consentRes = await parentAuthService.submitParentalConsent(
      parentA.id,
      parentA.email,
      {
        metricsProcessing: true,
        storeRecordings: false, // Default is OFF
        emailSummaries: false,
      },
      'mock_provider'
    );

    expect(consentRes.success).toBe(true);
    expect(consentRes.consentRecord?.consentStoreRecordings).toBe(false);
    expect(consentRes.consentRecord?.verificationReference).toBeDefined();

    // Withdraw consent
    const withdrawRes = await parentAuthService.withdrawConsent(
      parentA.id,
      consentRes.consentRecord!.id
    );
    expect(withdrawRes.success).toBe(true);

    const records = await parentAuthService.getConsentRecords(parentA.id);
    expect(records[0].withdrawnAt).not.toBeNull();
  });
});
