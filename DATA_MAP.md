# SpeakUp Stars — Data Map & Retention Governance

**Document Version:** 2026.1  
**Effective Date:** October 20, 2026  
**Applicable Regulations:** FTC Children's Online Privacy Protection Act (COPPA Rule 16 CFR Part 312), EU/UK General Data Protection Regulation (GDPR-K / Article 5, 6, 8, 17), California Age-Appropriate Design Code Act (AB 2273).

---

## 1. Executive Summary & Core Principles

SpeakUp Stars strictly enforces **radical data minimization**, **ephemeral-first processing**, and **absolute parental data sovereignty**. No child can create an account, purchase products, or transmit unscrubbed biometric or personal data. 

```
                                      DATA FLOW ARCHITECTURE
                                      ======================

  [Child's Voice / Video]  ──► [Device RAM Only (0s)] ──► [Instant Frame/Audio Discard]
                                         │
                         (On-Device Scoring & Scrubber)
                                         ▼
                             [Scrubbed Transcript & Metrics]
                                         │
             ┌───────────────────────────┴───────────────────────────┐
             ▼                                                       ▼
  [Zero-Retention AI Coach]                               [Encrypted Database (RLS)]
   - Anthropic/OpenAI API                                  - Supabase PostgreSQL
   - Scrubbed text only                                    - Isolated per family
   - 0s vendor retention                                   - Automated deletion jobs
```

### Core Architecture Guarantees
1. **Zero Ad Trackers / Zero Third-Party Pixels:** No advertising SDKs, marketing beacons, or cross-app tracking cookies are installed or permitted in the application.
2. **On-Device Ephemeral Processing:** Camera video frames and live audio volume analysis occur exclusively in temporary device RAM and are purged instantly upon analysis completion (~2 fps discard).
3. **Strict Separation of Child and Parent Data:** Children are identified only by a parent-chosen nickname (e.g. "Leo") and an age band (e.g. "6-8"). Children never provide emails, phone numbers, or passwords.
4. **Automated Deletion by Default:** Every record type has a hard-coded expiration threshold managed by the central retention engine.

---

## 2. Comprehensive Data Inventory & Mapping Table

| Data Element | Why We Collect It (Purpose) | Where It Is Stored & Encryption | Who Can Access It | Vendors / Subprocessors Involved | Retention Period | Deletion Mechanism |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Child Nickname** | To personalize the child's interface and friendly mascot greetings (e.g., "Welcome back, Leo!"). | Supabase PostgreSQL (`children` table). Encrypted at rest (AES-256). Cached in LocalStorage for offline practice. | Authenticated Parent only (via bcrypt PIN). Strictly isolated via Row-Level Security (RLS). | Supabase (Database infrastructure). | Kept until parent edits/deletes child profile, or account reaches 24-month inactivity purge. | Instant 1-click deletion via Parent Dashboard (`Delete All Child Data` or `Delete Account`). |
| **2. Age Band** | To filter age-appropriate speaking topics (120 prompts across '3-5', '6-8', '9-12') and calibrate pacing/duration goals. | Supabase PostgreSQL (`children` table). Encrypted at rest (AES-256). | Authenticated Parent only (via PIN). Evaluated by local topic filtering engine. | Supabase (Database infrastructure). | Kept until parent edits age band or deletes account. | Instant 1-click deletion via Parent Dashboard. |
| **3. Session Metrics** | To calculate speaking growth trends (Words Per Minute, filler count, pauses, volume steadiness, eye contact ratio, Brave Voice 0-100 score). | Supabase PostgreSQL (`speaking_sessions` table). Encrypted at rest (AES-256). | Authenticated Parent only. Mascot feedback component in child view. | Supabase (Database infrastructure). | Retained for child learning progress history until parent deletes session or account reaches 24-month inactivity. | 1-click deletion per session, per child, or whole account via Parent Dashboard. |
| **4. Scrubbed Transcript** | To generate kind, encouraging AI feedback cards ("3 Things You Did Great", "1-2 Things to Try Next Time"). | Supabase PostgreSQL (`speaking_sessions` table). Encrypted at rest (AES-256). | Authenticated Parent and local client view. Scrubbed text sent ephemerally to LLM. | **Anthropic / OpenAI**: Processed under Zero Data Retention (ZDR) agreement. Never stored or used to train models. | **12 Months default** (Parent-adjustable to 3, 6, 12, or 24 months in settings). | Automated cron purge job (`purgeExpiredTranscriptsJob`) replaces text with `[PURGED]` placeholder. |
| **5. Badges, Star Points & Streaks** | To gamify progress, reward brave effort, and unlock mascot outfits/colors in the Reward Shop (no real money). | Supabase PostgreSQL (`rewards` table). Encrypted at rest (AES-256). LocalStorage cache. | Authenticated Parent and Child in active session. | Supabase (Database infrastructure). | Retained while family account remains active. | Wiped instantly upon child profile or account deletion. |
| **6. Optional Recordings (Audio Blobs)** | Optional parent feature to listen back to their child's practice speeches. **Defaults strictly to OFF.** | Ephemeral device RAM by default (0s). If parent opts in: Encrypted Cloud Storage bucket with 15-minute signed URLs. | Authenticated Parent only via secure signed URLs. Blocked from child public sharing. | Supabase Storage (Encrypted S3-compatible backend). | **30 Days Maximum** (Auto-purged). Defaults to 0 seconds if opt-in is absent. | Automated daily cron job (`purgeExpiredRecordingsJob`) physically deletes binary files. |
| **7. Parental Consent Records** | To legally document Verified Parental Consent (VPC), policy version agreement, and recording preferences under COPPA § 312.5. | Supabase PostgreSQL (`parent_consent_records` table). Encrypted at rest. | Parent and Internal Security / Compliance Auditor. | Supabase (Database infrastructure). | Retained for 5 years after account closure to demonstrate legal compliance to regulatory bodies (FTC/EDPB). | Legal compliance archive (contains zero child speech or audio). |
| **8. Security & Audit Logs** | To maintain tamper-proof audit trails of admin actions, login attempts, data exports, and deletions. Strictly NO child transcripts. | Supabase PostgreSQL (`admin_audit_logs` table). Anonymized IP/User-Agent hashes. | System administrators and compliance officers. | Supabase (Database infrastructure). | **30 Days** (Auto-purged rolling window). | Automated cron job (`purgeExpiredAuditLogsJob`) permanently deletes log entries older than 30 days. |

