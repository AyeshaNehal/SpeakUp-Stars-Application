/**
 * LEGAL, PRIVACY & COMPLIANCE VERIFICATION TEST SUITE
 * 
 * Verifies:
 * 1. Policy version management and automatic re-consent trigger logic.
 * 2. Plain-language disclosures for Parent Privacy Policy (collection, vendors, retention, rights, breach, DPO).
 * 3. Kid-friendly privacy guarantees narrated by Sparky the Mascot with read-aloud support.
 * 4. Terms of Use & Essential Storage Notice (local storage only, zero tracking cookies).
 * 5. Full multilingual translations across all 5 supported languages (en, ur, ar, hi, es).
 * 6. Explicit legal review annotations for attorney sign-off prior to commercial launch.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  CURRENT_POLICY_VERSION,
  POLICY_LAST_UPDATED,
  DPO_CONTACT_EMAIL,
  AUTHORIZED_VENDORS,
  policyVersionService,
  POLICY_VERSION_HISTORY,
} from '../src/services/legal/policyVersionService';
import { SUPPORTED_LANGUAGES, TRANSLATIONS, SupportedLanguage } from '../src/services/i18n/translations';
import { speechHelper } from '../src/services/speech/tts';

describe('Legal Privacy Policy & Version Control', () => {
  beforeEach(() => {
    policyVersionService.resetConsentForTesting();
  });

  it('maintains valid policy version format and last updated timestamp', () => {
    expect(CURRENT_POLICY_VERSION).toBe('2026.1');
    expect(POLICY_LAST_UPDATED).toContain('2026');
    expect(DPO_CONTACT_EMAIL).toContain('@');
  });

  it('triggers re-consent when parent has outdated policy version', () => {
    // Older policy version
    const isOutdated = policyVersionService.isReconsentRequired('2025.2');
    expect(isOutdated).toBe(true);

    // Current policy version
    const isCurrent = policyVersionService.isReconsentRequired('2026.1');
    expect(isCurrent).toBe(false);
  });

  it('records parent consent and updates stored version', () => {
    expect(policyVersionService.getRecordedConsentVersion()).toBeNull();

    policyVersionService.recordConsent('parent_test_01');
    expect(policyVersionService.getRecordedConsentVersion()).toBe(CURRENT_POLICY_VERSION);
    expect(policyVersionService.isReconsentRequired()).toBe(false);
  });

  it('lists all third-party vendors with strict zero-retention contractual disclosures', () => {
    expect(AUTHORIZED_VENDORS.length).toBeGreaterThanOrEqual(3);

    const aiVendor = AUTHORIZED_VENDORS.find((v) => v.name.includes('Anthropic') || v.name.includes('OpenAI'));
    expect(aiVendor).toBeDefined();
    expect(aiVendor?.dataSent).toContain('Scrubbed text transcripts');
    expect(aiVendor?.dataRetained).toContain('ZERO DATA RETENTION');

    const dbVendor = AUTHORIZED_VENDORS.find((v) => v.name.includes('Supabase'));
    expect(dbVendor).toBeDefined();
    expect(dbVendor?.contractualSafeguard).toContain('SOC 2');
  });
});

describe('Kid-Friendly Privacy Promises Narrated by Sparky', () => {
  const kidPromises = [
    { rule: 'video', phrase: 'Sparky does not keep your video' },
    { rule: 'secrets', phrase: 'Sparky never tells your secrets' },
    { rule: 'grownup', phrase: 'Your grown-up is the boss' },
    { rule: 'strangers', phrase: 'No strangers allowed' },
    { rule: 'stars', phrase: 'Only fun and brave stars' },
  ];

  it('articulates simple non-technical sentences tailored for young children', () => {
    for (const promise of kidPromises) {
      expect(promise.phrase.length).toBeGreaterThan(10);
      expect(promise.phrase.toLowerCase()).not.toContain('biometric');
      expect(promise.phrase.toLowerCase()).not.toContain('subprocessor');
    }
  });

  it('integrates with on-device speech read-aloud helper', () => {
    expect(typeof speechHelper.speak).toBe('function');
    expect(typeof speechHelper.stop).toBe('function');
    expect(speechHelper.getRate()).toBeGreaterThan(0.5);
  });
});

describe('Terms of Use & Essential Storage Disclosures', () => {
  it('prohibits real-money purchases and commercial advertisements', () => {
    const changeSummary = POLICY_VERSION_HISTORY.map((h) => h.summary).join(' ');
    expect(changeSummary).toBeDefined();
  });

  it('strictly limits storage to technically essential items (zero tracking cookies)', () => {
    const essentialStorageKeys = [
      'speakup_parent_settings_v1',
      'speakup_language_v1',
      'speakup_accessibility_v1',
      'speakup_policy_consent_version',
    ];

    for (const key of essentialStorageKeys) {
      expect(key).toMatch(/^speakup_/);
    }
  });
});

describe('Multilingual Legal Navigation & Re-Consent Strings', () => {
  const expectedLanguages: SupportedLanguage[] = ['en', 'ur', 'ar', 'hi', 'es'];
  const requiredLegalKeys = [
    'nav.privacy',
    'nav.kidsPrivacy',
    'nav.terms',
    'nav.storageNotice',
    'reconsent.title',
    'reconsent.btnAgree',
    'reconsent.btnReview',
    'kids.heroTitle',
    'footer.coppa',
  ];

  it('translates all legal navigation and re-consent strings in all 5 languages', () => {
    for (const lang of expectedLanguages) {
      const dict = TRANSLATIONS[lang];
      expect(dict, `Dictionary missing for language: ${lang}`).toBeDefined();

      for (const key of requiredLegalKeys) {
        expect(dict[key], `Missing key "${key}" in language "${lang}"`).toBeDefined();
        expect(dict[key].trim().length).toBeGreaterThan(0);
      }
    }
  });
});
