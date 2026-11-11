/**
 * LEGAL PRIVACY & POLICY VERSION CONTROL SERVICE
 * 
 * ============================================================================
 * /* LEGAL REVIEW REQUIRED:
 * A qualified children's digital privacy attorney must review and approve this
 * document, vendor list, and consent verification flow prior to commercial deployment
 * in compliance with the FTC Children's Online Privacy Protection Act (COPPA Rule 16 CFR Part 312),
 * the EU/UK General Data Protection Regulation (GDPR-K / Article 8), California Age-Appropriate
 * Design Code Act (AB 2273), and international youth privacy standards.
 * ============================================================================
 */

export const CURRENT_POLICY_VERSION = '2026.1';
export const POLICY_LAST_UPDATED = 'October 20, 2026';
export const DPO_CONTACT_EMAIL = 'privacy@speakupstars.com';
export const DPO_MAILING_ADDRESS = 'SpeakUp Stars Digital Learning Inc., Attn: Child Privacy & DPO, 500 Sparky Way, Suite 100, San Francisco, CA 94107, USA';

export interface PolicyChangeEntry {
  version: string;
  effectiveDate: string;
  summary: string;
  details: string[];
}

export const POLICY_VERSION_HISTORY: PolicyChangeEntry[] = [
  {
    version: '2026.1',
    effectiveDate: 'October 20, 2026',
    summary: 'Launch of kid-friendly narrated privacy page, strengthened local-only audio guarantees, and zero-retention AI vendor disclosures.',
    details: [
      'Added interactive, read-aloud Kid-Friendly Privacy Page narrated by Sparky the Mascot.',
      'Explicitly clarified zero-retention vendor processing agreements for speech transcript analysis.',
      'Documented Essential Local Storage policy (zero advertising or tracking cookies).',
      'Affirmed instantaneous in-memory erasure of face analysis frames (zero biometric storage).',
    ],
  },
  {
    version: '2025.2',
    effectiveDate: 'June 15, 2025',
    summary: 'Initial parental consent framework with 30-day auto-purge for opt-in recordings.',
    details: [
      'Established verified parental consent (VPC) before enabling optional cloud recording persistence.',
      'Added granular parent controls: 1-click irreversible data deletion and JSON/CSV data export.',
    ],
  },
];

export interface VendorDisclosure {
  name: string;
  role: string;
  dataSent: string;
  dataRetained: string;
  privacyPolicyUrl: string;
  contractualSafeguard: string;
}