---

## 3. Deep-Dive Specification by Data Element

### 3.1 Child Nickname & Age Band
- **Collection Mechanism:** Inputted by parent during onboarding or child profile creation.
- **Validation Guard:** Validated against `ChildProfileSchema` (Zod). Rejects full names, email addresses, phone numbers, and strings longer than 30 characters.
- **Storage:** Persisted in PostgreSQL table `children` with Foreign Key to `parent_accounts(id)`.
- **Cross-Family Isolation:** RLS policy `USING (parent_id = auth.uid())` prevents cross-tenant access.

### 3.2 Session Metrics (Speaking Performance Data)
- **Signal Extraction:** Numeric ratios computed in client browser:
  - *Volume Steadiness:* Normalized RMS amplitude variance (0.0 to 1.0).
  - *Eye Contact Ratio:* Proportion of session frames where face gaze was front-facing (0.0 to 1.0).
  - *Smile Ratio:* Proportion of frames detecting positive facial smile markers (0.0 to 1.0).
  - *Pacing (WPM):* Estimated words spoken divided by active duration.
  - *Brave Voice Score:* Composite 0–100 integer mapped to non-punitive growth levels: Seedling (0-39), Sprout (40-59), Flower (60-74), Tree (75-89), Star (90-100).
- **Prohibited Attributes:** Pitch-based gender estimation, emotional profiling, diagnostic speech pathology classifications, or stress scoring.

### 3.3 Scrubbed Transcripts & PII Scrubber Pipeline
- **Pipeline Order:**
  1. Web Speech API emits raw transcript string into local device memory.
  2. `piiScrubber.scrub()` replaces all detected full names, street addresses, schools, cities, phone numbers, and ages with semantic tokens (`[NAME]`, `[LOCATION]`, `[SCHOOL]`).
  3. Harm & distress filter checks for safety triggers (alerts parent quietly if distress is detected; halts standard analysis).
  4. Only scrubbed transcript is forwarded to backend API for LLM feedback generation.
- **Vendor Agreement:** Subprocessor contract specifies Zero Data Retention (ZDR). Vendor must not retain prompts or completions past the HTTP response window and must not train on payload data.

### 3.4 Optional Audio/Video Recordings
- **Default State:** Off. Zero audio or video bytes are persisted to disk or cloud storage unless parent toggles `storeRecordingsOptIn: true`.
- **Consent Gate:** Verified Parental Consent must be on file (`consentStoreRecordings === true` and `withdrawnAt === null`).
- **Storage Security:** Stored with random non-guessable GUIDs in an encrypted cloud bucket. Direct public access is disabled; media is streamed solely via HMAC-signed URLs with a 15-minute TTL.

### 3.5 Parental Consent & Verification Records
- **Data Captured:** Parent ID, policy version (`2026.1`), verification method (e.g. credit card verification, email + PIN verification), verification reference ID, consent flags, and timestamp.
- **Legal Justification:** Required by FTC COPPA Rule § 312.5(a)(1) to prove affirmative parental consent.

### 3.6 Security & Access Audit Logs
- **Strict Content Ban:** `assertNoChildContentInAudit()` programmatically rejects any audit entry containing transcripts, speech audio, or biometric metrics.
- **Logged Events:** Login, logout, export data (JSON/CSV), delete session, delete child profile, delete account, PIN verification success/failure.
- **IP Anonymization:** Raw IPv4/IPv6 addresses and User-Agents are cryptographically hashed (`hashString()`) before storage.

---

## 4. Centralized Retention Engine (`retentionConfig.ts`)

