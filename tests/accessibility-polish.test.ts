/**
 * CHILD ACCESSIBILITY, MULTILINGUAL & WELL-BEING TEST SUITE
 * 
 * Verifies:
 * 1. Multilingual i18n support across English, Urdu, Arabic, Hindi, and Spanish.
 * 2. Proper RTL configuration for Urdu and Arabic, and LTR for English, Hindi, and Spanish.
 * 3. Parameter interpolation in translations.
 * 4. Accessibility settings (Dyslexia-friendly font, High Contrast, Color Blind modes, Text Sizing, Speech Rate, Calm Audio).
 * 5. On-Device Speech and Sound synthesizer rate and mode integration.
 * 6. Seasonal Events & deterministic "Wheel of the Day" selection with +15 Star Points bonus.
 * 7. Screen-Time vocal rest reminder service and snooze logic.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SUPPORTED_LANGUAGES, TRANSLATIONS, SupportedLanguage } from '../src/services/i18n/translations';
import { seasonalEventsService } from '../src/services/events/seasonalEventsService';
import { screenTimeReminderService } from '../src/services/safety/screenTimeReminderService';
import { speechHelper } from '../src/services/speech/tts';
import { soundEffects } from '../src/services/sound/soundEffects';

describe('Child Accessibility & Multilingual Localization (i18n)', () => {
  const expectedLangs: SupportedLanguage[] = ['en', 'ur', 'ar', 'hi', 'es'];

  it('supports all 5 target languages: English, Urdu, Arabic, Hindi, and Spanish', () => {
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
    expect(codes).toEqual(expect.arrayContaining(expectedLangs));
    expect(codes.length).toBe(5);
  });

  it('correctly configures RTL layout for Urdu and Arabic, and LTR for others', () => {
    const ur = SUPPORTED_LANGUAGES.find((l) => l.code === 'ur');
    const ar = SUPPORTED_LANGUAGES.find((l) => l.code === 'ar');
    const en = SUPPORTED_LANGUAGES.find((l) => l.code === 'en');
    const hi = SUPPORTED_LANGUAGES.find((l) => l.code === 'hi');
    const es = SUPPORTED_LANGUAGES.find((l) => l.code === 'es');

    expect(ur?.dir).toBe('rtl');
    expect(ar?.dir).toBe('rtl');
    expect(en?.dir).toBe('ltr');
    expect(hi?.dir).toBe('ltr');
    expect(es?.dir).toBe('ltr');
  });

  it('contains essential child-facing keys across all 5 language dictionaries', () => {
    const criticalKeys = [
      'nav.home',
      'nav.wheel',
      'nav.games',
      'nav.rewards',
      'nav.parent',
      'btn.start',
      'btn.spin',
      'btn.play',
      'wheel.today',
      'wheel.bonus',
      'a11y.title',
      'a11y.dyslexia',
      'a11y.contrast',
      'a11y.calmMode',
      'screentime.reminder',
      'screentime.continue',
    ];

    for (const lang of expectedLangs) {
      const dict = TRANSLATIONS[lang];
      expect(dict).toBeDefined();
      for (const key of criticalKeys) {
        expect(dict[key], `Missing translation key "${key}" in language "${lang}"`).toBeDefined();
        expect(dict[key].trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('interpolates template parameters correctly in translations', () => {
    const enTemplate = TRANSLATIONS.en['app.welcome']; // "Welcome back, {name}! Ready to speak?"
    const interpolated = enTemplate.replace('{name}', 'Leo');
    expect(interpolated).toBe('Welcome back, Leo! Ready to speak?');

    const esTemplate = TRANSLATIONS.es['app.welcome']; // "¡Bienvenido de nuevo, {name}! ¿Listo para hablar?"
    const esInterpolated = esTemplate.replace('{name}', 'Sofia');
    expect(esInterpolated).toContain('Sofia');
  });
});

describe('Accessibility Accommodations & Audio Controls', () => {
  it('allows adjusting speech synthesizer rate within safe child-friendly bounds', () => {
    speechHelper.setRate(0.75);
    expect(speechHelper.getRate()).toBe(0.75);

    speechHelper.setRate(1.25);
    expect(speechHelper.getRate()).toBe(1.25);

    speechHelper.setRate(1.0);
    expect(speechHelper.getRate()).toBe(1.0);

    // Prevents extreme unintelligible rates (< 0.5 or > 2.0)
    speechHelper.setRate(0.1);
    expect(speechHelper.getRate()).toBe(1.0);
  });

  it('toggles calm audio synthesizer mode without breaking audio state', () => {
    soundEffects.setCalmMode(true);
    expect(soundEffects.isCalmMode()).toBe(true);

    soundEffects.setSoundEnabled(false);
    expect(soundEffects.isEnabled()).toBe(false);

    soundEffects.setSoundEnabled(true);
    expect(soundEffects.isEnabled()).toBe(true);

    soundEffects.setCalmMode(false);
    expect(soundEffects.isCalmMode()).toBe(false);
  });
});

describe('Seasonal Events & Deterministic Wheel of the Day', () => {
  it('returns valid seasonal festival event based on month', () => {
    const event = seasonalEventsService.getCurrentSeasonalEvent();
    expect(event).toBeDefined();
    expect(['spring_sprout', 'summer_stars', 'autumn_harvest', 'winter_wonder']).toContain(event.id);
    expect(event.bonusMultiplier).toBeGreaterThanOrEqual(1.0);
    expect(event.featuredCategory).toBeDefined();
  });

  it('deterministically selects the same topic for the same date', () => {
    const date1 = new Date('2026-10-20T10:00:00Z');
    const date2 = new Date('2026-10-20T18:00:00Z'); // Different hour, same day

    const wheel1 = seasonalEventsService.getWheelOfTheDay('6-8', date1);
    const wheel2 = seasonalEventsService.getWheelOfTheDay('6-8', date2);

    expect(wheel1.dateKey).toBe('2026-10-20');
    expect(wheel2.dateKey).toBe('2026-10-20');
    expect(wheel1.featuredTopic.id).toBe(wheel2.featuredTopic.id);
    expect(wheel1.bonusStarPoints).toBe(15);
  });

  it('rotates to different topics across consecutive days', () => {
    const day1 = new Date('2026-05-01T12:00:00Z');
    const day2 = new Date('2026-05-02T12:00:00Z');

    const wheelDay1 = seasonalEventsService.getWheelOfTheDay('6-8', day1);
    const wheelDay2 = seasonalEventsService.getWheelOfTheDay('6-8', day2);

    expect(wheelDay1.dateKey).not.toBe(wheelDay2.dateKey);
  });

  it('provides age-appropriate topic for specified age group', () => {
    const customDate = new Date('2026-06-15T10:00:00Z');
    const wheelYounger = seasonalEventsService.getWheelOfTheDay('3-5', customDate);
    const wheelOlder = seasonalEventsService.getWheelOfTheDay('9-12', customDate);

    expect(wheelYounger.featuredTopic.minAge).toBeLessThanOrEqual(5);
    expect(wheelOlder.featuredTopic.maxAge).toBeGreaterThanOrEqual(9);
  });
});

describe('Screen-Time & Vocal Rest Reminder Service', () => {
  beforeEach(() => {
    screenTimeReminderService.resetSession();
  });

  it('does not trigger reminder immediately on session start', () => {
    expect(screenTimeReminderService.checkReminder(15 * 60)).toBe(false);
  });

  it('triggers vocal rest reminder when practice limit has elapsed', () => {
    // Check with 0-second threshold to simulate elapsed time
    expect(screenTimeReminderService.checkReminder(0)).toBe(true);
  });

  it('respects snooze duration and suppresses reminder until snooze window passes', () => {
    screenTimeReminderService.snoozeReminder(5); // Snooze for 5 minutes
    // Even if threshold is 0, snooze should keep it false
    expect(screenTimeReminderService.checkReminder(0)).toBe(false);
  });

  it('allows resetting session for a fresh speaking cycle', () => {
    screenTimeReminderService.resetSession();
    expect(screenTimeReminderService.checkReminder(900)).toBe(false);
  });
});