export const AUTHORIZED_VENDORS: VendorDisclosure[] = [
  {
    name: 'Hosting & CDN (Vercel / Cloudflare)',
    role: 'Delivers web application assets (HTML, CSS, 3D WebGL assets) securely over HTTPS.',
    dataSent: 'Standard IP addresses and ephemeral HTTPS network packets for edge routing. Zero child identity data.',
    dataRetained: 'Zero child identity data. Ephemeral edge routing logs scrubbed after 24 hours.',
    privacyPolicyUrl: 'https://vercel.com/legal/privacy-policy',
    contractualSafeguard: 'Strict privacy-first CDN agreement with zero commercial tracking.',
  },
  {
    name: 'Database & Cloud Storage (Supabase / AWS)',
    role: 'Cloud database with Row-Level Security (RLS) isolating each family.',
    dataSent: 'Parent email, bcrypt-hashed parent PIN, child nickname (e.g. "StarKid"), speaking star points, streak days, and scrubbed transcripts.',
    dataRetained: 'Encrypted at rest (AES-256). Deleted immediately upon parent deletion request or within 30 days for opt-in recordings.',
    privacyPolicyUrl: 'https://supabase.com/privacy',
    contractualSafeguard: 'SOC 2 Type II certified cloud provider with automated encrypted daily backups.',
  },
  {
    name: 'Speech-to-Text (On-Device Web Speech / Whisper)',
    role: 'Transcribes voice audio to text in real time during speaking practice.',
    dataSent: 'Audio stream processed entirely inside client device memory. Zero external network transmission.',
    dataRetained: 'Zero seconds (discarded immediately after transcription). Never stored or transmitted to external servers.',
    privacyPolicyUrl: 'https://wicg.github.io/speech-api/',
    contractualSafeguard: 'Local on-device execution; zero third-party cloud transcription vendors involved.',
  },
  {
    name: 'LLM Feedback API (Anthropic / OpenAI)',
    role: 'Generates supportive, age-appropriate speaking coaching feedback.',
    dataSent: 'Scrubbed text transcripts (with all names and locations removed) + numeric metrics only. ZERO audio, ZERO video, ZERO child names.',
    dataRetained: 'ZERO DATA RETENTION (ZDR agreement). Prompts and outputs are never stored on vendor servers or used for model training.',
    privacyPolicyUrl: 'https://www.anthropic.com/privacy',
    contractualSafeguard: 'Enterprise Data Processing Addendum (DPA) with strict BAA/COPPA zero-retention clause.',
  },
  {
    name: 'Transactional Email (Resend / AWS SES)',
    role: 'Delivers critical notices, deletion confirmations, and dormancy warnings to parents only.',
    dataSent: 'Parent email address and transactional message text. Never sends emails to children.',
    dataRetained: 'Transient mail delivery logs retained for 7 days, then permanently deleted.',
    privacyPolicyUrl: 'https://resend.com/privacy',
    contractualSafeguard: 'Signed Data Processing Agreement with strict parent-only delivery rules.',
  },
  {
    name: 'Payments & VPC (Stripe)',
    role: 'Verified Parental Consent (VPC) authorization and optional parent subscription billing.',
    dataSent: 'Parent credit card details tokenized directly in browser. Child mode features $0 transactions.',
    dataRetained: 'Retained per PCI-DSS statutory compliance for parent billing records only.',
    privacyPolicyUrl: 'https://stripe.com/privacy',
    contractualSafeguard: 'PCI-DSS Level 1 certified processor with signed enterprise DPA.',
  },
  {
    name: 'Error Tracking & Logging (Internal Sanitized Logger)',
    role: 'Captures runtime bugs while safeguarding child privacy.',
    dataSent: 'Scrubbed error messages and stack traces with automated regex redaction of tokens, emails, IPs, transcripts, and media blobs.',
    dataRetained: 'Rolling 30-day auto-purge. Zero third-party telemetry or session replay SDKs.',
    privacyPolicyUrl: '/privacy',
    contractualSafeguard: 'Internal architecture; zero external telemetry vendors (No Sentry, No Mixpanel, No Datadog).',
  },
];

const STORAGE_CONSENT_KEY = 'speakup_policy_consent_version';

class PolicyVersionService {
  private memoryConsentVersion: string | null = null;

  /**
   * Returns whether the parent needs to re-consent to an updated privacy policy.
   */
  public isReconsentRequired(parentConsentedVersion?: string): boolean {
    if (parentConsentedVersion) {
      return parentConsentedVersion !== CURRENT_POLICY_VERSION;
    }

    if (this.memoryConsentVersion) {
      return this.memoryConsentVersion !== CURRENT_POLICY_VERSION;
    }

    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_CONSENT_KEY);
        if (stored) return stored !== CURRENT_POLICY_VERSION;
      } catch {
        return false;
      }
    }

    // Default to true if no consent has ever been recorded
    return true;
  }

  /**
   * Records parental consent to the current policy version.
   */
  public recordConsent(_parentId?: string): void {
    this.memoryConsentVersion = CURRENT_POLICY_VERSION;

    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_CONSENT_KEY, CURRENT_POLICY_VERSION);
        localStorage.setItem(
          `${STORAGE_CONSENT_KEY}_timestamp`,
          new Date().toISOString()
        );
      } catch {
        // ignore
      }
    }
  }

  /**
   * Retrieves the version currently recorded in local storage or memory.
   */
  public getRecordedConsentVersion(): string | null {
    if (this.memoryConsentVersion) {
      return this.memoryConsentVersion;
    }

    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        return localStorage.getItem(STORAGE_CONSENT_KEY);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Resets consent for testing purposes.
   */
  public resetConsentForTesting(): void {
    this.memoryConsentVersion = null;
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_CONSENT_KEY);
        localStorage.removeItem(`${STORAGE_CONSENT_KEY}_timestamp`);
      } catch {
        // ignore
      }
    }
  }
}

export const policyVersionService = new PolicyVersionService();