All retention rules and thresholds across SpeakUp Stars are defined in a single source of truth:

```typescript
// Centralized Retention Thresholds
export const RETENTION_CONFIG = {
  RECORDINGS_OPT_IN_DAYS: 30,           // Maximum lifetime of opted-in audio recordings
  RECORDINGS_DEFAULT_DAYS: 0,           // Non-consented recordings are discarded immediately (0s)
  TRANSCRIPTS_DEFAULT_MONTHS: 12,       // Default retention for scrubbed transcripts
  TRANSCRIPTS_ALLOWED_MONTHS: [3, 6, 12, 24], // Parent-configurable options
  INACTIVE_ACCOUNTS_NOTICE_MONTHS: 23,  // Pre-deletion warning email dispatch
  INACTIVE_ACCOUNTS_PURGE_MONTHS: 24,   // Permanent irreversible deletion of dormant accounts
  LOGS_RETENTION_DAYS: 30,              // Security and admin audit logs lifetime
  SIGNED_URL_TTL_MINUTES: 15,           // Short-lived temporary media access token
};
```

---

## 5. Automated Deletion Jobs Specification

The data retention engine (`dataRetentionService.ts`) runs scheduled background purge routines:

### Job 1: `purgeExpiredRecordingsJob()`
- **Frequency:** Daily at 02:00 UTC.
- **Target:** All stored recordings where `now() >= expiresAt` (or `createdAt + 30 days`).
- **Action:**
  1. Deletes raw media blob from cloud storage.
  2. Updates session metadata (`recordingStored = false`, `recordingId = null`).
  3. Records audit entry without child content.

### Job 2: `purgeExpiredTranscriptsJob()`
- **Frequency:** Daily at 03:00 UTC.
- **Target:** Sessions where `createdAt + transcriptRetentionMonths < now()`.
- **Action:** Replaces `scrubbedTranscript` with `[EXPIRED_AND_PURGED_UNDER_DATA_RETENTION_POLICY]`. Aggregate numeric scores remain intact so child milestones are not lost.

### Job 3: `purgeInactiveAccountsJob()`
- **Frequency:** Weekly.
- **Target:**
  - *23 Months Inactive:* Dispatches pre-deletion warning email to parent: *"Your SpeakUp Stars account has been inactive for 23 months. In compliance with children's privacy regulations, all child data will be permanently purged in 30 days unless you sign in."*
  - *24 Months Inactive:* Executes permanent cascading deletion: purges parent account, child profiles, sessions, transcripts, recordings, badges, and active settings.

### Job 4: `purgeExpiredAuditLogsJob()`
- **Frequency:** Daily at 04:00 UTC.
- **Target:** Audit log records where `createdAt + 30 days < now()`.
- **Action:** Hard-deletes expired log entries from `admin_audit_logs`.

---

## 6. Parent Data Rights & Self-Serve Controls

Under COPPA § 312.6, GDPR-K Article 17, and CCPA/CPRA, parents may exercise the following rights at any time inside the **Parent Dashboard** behind their secure PIN:

1. **Right to Inspect ("See All Data We Have"):** Readable list displaying every profile, speaking session, numeric metric, badge, and transcript.
2. **Right to Export ("Download My Child's Data"):** Instant 1-click download of all stored child records in structured machine-readable JSON and spreadsheet CSV formats.
3. **Right to Erasure ("Delete Data"):**
   - *Delete One Session:* Purges single speech, audio, and transcript.
   - *Delete All Child Data:* Wipes all child speaking history, points, and transcripts.
   - *Delete Entire Account:* Purges parent credentials, children, recordings, and configurations permanently across all database partitions and backups within 24 hours.
4. **Right to Withdraw Consent:** Real-time toggles to revoke recording storage, face analysis, or email summaries without penalty.

---

## 7. Compliance Verification & Audit Trail

| Verification Standard | Automated Test Suite | Frequency | Status |
| :--- | :--- | :--- | :--- |
| Zero Ad SDKs / Trackers | `scripts/check-privacy.js` | Every CI Build | **PASSED (0 Trackers)** |
| RLS Multi-Table Cross-Family Isolation | `tests/cross-family-rls.test.ts` | Every CI Build | **PASSED (6/6 Tests)** |
| Recording 30-Day Purge & Opt-In Gate | `tests/recording-lifecycle.test.ts` | Every CI Build | **PASSED (7/7 Tests)** |
| PII Scrubber & Redaction Efficacy | `tests/pii-scrubber.test.ts` | Every CI Build | **PASSED (7/7 Tests)** |
| Retention Engine & Deletion Jobs | `tests/retention-jobs.test.ts` | Every CI Build | **VERIFIED** |

---

**Data Protection Officer (DPO) Contact:** `privacy@speakupstars.com`  
**Security Operations Center:** `security@speakupstars.com`  
**Physical Address:** SpeakUp Stars Digital Learning Inc., Attn: Child Privacy & DPO, 500 Sparky Way, Suite 100, San Francisco, CA 94107, USA
