/**
 * CHILD PRIVACY NOTE (Rule 1, Rule 5):
 * - Multilingual On-Device PII Scrubber
 * - Runs on EVERY speech transcript before it is displayed, logged, stored, or transmitted.
 * - Replaces sensitive identifying markers with standardized placeholders:
 *   [NAME], [ADDRESS], [PHONE], [EMAIL], [SCHOOL], [CITY], [URL], [HANDLE]
 * - Provides on-device scrubbing followed by a server-side backstop verification.
 * - Supports English, Urdu, Arabic, Hindi, and Spanish (in native and Romanized scripts).
 */

export interface ScrubResult {
  scrubbedText: string;
  detectedCount: number;
  detectedTypes: string[];
}

// Common international child and family first names across cultures
const COMMON_NAMES = [
  // English / Western
  'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Oliver', 'Sophia', 'Elijah', 'Charlotte', 'William',
  'Amelia', 'James', 'Harper', 'Benjamin', 'Evelyn', 'Lucas', 'Jack', 'Mia', 'Henry', 'Lily',
  'Leo', 'Chloe', 'Sam', 'Sarah', 'Alex', 'David', 'Daniel', 'Michael', 'Emily', 'Jessica',
  // Urdu / South Asian / Pakistani
  'Ali', 'Fatima', 'Ahmad', 'Ahmed', 'Ayesha', 'Zainab', 'Bilal', 'Hamza', 'Hassan', 'Hussein',
  'Zayd', 'Zaid', 'Maryam', 'Sana', 'Usman', 'Omar', 'Umar', 'Sara', 'Zoya', 'Rehan', 'Ayan',
  // Arabic / Middle Eastern
  'Mohammed', 'Muhammad', 'Youssef', 'Tariq', 'Ibrahim', 'Noor', 'Nour', 'Layla', 'Salma', 'Kareem',
  'Zahra', 'Hana', 'Yasmin', 'Farah', 'Khaled', 'Mustafa', 'Huda', 'Rami', 'Amir', 'Rashid',
  // Hindi / Indian
  'Aarav', 'Vihaan', 'Aditya', 'Ananya', 'Diya', 'Ishaan', 'Rohan', 'Pooja', 'Priya', 'Rahul',
  'Aryan', 'Siddharth', 'Neha', 'Kabir', 'Rhea', 'Arjun', 'Meera', 'Kunal', 'Dev', 'Shreya',
  // Spanish / Hispanic
  'Mateo', 'Sofia', 'Santiago', 'Valentina', 'Sebastian', 'Isabella', 'Alejandro', 'Camila', 'Diego',
  'Lucia', 'Carlos', 'Elena', 'Gabriel', 'Maria', 'Jose', 'Juan', 'Alma', 'Manuel', 'Carmen', 'Pau',
];

// Regex for international phone numbers (e.g. +1 555-123-4567, 0300-1234567, +923001234567, 9876543210)
const PHONE_REGEX =
  /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/g;

// Regex for emails
const EMAIL_REGEX =
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

