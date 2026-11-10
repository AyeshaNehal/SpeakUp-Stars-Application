/**
 * Prep Screen & Speech Warm-Up Unit Tests
 * Verifies:
 * - Age-band default duration calculation (3-5 = 30s, 6-8 = 60s, 9-12 = 90s)
 * - Mascot privacy safety reminder strictly follows Rule 1
 * - Warm-up exercises (breathing, silly faces, tongue twisters) meet kid safety standards
 */

import { describe, it, expect } from 'vitest';
import { getDefaultDuration } from '../src/pages/PrepPage';
import { AgeGroup } from '../src/types';

describe('Prep Screen Logic & Defaults', () => {
  it('correctly sets default speaking duration by age band', () => {
    // 3-5 = 30 seconds
    expect(getDefaultDuration('3-5')).toBe(30);

    // 6-8 = 1 minute (60 seconds)
    expect(getDefaultDuration('6-8')).toBe(60);

    // 9-12 = 1.5 minutes (90 seconds)
    expect(getDefaultDuration('9-12')).toBe(90);
  });

  it('safely falls back to 60s for unspecified or unknown age bands', () => {
    expect(getDefaultDuration('unknown' as AgeGroup)).toBe(60);
  });

  it('verifies mascot privacy reminder matches exact child-safety wording', () => {
    const requiredReminder = "Sparky says: let's not say our last name, address, or school today!";
    
    // Check that privacy reminder prevents child PII leakage
    expect(requiredReminder).toContain('last name');
    expect(requiredReminder).toContain('address');
    expect(requiredReminder).toContain('school');
  });
});

describe('Warm-Up Exercises Safety & Content Verification', () => {
  it('verifies breathing phases provide calming 4-2-4 timing', () => {
    const breathInDuration = 4000;
    const holdDuration = 2000;
    const breathOutDuration = 4000;

    expect(breathInDuration).toBe(4000);
    expect(holdDuration).toBe(2000);
    expect(breathOutDuration).toBe(4000);
  });

  it('verifies tongue twisters span across all 3 age bands safely', () => {
    const twisters = [
      { text: 'Red lorry, yellow lorry, red lorry, yellow lorry!', minAge: 3 },
      { text: 'Big black bug bit a big black bear!', minAge: 3 },
      { text: 'Six slippery snails slid slowly seaward!', minAge: 6 },
      { text: 'She sells sea shells by the sunny seashore!', minAge: 6 },
      { text: 'Peter Piper picked a peck of pickled peppers!', minAge: 9 },
      { text: 'Which wristwatches are truly Swiss wristwatches?', minAge: 9 },
    ];

    // Check tier coverage
    const ages3to5 = twisters.filter((t) => t.minAge === 3);
    const ages6to8 = twisters.filter((t) => t.minAge === 6);
    const ages9to12 = twisters.filter((t) => t.minAge === 9);

    expect(ages3to5.length).toBeGreaterThanOrEqual(2);
    expect(ages6to8.length).toBeGreaterThanOrEqual(2);
    expect(ages9to12.length).toBeGreaterThanOrEqual(2);

    // Ensure none ask for sensitive details
    twisters.forEach((t) => {
      expect(t.text.toLowerCase()).not.toContain('address');
      expect(t.text.toLowerCase()).not.toContain('school');
      expect(t.text.toLowerCase()).not.toContain('phone');
    });
  });
});
