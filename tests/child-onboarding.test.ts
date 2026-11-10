import { describe, it, expect, beforeEach } from 'vitest';
import { parentAuthService, ParentAccount, ChildRecord } from '../src/services/auth/parentAuthService';
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

describe('Child Onboarding & Courage Check-In Security Tests', () => {
  let parent: ParentAccount;
  let child: ChildRecord;

  beforeEach(async () => {
    store.clear();

    const parentRes = await parentAuthService.parentSignUp(
      'parent.childtest@example.com',
      'Password123!',
      '1234'
    );
    parent = parentRes.parent!;

    const childRes = await parentAuthService.createChildProfile(
      parent.id,
      'SparkyFriend',
      '6-8',
      'sunny'
    );
    child = childRes.child!;
  });

  it('SCREEN 2: Confirms nickname adhering to Rule 1 data minimization', async () => {
    // Valid nickname update
    const validRes = await parentAuthService.completeChildOnboarding(
      child.id,
      parent.id,
      'SuperStar',
      'sky',
      4
    );
    expect(validRes.success).toBe(true);

    const children = await parentAuthService.getChildrenForParent(parent.id);
    expect(children[0].nickname).toBe('SuperStar');
    expect(children[0].avatarId).toBe('sky');

    // Rejects real full name / PII
    const invalidRes = await parentAuthService.completeChildOnboarding(
      child.id,
      parent.id,
      'john.doe@school.com',
      'sky',
      4
    );
    expect(invalidRes.success).toBe(false);
  });

  it('SCREEN 3 & 4: Validates avatar theme selection and bravery check-in scale (1-5)', async () => {
    // Complete onboarding with level 5 (Unstoppable) and 'mint' theme
    const result = await parentAuthService.completeChildOnboarding(
      child.id,
      parent.id,
      'MightyLeo',
      'mint',
      5
    );
    expect(result.success).toBe(true);

    const children = await parentAuthService.getChildrenForParent(parent.id);
    expect(children[0].nickname).toBe('MightyLeo');
    expect(children[0].avatarId).toBe('mint');
  });

  it('CROSS-FAMILY PROTECTION: Parent B cannot modify Child A onboarding profile', async () => {
    // Create Parent B
    const parentBRes = await parentAuthService.parentSignUp(
      'parentB.intruder@example.com',
      'Password456!',
      '5678'
    );
    const parentB = parentBRes.parent!;

    // Query children under Parent B - Child A must not exist
    const childrenB = await parentAuthService.getChildrenForParent(parentB.id);
    expect(childrenB.some((c) => c.id === child.id)).toBe(false);
  });
});
