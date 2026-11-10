/**
 * Multilingual PII Scrubber Unit Tests
 * Strictly verifies PRIVACY_RULES.md (Rule 1 & Rule 5)
 *
 * Contains 40 sample sentences across:
 * - English (13 sentences)
 * - Urdu (7 sentences)
 * - Arabic (7 sentences)
 * - Hindi (5 sentences)
 * - Spanish (8 sentences)
 *
 * Tests on-device scrubbing and server-side backstop verification.
 */

import { describe, it, expect } from 'vitest';
import { piiScrubber } from '../src/services/security/piiScrubber';

describe('Multilingual PII Scrubber Comprehensive Benchmark (40 Sentences)', () => {
  // --------------------------------------------------------------------------
  // ENGLISH BENCHMARKS (13 sentences)
  // --------------------------------------------------------------------------
  const englishSamples = [
    {
      id: 'EN-1',
      raw: 'Hello my name is Alex and I love drawing lions.',
      expectedTypes: ['NAME'],
      expectedPlaceholder: '[NAME]',
      mustNotContain: 'Alex',
    },
    {
      id: 'EN-2',
      raw: 'I am Sarah and I am seven years old.',
      expectedTypes: ['NAME'],
      expectedPlaceholder: '[NAME]',
      mustNotContain: 'Sarah',
    },
    {
      id: 'EN-3',
      raw: 'Call me Liam, that is what my friends call me.',
      expectedTypes: ['NAME'],
      expectedPlaceholder: '[NAME]',
      mustNotContain: 'Liam',
    },
    {
      id: 'EN-4',
      raw: 'I live at 123 Main Street with my puppy.',
      expectedTypes: ['ADDRESS'],
      expectedPlaceholder: '[ADDRESS]',
      mustNotContain: '123 Main Street',
    },
    {
      id: 'EN-5',
      raw: 'My house is on 45 Elm Avenue near the park.',
      expectedTypes: ['ADDRESS'],
      expectedPlaceholder: '[ADDRESS]',
      mustNotContain: '45 Elm Avenue',
    },
    {
      id: 'EN-6',
      raw: 'You can call my dad at 555-123-4567 if we get lost.',
      expectedTypes: ['PHONE'],
      expectedPlaceholder: '[PHONE]',
      mustNotContain: '555-123-4567',
    },
    {
      id: 'EN-7',
      raw: 'Send photos to my mom at parent@example.com please.',
      expectedTypes: ['EMAIL'],
      expectedPlaceholder: '[EMAIL]',
      mustNotContain: 'parent@example.com',
    },
    {
      id: 'EN-8',
      raw: 'I go to Lincoln Elementary School in third grade.',
      expectedTypes: ['SCHOOL'],
      expectedPlaceholder: '[SCHOOL]',
      mustNotContain: 'Lincoln Elementary School',
    },
    {
      id: 'EN-9',
      raw: 'My big sister is a student at Oakridge Middle School.',
      expectedTypes: ['SCHOOL'],
      expectedPlaceholder: '[SCHOOL]',
      mustNotContain: 'Oakridge Middle School',
    },
    {
      id: 'EN-10',
      raw: 'I live in London and the weather is rainy.',
      expectedTypes: ['CITY'],
      expectedPlaceholder: '[CITY]',
      mustNotContain: 'London',
    },
    {
      id: 'EN-11',
      raw: 'We moved from Chicago last summer.',
      expectedTypes: ['CITY'],
      expectedPlaceholder: '[CITY]',
      mustNotContain: 'Chicago',
    },
    {
      id: 'EN-12',
      raw: 'Check out my drawing on https://funart.com/kids today!',
      expectedTypes: ['URL'],
      expectedPlaceholder: '[URL]',
      mustNotContain: 'https://funart.com/kids',
    },
    {
      id: 'EN-13',
      raw: 'Follow my brother page at @star_artist on the web.',
      expectedTypes: ['HANDLE'],
      expectedPlaceholder: '[HANDLE]',
      mustNotContain: '@star_artist',
    },
  ];

  it('accurately scrubs English PII instances across names, phones, addresses, and schools', () => {
    for (const sample of englishSamples) {
      const result = piiScrubber.scrubPII(sample.raw);
      expect(result.scrubbedText).toContain(sample.expectedPlaceholder);
      expect(result.scrubbedText).not.toContain(sample.mustNotContain);
      for (const t of sample.expectedTypes) {
        expect(result.detectedTypes).toContain(t);
      }
    }
  });

  // --------------------------------------------------------------------------
  // URDU BENCHMARKS (7 sentences)
  // --------------------------------------------------------------------------
  const urduSamples = [
    {
      id: 'UR-1',
      raw: 'Mera naam Ali hai aur mujhe cricket pasand hai.',
      expectedTypes: ['NAME'],
      expectedPlaceholder: '[NAME]',
      mustNotContain: 'Ali',
    },
    {
      id: 'UR-2',
      raw: 'Main Ayesha hoon aur main cat se pyar karti hoon.',
      expectedTypes: ['NAME'],
      expectedPlaceholder: '[NAME]',
      mustNotContain: 'Ayesha',
    },
    {
      id: 'UR-3',
      raw: 'Mera school Army Public School hai.',
      expectedTypes: ['SCHOOL'],
      expectedPlaceholder: '[SCHOOL]',
      mustNotContain: 'Army Public School',
    },
    {
      id: 'UR-4',
      raw: 'Main Lahore mein rehta hoon apne dada ke sath.',
      expectedTypes: ['CITY'],
      expectedPlaceholder: '[CITY]',
      mustNotContain: 'Lahore',
    },
    {
      id: 'UR-5',
      raw: 'Hum Islamabad mein rehte hain aur ghoomne gaye.',
      expectedTypes: ['CITY'],
      expectedPlaceholder: '[CITY]',
      mustNotContain: 'Islamabad',
    },
    {
      id: 'UR-6',
      raw: 'Mera phone number 0300-1234567 hai jab papa call karein.',
      expectedTypes: ['PHONE'],
      expectedPlaceholder: '[PHONE]',
      mustNotContain: '0300-1234567',
    },
    {
      id: 'UR-7',
      raw: 'Hamara makan House 42 Sector F-8 mein hai.',
      expectedTypes: ['ADDRESS'],
      expectedPlaceholder: '[ADDRESS]',
      mustNotContain: 'House 42 Sector F-8',
    },
  ];

  it('accurately scrubs Urdu child sentences across names, schools, cities, and addresses', () => {
    for (const sample of urduSamples) {
      const result = piiScrubber.scrubPII(sample.raw);
      expect(result.scrubbedText).toContain(sample.expectedPlaceholder);
      expect(result.scrubbedText).not.toContain(sample.mustNotContain);
    }
  });

  // --------------------------------------------------------------------------
  // ARABIC BENCHMARKS (7 sentences)
  // --------------------------------------------------------------------------
  const arabicSamples = [
    {
      id: 'AR-1',
      raw: 'Ismi Omar wa uhibbu lu bat al kura.',
      expectedTypes: ['NAME'],
      expectedPlaceholder: '[NAME]',
      mustNotContain: 'Omar',
    },
    {
      id: 'AR-2',
      raw: 'Ana Fatima wa umri saba sanawat.',
      expectedTypes: ['NAME'],
      expectedPlaceholder: '[NAME]',
      mustNotContain: 'Fatima',
    },
    {
      id: 'AR-3',
      raw: 'Adrusu fee madrasat Al-Amal al-ibtidaiyah.',
      expectedTypes: ['SCHOOL'],
      expectedPlaceholder: '[SCHOOL]',
      mustNotContain: 'Al-Amal',
    },
    {
      id: 'AR-4',
      raw: 'Askun fee Cairo ma a a ilati.',
      expectedTypes: ['CITY'],
      expectedPlaceholder: '[CITY]',
      mustNotContain: 'Cairo',
    },
    {
      id: 'AR-5',
      raw: 'Madeenati heya Dubai fee al-Imarat.',
      expectedTypes: ['CITY'],
      expectedPlaceholder: '[CITY]',
      mustNotContain: 'Dubai',
    },
    {
      id: 'AR-6',
      raw: 'Raqm hatifi huwa +971-50-123-4567 li-tawasul.',
      expectedTypes: ['PHONE'],
      expectedPlaceholder: '[PHONE]',
      mustNotContain: '+971-50-123-4567',
    },
    {
      id: 'AR-7',
      raw: 'Baytuna fee Sharia Al-Nil 14 biqubi min al-bahr.',
      expectedTypes: ['ADDRESS'],
      expectedPlaceholder: '[ADDRESS]',
      mustNotContain: 'Sharia Al-Nil 14',
    },
  ];

  it('accurately scrubs Arabic child sentences across names, cities, schools, and phones', () => {
    for (const sample of arabicSamples) {
      const result = piiScrubber.scrubPII(sample.raw);
      expect(result.scrubbedText).toContain(sample.expectedPlaceholder);
      expect(result.scrubbedText).not.toContain(sample.mustNotContain);
    }
  });

  // --------------------------------------------------------------------------
  // HINDI BENCHMARKS (5 sentences)
  // --------------------------------------------------------------------------
  const hindiSamples = [
    {
      id: 'HI-1',
      raw: 'Mera naam Aarav hai aur main class three mein hoon.',
      expectedTypes: ['NAME'],
      expectedPlaceholder: '[NAME]',
      mustNotContain: 'Aarav',
    },
    {
      id: 'HI-2',
      raw: 'Main Rohan hoon aur mujhe space aur rocket achhe lagte hain.',
      expectedTypes: ['NAME'],
      expectedPlaceholder: '[NAME]',
      mustNotContain: 'Rohan',
    },
    {
      id: 'HI-3',
      raw: 'Main Delhi mein rehta hoon India Gate ke paas.',
      expectedTypes: ['CITY'],
      expectedPlaceholder: '[CITY]',
      mustNotContain: 'Delhi',
    },
    {
      id: 'HI-4',
      raw: 'Mera school Delhi Public School hai jahan mere dost hain.',
      expectedTypes: ['SCHOOL'],
      expectedPlaceholder: '[SCHOOL]',
      mustNotContain: 'Delhi Public School',
    },
    {
      id: 'HI-5',
      raw: 'Papa ka phone number +91-9876543210 diary mein likha hai.',
      expectedTypes: ['PHONE'],
      expectedPlaceholder: '[PHONE]',
      mustNotContain: '9876543210',
    },
  ];

  it('accurately scrubs Hindi child sentences across names, schools, phones, and cities', () => {
    for (const sample of hindiSamples) {
      const result = piiScrubber.scrubPII(sample.raw);
      expect(result.scrubbedText).toContain(sample.expectedPlaceholder);
      expect(result.scrubbedText).not.toContain(sample.mustNotContain);
    }
  });

  // --------------------------------------------------------------------------
  // SPANISH BENCHMARKS (8 sentences)
  // --------------------------------------------------------------------------
  const spanishSamples = [
    {
      id: 'ES-1',
      raw: 'Me llamo Mateo y me encantan los dinosaurios.',
      expectedTypes: ['NAME'],
      expectedPlaceholder: '[NAME]',
      mustNotContain: 'Mateo',
    },
    {
      id: 'ES-2',
      raw: 'Mi nombre es Sofia y tengo ocho años.',
      expectedTypes: ['NAME'],
      expectedPlaceholder: '[NAME]',
      mustNotContain: 'Sofia',
    },
    {
      id: 'ES-3',
      raw: 'Voy a la escuela San Martin todos los dias.',
      expectedTypes: ['SCHOOL'],
      expectedPlaceholder: '[SCHOOL]',
      mustNotContain: 'San Martin',
    },
    {
      id: 'ES-4',
      raw: 'Estudio en el colegio Cervantes con mi maestra.',
      expectedTypes: ['SCHOOL'],
      expectedPlaceholder: '[SCHOOL]',
      mustNotContain: 'Cervantes',
    },
    {
      id: 'ES-5',
      raw: 'Vivo en Madrid con mis abuelos.',
      expectedTypes: ['CITY'],
      expectedPlaceholder: '[CITY]',
      mustNotContain: 'Madrid',
    },
    {
      id: 'ES-6',
      raw: 'Nací en Barcelona y juego al fútbol.',
      expectedTypes: ['CITY'],
      expectedPlaceholder: '[CITY]',
      mustNotContain: 'Barcelona',
    },
    {
      id: 'ES-7',
      raw: 'Mi casa está en Calle Mayor 12 en el centro.',
      expectedTypes: ['ADDRESS'],
      expectedPlaceholder: '[ADDRESS]',
      mustNotContain: 'Calle Mayor 12',
    },
    {
      id: 'ES-8',
      raw: 'El correo de mi papá es familia@correo.es para los deberes.',
      expectedTypes: ['EMAIL'],
      expectedPlaceholder: '[EMAIL]',
      mustNotContain: 'familia@correo.es',
    },
  ];

  it('accurately scrubs Spanish child sentences across names, schools, cities, addresses, and emails', () => {
    for (const sample of spanishSamples) {
      const result = piiScrubber.scrubPII(sample.raw);
      expect(result.scrubbedText).toContain(sample.expectedPlaceholder);
      expect(result.scrubbedText).not.toContain(sample.mustNotContain);
    }
  });

  // --------------------------------------------------------------------------
  // SERVER BACKSTOP VERIFICATION
  // --------------------------------------------------------------------------
  it('confirms server backstop verifies sanitized transcripts and detects clean output', () => {
    const dirty = 'My name is Alex and I live at 123 Main Street in London.';
    const backstop = piiScrubber.serverBackstopScrubPII(dirty);

    expect(backstop.isClean).toBe(true);
    expect(backstop.scrubbedText).toContain('[NAME]');
    expect(backstop.scrubbedText).toContain('[ADDRESS]');
    expect(backstop.scrubbedText).toContain('[CITY]');
    expect(backstop.scrubbedText).not.toContain('Alex');
    expect(backstop.scrubbedText).not.toContain('123 Main Street');
    expect(backstop.scrubbedText).not.toContain('London');
  });

  it('clean speech without PII passes through safely without modifications', () => {
    const safeText = 'The quick brown fox jumps over the lazy dog and looks at the shiny stars.';
    const result = piiScrubber.scrubPII(safeText);

    expect(result.detectedCount).toBe(0);
    expect(result.scrubbedText).toBe(safeText);
  });
});
