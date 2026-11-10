/**
 * CENTRALIZED DATA RETENTION CONFIGURATION
 * 
 * Single source of truth for all data retention periods across SpeakUp Stars.
 * Enforces compliance with FTC COPPA Rule § 312, GDPR-K Article 5(1)(e),
 * and California Age-Appropriate Design Code Act.
 */

export const RETENTION_CONFIG = {
  /**
   * AUDIO/VIDEO RECORDINGS:
   * Defaults strictly to 0 days (ephemeral in device RAM).
   * If an authenticated parent explicitly opts in, stored for a maximum of 30 days.
   */
  RECORDINGS_DEFAULT_DAYS: 0,
  RECORDINGS_OPT_IN_DAYS: 30,
  RECORDINGS_ALLOWED_DAYS: [7, 14, 30, 60] as const,

  /**
   * SCRUBBED TRANSCRIPTS:
   * Retained for 12 months by default to display progress trends.
   * Fully parent-adjustable in Parent Dashboard settings.
   */
  TRANSCRIPTS_DEFAULT_MONTHS: 12,
  TRANSCRIPTS_ALLOWED_MONTHS: [3, 6, 12, 24] as const,

  /**
   * INACTIVE ACCOUNTS:
   * After 23 months of total dormancy, a pre-deletion notification is emailed to the parent.
   * If still inactive at 24 months, the account and all child records are permanently purged.
   */
  INACTIVE_ACCOUNTS_WARNING_MONTHS: 23,
  INACTIVE_ACCOUNTS_PURGE_MONTHS: 24,

  /**
   * SECURITY & ADMIN AUDIT LOGS:
   * Kept for 30 days in a rolling window.
   * Strictly prohibited from storing child speech transcripts or audio blobs.
   */
  LOGS_RETENTION_DAYS: 30,

  /**
   * TEMPORARY ACCESS SIGNED URLS:
   * Expiration time for signed download/playback URLs for opted-in recordings.
   */
  SIGNED_URL_TTL_MINUTES: 15,
} as const;

export type TranscriptRetentionOption = typeof RETENTION_CONFIG.TRANSCRIPTS_ALLOWED_MONTHS[number];
export type RecordingRetentionOption = typeof RETENTION_CONFIG.RECORDINGS_ALLOWED_DAYS[number];

/**
 * Calculates cutoff date by subtracting days from the target date.
 */
export function getDaysCutoff(days: number, fromDate: Date = new Date()): Date {
  return new Date(fromDate.getTime() - days * 24 * 60 * 60 * 1000);
}

/**
 * Calculates cutoff date by subtracting months from the target date.
 */
export function getMonthsCutoff(months: number, fromDate: Date = new Date()): Date {
  const d = new Date(fromDate.getTime());
  d.setMonth(d.getMonth() - months);
  return d;
}

/**
 * Validates whether a candidate transcript retention option is allowed.
 */
export function isValidTranscriptRetention(months: number): months is TranscriptRetentionOption {
  return (RETENTION_CONFIG.TRANSCRIPTS_ALLOWED_MONTHS as readonly number[]).includes(months);
}

/**
 * Validates whether a candidate recording retention option is allowed.
 */
export function isValidRecordingRetention(days: number): days is RecordingRetentionOption {
  return (RETENTION_CONFIG.RECORDINGS_ALLOWED_DAYS as readonly number[]).includes(days);
}