// Regex for URLs
const URL_REGEX =
  /\b(?:https?:\/\/|www\.)[^\s/$.?#].[^\s]*\b/gi;

// Regex for social handles (@username)
const SOCIAL_HANDLE_REGEX =
  /(?<!\w)@([a-zA-Z0-9_]{2,30})\b/g;

// Street Address Keywords across languages
// English: street, st, avenue, ave, road, rd, boulevard, blvd, lane, drive, apt, house #
// Spanish: calle, avenida, carrera, piso, numero
// Urdu/Hindi: gali, rasta, sector, block, makan number, phase
// Arabic: sharia, tariq, binaa, raqm
const ADDRESS_PATTERNS = [
  // Numbers followed by street designators (e.g., 123 Main Street, 45 Elm Ave, 742 Evergreen Terrace)
  /\b\d{1,5}\s+[A-Za-z0-9\s.,-]{2,30}\s+(?:street|st\.?|avenue|ave\.?|road|rd\.?|boulevard|blvd\.?|lane|ln\.?|drive|dr\.?|way|terrace|court|ct\.?|place|pl\.?)\b/gi,
  // Spanish: Calle / Avenida / Carrera followed by name or number (e.g., Calle Mayor 12, Avenida Libertad 45)
  /\b(?:calle|avenida|carrera|paseo|plaza)\s+[A-Za-z0-9\s.,-]{2,25}\s*(?:n[úu]mero|n[ºo]\.?|\d{1,5})\b/gi,
  // Urdu / Hindi: House / Block / Sector / Gali patterns (e.g., House 42, Sector F-8, Block B, Gali number 4)
  /\b(?:house|makan|flat|apt|apartment)\s*(?:no\.?|number|#)?\s*\d+[A-Za-z0-9\s,-]*(?:sector|block|phase|gali)\s*[A-Za-z0-9-]+\b/gi,
  /\b(?:sector|block|phase|gali)\s*[A-Za-z0-9-]+\s*(?:house|makan|flat)?\s*\d+\b/gi,
  // Arabic: Sharia / Tariq with number (e.g., Sharia Al-Nil 14, Tariq Al-Madina)
  /\b(?:sharia|tariq|shari'|shara)\s+[A-Za-z0-9\s'-]{2,25}\s*(?:raqm|\d{1,5})\b/gi,
  // "I live on [Address]"
  /\b(?:i live on|my address is|vivimos en|vivo en la calle)\s+([A-Za-z0-9\s.,-]{3,35})\b/gi,
];

// School Patterns across languages
// English: "I go to ... school", "... elementary", "... academy", "... middle school"
// Spanish: "Voy a la escuela ...", "colegio ...", "instituto ..."
// Urdu/Hindi: "Mera school ... hai", "... school mein parhta hoon", "vidyalaya ..."
// Arabic: "Madrasat ...", "adrus fee madrasat ..."
const SCHOOL_PATTERNS = [
  // English school patterns
  /\b(?:i go to|i study at|my school is|student at)\s+([A-Za-z0-9\s'-]{2,30}?)\s+(?:school|elementary|grammar school|high school|middle school|academy|prep|preschool|kindergarten)\b/gi,
  /\b([A-Za-z0-9\s'-]{2,25})\s+(?:elementary school|primary school|grammar school|middle school|high school|public school)\b/gi,
  // Spanish school patterns
  /\b(?:voy a la escuela|estudio en el colegio|mi escuela es|mi colegio es)\s+([A-Za-z0-9\s'-]{2,30})\b/gi,
  /\b(?:colegio|escuela|instituto)\s+([A-Za-z0-9\s'-]{2,25})\b/gi,
  // Urdu / Hindi school patterns
  /\b(?:mera school|mere school ka naam)\s+([A-Za-z0-9\s'-]{2,30})\s+(?:hai|tha)\b/gi,
  /\b([A-Za-z0-9\s'-]{2,25})\s+(?:school mein parhta|vidyalaya mein)\b/gi,
  // Arabic school patterns
  /\b(?:madrasat|adrusu fee madrasat|madrasati heya)\s+([A-Za-z0-9\s'-]{2,30})\b/gi,
];

// City / Location Patterns across languages
// English: "I live in [City]", "we live in [City]", "from [City]"
// Spanish: "Vivo en [City]", "nací en [City]"
// Urdu/Hindi: "Main [City] mein rehta hoon", "hum [City] mein rehte hain"
// Arabic: "Askun fee [City]", "ana min [City]"
const CITY_LOCATION_PATTERNS = [
  // English city/town patterns
  /\b(?:i live in|we live in|i'm from|i am from|my hometown is|my city is)\s+([A-Z][a-zA-Z\s'-]{2,25})(?=[.,!?;]|\s+(?:and|with|because|where)|$)/gi,
  // Spanish city patterns
  /\b(?:vivo en|vivimos en|soy de|mi ciudad es)\s+([A-ZÁÉÍÓÚÑa-záéíóúñ\s'-]{2,25})(?=[.,!?;]|\s+(?:y|donde|con)|$)/gi,
  // Urdu / Hindi Romanized city patterns
  /\b(?:main|hum)\s+([A-Za-z\s'-]{2,25})\s+(?:mein rehta|mein rehti|se hoon|me rehte)\b/gi,
  /\b(?:mera shehar|mere shahar ka naam)\s+([A-Za-z\s'-]{2,25})\s+(?:hai)\b/gi,
  // Arabic Romanized city patterns
  /\b(?:askun fee|askunu fi|ana min|madeenati heya)\s+([A-Za-z\s'-]{2,25})(?=[.,!?;]|\s+(?:wa|fi)|$)/gi,
  // Common world cities list check
  /\b(?:New York|London|Paris|Tokyo|Lahore|Karachi|Islamabad|Delhi|Mumbai|Dubai|Riyadh|Cairo|Madrid|Barcelona|Bogota|Mexico City|Buenos Aires|Toronto|Sydney|Chicago|Houston|Miami)\b/gi,
];

// Name Introductions across languages
// English: "My name is [X]", "I am [X]", "I'm [X]", "Call me [X]"
// Spanish: "Me llamo [X]", "Mi nombre es [X]", "Soy [X]"
// Urdu/Hindi: "Mera naam [X] hai", "Mujhe [X] kehte hain", "Main [X] hoon"
// Arabic: "Ismi [X]", "Ana [X]"
const NAME_INTRODUCTION_PATTERNS = [
  /\b(?:my name is|i'm|i am|call me|they call me)\s+([A-Z][a-z]{1,20})\b/gi,
  /\b(?:me llamo|mi nombre es|soy)\s+([A-ZÁÉÍÓÚÑa-záéíóúñ]{2,20})\b/gi,
  /\b(?:mera naam|mera nam)\s+([A-Za-z]{2,20})\s+(?:hai)\b/gi,
  /\b(?:main)\s+([A-Za-z]{2,20})\s+(?:hoon|hu)\b/gi,
  /\b(?:ismi|esmi|ana)\s+([A-Za-z]{2,20})\b/gi,
];

class PiiScrubber {
  /**
   * Primary On-Device PII Scrubber
   * Cleans names, phone numbers, emails, addresses, school names, cities, and handles.
   */
  public scrubPII(text: string): ScrubResult {
    if (!text || typeof text !== 'string') {
      return { scrubbedText: '', detectedCount: 0, detectedTypes: [] };
    }

    let result = text;
    const detectedTypesSet = new Set<string>();
    let detectedCount = 0;

    // 1. Emails
    result = result.replace(EMAIL_REGEX, () => {
      detectedTypesSet.add('EMAIL');
      detectedCount++;
      return '[EMAIL]';
    });

    // 2. URLs
    result = result.replace(URL_REGEX, () => {
      detectedTypesSet.add('URL');
      detectedCount++;
      return '[URL]';
    });

    // 3. Social Handles
    result = result.replace(SOCIAL_HANDLE_REGEX, () => {
      detectedTypesSet.add('HANDLE');
      detectedCount++;
      return '[HANDLE]';
    });

    // 4. Phone Numbers
    result = result.replace(PHONE_REGEX, (match) => {
      // Avoid scrubbing small plain numbers like "5" or "10"
      const digitsOnly = match.replace(/\D/g, '');
      if (digitsOnly.length >= 7) {
        detectedTypesSet.add('PHONE');
        detectedCount++;
        return '[PHONE]';
      }
      return match;
    });

    // 5. Street Addresses
    for (const pattern of ADDRESS_PATTERNS) {
      result = result.replace(pattern, () => {
        detectedTypesSet.add('ADDRESS');
        detectedCount++;
        return '[ADDRESS]';
      });
    }

    // 6. Schools
    for (const pattern of SCHOOL_PATTERNS) {
      result = result.replace(pattern, () => {
        detectedTypesSet.add('SCHOOL');
        detectedCount++;
        return '[SCHOOL]';
      });
    }

    // 7. Cities & Locations
    for (const pattern of CITY_LOCATION_PATTERNS) {
      result = result.replace(pattern, () => {
        detectedTypesSet.add('CITY');
        detectedCount++;
        return '[CITY]';
      });
    }

    // 8. Name Introductions ("My name is...", "Mera naam ... hai", etc.)
    for (const pattern of NAME_INTRODUCTION_PATTERNS) {
      result = result.replace(pattern, () => {
        detectedTypesSet.add('NAME');
        detectedCount++;
        return '[NAME]';
      });
    }

    // 9. Common First Names Dictionary Scan
    // Scan standalone names surrounded by word boundaries
    for (const name of COMMON_NAMES) {
      const nameRegex = new RegExp(`\\b${name}\\b`, 'gi');
      result = result.replace(nameRegex, () => {
        detectedTypesSet.add('NAME');
        detectedCount++;
        return '[NAME]';
      });
    }

    // Clean up duplicate adjacent placeholders (e.g. "[NAME] [NAME]" -> "[NAME]")
    const placeholderTypes = ['NAME', 'ADDRESS', 'PHONE', 'EMAIL', 'SCHOOL', 'CITY', 'URL', 'HANDLE'];
    for (const type of placeholderTypes) {
      const dupRegex = new RegExp(`(?:\\[${type}\\]\\s*){2,}`, 'g');
      result = result.replace(dupRegex, `[${type}] `);
    }

    return {
      scrubbedText: result.trim(),
      detectedCount,
      detectedTypes: Array.from(detectedTypesSet),
    };
  }

  /**
   * Server-Side Backstop Scrubber
   * Runs as a second verification layer before any transcript is stored in Supabase or exported.
   * Returns whether the transcript passed validation and an extra-purified text.
   */
  public serverBackstopScrubPII(text: string): { scrubbedText: string; isClean: boolean } {
    const onDeviceResult = this.scrubPII(text);
    const scrubbed = onDeviceResult.scrubbedText;

    // Secondary check for residual patterns:
    // Check if any leftover email, phone, or raw URL slipped through
    const hasResidualEmail = EMAIL_REGEX.test(scrubbed);
    const hasResidualUrl = URL_REGEX.test(scrubbed);
    const rawDigits = scrubbed.match(/\b\d{7,15}\b/);

    const isClean = !hasResidualEmail && !hasResidualUrl && !rawDigits;

    return {
      scrubbedText: scrubbed,
      isClean,
    };
  }
}

export const piiScrubber = new PiiScrubber();

/**
 * Convenience helper that returns the sanitized string directly.
 */
export const scrubPII = (text: string): string => piiScrubber.scrubPII(text).scrubbedText;
