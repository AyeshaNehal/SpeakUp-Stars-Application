import { describe, it, expect, beforeEach } from 'vitest';
import { parentAuthService, ParentAccount, ChildRecord, ConsentRecord } from '../src/services/auth/parentAuthService';

describe('Routing Guard & First-Login Onboarding State Machine', () => {
  beforeEach(async () => {
    await parentAuthService.resetAllToScratch();
  });

  it('State a: Redirects to /login when user is not signed in', async () => {
    const state = await parentAuthService.getAccountState();
    expect(state.step).toBe('login');
    expect(state.route).toBe('/login');
    expect(state.parent).toBeNull();
  });

  it('State b: Redirects to /verify-email when parent email is unverified', async () => {
    const sandbox = parentAuthService.getLocalSandbox();
    const parent: ParentAccount = {
      id: 'parent_test_1',
      email: 'test@example.com',
      emailVerified: false,
      createdAt: new Date().toISOString(),
    };
    sandbox.parents.push(parent);
    parentAuthService.saveLocalSandbox(sandbox);

    const state = await parentAuthService.getAccountState('parent_test_1');
    expect(state.step).toBe('verify_email');
    expect(state.route).toBe('/verify-email');
  });

  it('State c: Redirects to /onboarding/parent when parent profile is incomplete (no displayName / legal guardian)', async () => {
    const sandbox = parentAuthService.getLocalSandbox();
    const parent: ParentAccount = {
      id: 'parent_test_2',
      email: 'verified@example.com',
      emailVerified: true,
      // displayName and isLegalGuardian are missing
      createdAt: new Date().toISOString(),
    };
    sandbox.parents.push(parent);
    parentAuthService.saveLocalSandbox(sandbox);

    const state = await parentAuthService.getAccountState('parent_test_2');
    expect(state.step).toBe('parent_setup');
    expect(state.route).toBe('/onboarding/parent');
  });

  it('State d: Redirects to /onboarding/consent when parental consent is missing', async () => {
    const sandbox = parentAuthService.getLocalSandbox();
    const parent: ParentAccount = {
      id: 'parent_test_3',
      email: 'verified@example.com',
      emailVerified: true,
      displayName: 'Sarah',
      preferredLanguage: 'en',
      isLegalGuardian: true,
      createdAt: new Date().toISOString(),
    };
    sandbox.parents.push(parent);
    parentAuthService.saveLocalSandbox(sandbox);

    const state = await parentAuthService.getAccountState('parent_test_3');
    expect(state.step).toBe('consent');
    expect(state.route).toBe('/onboarding/consent');
  });

  it('State e: Redirects to /onboarding/pin when parent PIN is not set', async () => {
    const sandbox = parentAuthService.getLocalSandbox();
    const parent: ParentAccount = {
      id: 'parent_test_4',
      email: 'verified@example.com',
      emailVerified: true,
      displayName: 'Sarah',
      preferredLanguage: 'en',
      isLegalGuardian: true,
      pinSet: false,
      createdAt: new Date().toISOString(),
    };
    const consent: ConsentRecord = {
      id: 'consent_1',
      parentId: 'parent_test_4',
      consentMetricsProcessing: true,
      consentStoreRecordings: false,
      consentEmailSummaries: false,
      policyVersion: '2026.1',
      timestamp: new Date().toISOString(),
      verificationMethod: 'email_plus_checkbox',
    };
    sandbox.parents.push(parent);
    sandbox.consentRecords.push(consent);
    parentAuthService.saveLocalSandbox(sandbox);

    const state = await parentAuthService.getAccountState('parent_test_4');
    expect(state.step).toBe('pin');
    expect(state.route).toBe('/onboarding/pin');
  });

  it('State f: Redirects to /onboarding/child when no completed child profile exists', async () => {
    const sandbox = parentAuthService.getLocalSandbox();
    const parent: ParentAccount = {
      id: 'parent_test_5',
      email: 'verified@example.com',
      emailVerified: true,
      displayName: 'Sarah',
      preferredLanguage: 'en',
      isLegalGuardian: true,
      pinSet: true,
      createdAt: new Date().toISOString(),
    };
    const consent: ConsentRecord = {
      id: 'consent_2',
      parentId: 'parent_test_5',
      consentMetricsProcessing: true,
      consentStoreRecordings: false,
      consentEmailSummaries: false,
      policyVersion: '2026.1',
      timestamp: new Date().toISOString(),
      verificationMethod: 'email_plus_checkbox',
    };
    sandbox.parents.push(parent);
    sandbox.consentRecords.push(consent);
    parentAuthService.saveLocalSandbox(sandbox);

    const state = await parentAuthService.getAccountState('parent_test_5');
    expect(state.step).toBe('child_wizard');
    expect(state.route).toBe('/onboarding/child');
  });

  it('State g: Resolves to complete (Home) when all criteria are met', async () => {
    const sandbox = parentAuthService.getLocalSandbox();
    const parent: ParentAccount = {
      id: 'parent_test_6',
      email: 'verified@example.com',
      emailVerified: true,
      displayName: 'Sarah',
      preferredLanguage: 'en',
      isLegalGuardian: true,
      pinSet: true,
      createdAt: new Date().toISOString(),
    };
    const consent: ConsentRecord = {
      id: 'consent_3',
      parentId: 'parent_test_6',
      consentMetricsProcessing: true,
      consentStoreRecordings: false,
      consentEmailSummaries: false,
      policyVersion: '2026.1',
      timestamp: new Date().toISOString(),
      verificationMethod: 'email_plus_checkbox',
    };
    const child: ChildRecord = {
      id: 'child_1',
      parentId: 'parent_test_6',
      nickname: 'Flash',
      ageBand: '6-8',
      avatarId: 'sparky',
      onboardingCompleted: true,
      onboardingStep: 7,
      createdAt: new Date().toISOString(),
    };
    sandbox.parents.push(parent);
    sandbox.consentRecords.push(consent);
    sandbox.children.push(child);
    parentAuthService.saveLocalSandbox(sandbox);

    const state = await parentAuthService.getAccountState('parent_test_6');
    expect(state.step).toBe('complete');
    expect(state.route).toBe('/');
    expect(state.activeChild?.nickname).toBe('Flash');
  });

  it('State h: Mid-wizard progress is preserved across tab reloads (closing browser resumes at saved step)', async () => {
    const sandbox = parentAuthService.getLocalSandbox();
    const parent: ParentAccount = {
      id: 'parent_test_7',
      email: 'verified@example.com',
      emailVerified: true,
      displayName: 'Alex',
      preferredLanguage: 'en',
      isLegalGuardian: true,
      pinSet: true,
      createdAt: new Date().toISOString(),
    };
    const consent: ConsentRecord = {
      id: 'consent_4',
      parentId: 'parent_test_7',
      consentMetricsProcessing: true,
      consentStoreRecordings: false,
      consentEmailSummaries: false,
      policyVersion: '2026.1',
      timestamp: new Date().toISOString(),
      verificationMethod: 'email_plus_checkbox',
    };
    // Child is mid-wizard (step 4: interests chosen)
    const midChild: ChildRecord = {
      id: 'child_mid_1',
      parentId: 'parent_test_7',
      nickname: 'Comet',
      ageBand: '9-12',
      avatarId: 'blue',
      interests: ['space', 'music'],
      onboardingCompleted: false,
      onboardingStep: 4,
      createdAt: new Date().toISOString(),
    };
    sandbox.parents.push(parent);
    sandbox.consentRecords.push(consent);
    sandbox.children.push(midChild);
    parentAuthService.saveLocalSandbox(sandbox);

    const state = await parentAuthService.getAccountState('parent_test_7');
    expect(state.step).toBe('child_wizard');
    expect(state.route).toBe('/onboarding/child');
    expect(state.activeChild?.onboardingStep).toBe(4);
    expect(state.activeChild?.nickname).toBe('Comet');
    expect(state.activeChild?.interests).toEqual(['space', 'music']);
  });
});
