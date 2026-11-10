# SPEAKUP STARS: EXHAUSTIVE SYSTEM SPECIFICATION & ARCHITECTURAL REPORT

**Document Version:** 2026.2 (Post-Backend Integration)  
**Publication Date:** October 22, 2026  
**Auditor / Engineering Lead:** AI Systems Architecture & Child Privacy Engineering  
**Application Title:** SpeakUp Stars (`speakup-stars`)  
**Repository Working Directory:** `D:\SpeakUp Stars`  
**Current Health:** 18 Test Suites (158 Tests) Passing | 0 Build Warnings | 0 Trackers | Production Build Verified  

---

## TABLE OF CONTENTS
1. [EXECUTIVE ARCHITECTURE & TOPOLOGY](#1-executive-architecture--topology)
2. [DATABASE & BACKEND SPECIFICATION](#2-database--backend-specification)
   - 2.1 Complete Relational Schema (All 12 Tables)
   - 2.2 Migrations Inventory & Version History
   - 2.3 Stored Procedures & Retention Purge Routines
   - 2.4 Row-Level Security (RLS) Policies
   - 2.5 Supabase Edge Functions Suite
   - 2.6 Environment Configuration (Client vs. Server)
3. [MACHINE LEARNING & AI PIPELINE SPECIFICATION](#3-machine-learning--ai-pipeline-specification)
   - 3.1 Speech-to-Text (STT) Architecture
   - 3.2 Real-Time Vocal Energy & VAD Engine (Web Audio)
   - 3.3 Computer Vision & Positive Expression Estimator
   - 3.4 Speech Scoring Engine & Age-Normed Formulas
   - 3.5 AI Coaching Pipeline (Anthropic Claude ZDR Edge Proxy)
   - 3.6 Input Harm & Distress Interception Filter
   - 3.7 Output Safety Regex Guardrails & Curated Fallbacks
   - 3.8 Multilingual PII Scrubber Benchmark (5 Languages)
4. [FRONTEND & UI/UX SPECIFICATION](#4-frontend--uiux-specification)
   - 4.1 Route Catalog & Guard Policies
   - 4.2 Component Hierarchy & Inventory
   - 4.3 Design System, Color Tokens & Typography
   - 4.4 Responsive Layout Architecture (360px, 768px, 1024px, 1440px)
   - 4.5 Accessibility, i18n & PWA Offline Engine
5. [COMPREHENSIVE FEATURE MATRIX](#5-comprehensive-feature-matrix)
   - 5.1 Onboarding & Verifiable Parental Consent
   - 5.2 Curated Topic Library & Wheel of the Day
   - 5.3 Speech Prep Stage & Calming Warm-Ups
   - 5.4 Live Recording Stage & Ephemeral Memory Management
   - 5.5 Results Screen & Brave Voice Meter
   - 5.6 Mini-Games Hub & 3D Volume Volcano
   - 5.7 Reward Shop, Badges & Mascot Dressing Room
   - 5.8 Parent Dashboard & Data Rights Hub
6. [CHILD PRIVACY, SAFETY & REGULATORY COMPLIANCE](#6-child-privacy-safety--regulatory-compliance)
   - 6.1 COPPA Compliance (FTC 16 CFR Part 312)
   - 6.2 GDPR-K & UK Age-Appropriate Design Code (15 Standards)
   - 6.3 Apple App Store & Google Play Families Policies
   - 6.4 Data Map & Centralized Retention Engine
   - 6.5 Third-Party Vendor Matrix
7. [VERIFICATION, TESTING & METRICS](#7-verification-testing--metrics)
   - 7.1 Test Suites Catalog (18 Files, 158 Tests)
   - 7.2 Build Metrics & Production Bundle Breakdown

---

## 1. EXECUTIVE ARCHITECTURE & TOPOLOGY

SpeakUp Stars is built as a zero-trust, privacy-first, on-device gamified speech coaching platform for children ages 3–12. The application enforces a strict separation between parent identity (the verified account holder) and child practice data (ephemeral, scrubbed, non-identifiable).

```
                                      APPLICATION TOPOLOGY
                                      ====================

   [Child User View]                                        [Parent User View]
          │                                                         │
  (Local Client Hardware)                                   (Adult PIN Gate: 4-6 Digits)
          ▼                                                         ▼
   ┌────────────────────────────────────────────────────────┐  ┌───────────────────────────────────┐
   │ React 19 Single Page App & PWA (Vite 6)                │  │ Parent Dashboard & Privacy Hub    │
   │ ├─ Web Speech API (Local STT)                          │  │ ├─ Inspect All Data (Transcripts) │
   │ ├─ Web Audio API (RMS Volume Volcano Tracker)          │  │ ├─ 1-Click JSON & CSV Data Export │
   │ ├─ 2D Canvas Luma Face & Smile Heuristic               │  │ ├─ Immediate Deletion Workflows   │
   │ ├─ Multilingual PII Scrubber (5 Languages)             │  │ └─ Retention Settings & Toggles   │
   │ └─ 3D WebGL Volcano Scene (Three.js / R3F)             │  └─────────────────┬─────────────────┘
   └───────────────────────────┬────────────────────────────┘                    │
                               │ Scrubbed Text + Metrics Only                    │ Signed HMAC Token / JWT
                               ▼                                                 ▼
   ┌───────────────────────────────────────────────────────────────────────────────────────────────┐
   │ Supabase Backend Infrastructure                                                               │
   │ ├─ Edge Functions:                                                                            │
   │ │  ├─ /generate-feedback ──► Anthropic Claude API (Zero Data Retention / No Model Training)   │
   │ │  ├─ /verify-parental-consent ──► Issues & Validates 32-Byte Cryptographic Tokens (COPPA VPC)│
   │ │  ├─ /send-parent-email ──► Resend API (Transactional Notices Exclusively to Parents)        │
   │ │  └─ /run-retention-purge ──► Server-Side Daily Cron Purge Runner                            │
   │ ├─ PostgreSQL 15 Relational Database:                                                         │
   │ │  ├─ 12 Tables with Row-Level Security (RLS: auth.uid() = parent_id)                         │
   │ │  └─ Stored Procedures: purge_expired_recordings(), purge_expired_transcripts()              │
   │ └─ Private Object Storage (Encrypted S3 bucket, 15-minute expiring signed URLs)               │
   └───────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. DATABASE & BACKEND SPECIFICATION

### 2.1 Complete Relational Schema (All 12 Tables)

#### Table 1: `public.parents` (The Primary Account Holder)
*Purpose:* Holds verified adult account identity. Children cannot create or hold accounts.
- `id` (UUID, Primary Key, references `auth.users(id)` ON DELETE CASCADE)
- `email` (TEXT, NOT NULL, UNIQUE)
- `email_verified` (BOOLEAN, NOT NULL, DEFAULT FALSE)
- `hashed_pin` (TEXT, NOT NULL) — Salted bcrypt hash of 4-6 digit parent PIN
- `pin_failed_attempts` (INTEGER, NOT NULL, DEFAULT 0)
- `pin_locked_until` (TIMESTAMPTZ, NULL) — Timestamp when 15-minute lockout expires
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())
*Indexes:* `idx_parents_activity` on `(updated_at)`

#### Table 2: `public.children` (Strict Data Minimization)
*Purpose:* Stores child profile. Collects ONLY nickname and age band. Rejects PII via Zod schema.
- `id` (UUID, Primary Key, DEFAULT gen_random_uuid())
- `parent_id` (UUID, NOT NULL, references `parents(id)` ON DELETE CASCADE)
- `nickname` (TEXT, NOT NULL) — e.g. "Leo", "StarExplorer"
- `age_band` (TEXT, NOT NULL, CHECK in `'3-5'`, `'6-8'`, `'9-12'`)
- `avatar_id` (TEXT, NOT NULL, DEFAULT 'lion')
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())
*Indexes:* `idx_children_parent` on `(parent_id)`

#### Table 3: `public.sessions` (Speaking Practice Activity)
*Purpose:* Records practice sessions and links to scrubbed transcripts and optional audio.
- `id` (UUID, Primary Key, DEFAULT gen_random_uuid())
- `parent_id` (UUID, NOT NULL, references `parents(id)` ON DELETE CASCADE)
- `child_id` (UUID, NOT NULL, references `children(id)` ON DELETE CASCADE)
- `topic` (TEXT, NOT NULL) — Holds prompt title or scrubbed transcript text
- `duration_seconds` (INTEGER, NOT NULL, DEFAULT 0)
- `recording_stored` (BOOLEAN, NOT NULL, DEFAULT FALSE)
- `recording_url` (TEXT, NULL) — NULL unless explicitly consented by parent
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())
*Indexes:* `idx_sessions_parent_child` on `(parent_id, child_id)`, `idx_sessions_retention` on `(created_at, recording_stored)`

#### Table 4: `public.metrics` (Numeric Speech Performance Ratios)
*Purpose:* Stores calculated mathematical speech scores. Contains zero audio waveforms or biometric signals.
- `id` (UUID, Primary Key, DEFAULT gen_random_uuid())
- `parent_id` (UUID, NOT NULL, references `parents(id)` ON DELETE CASCADE)
- `session_id` (UUID, NOT NULL, references `sessions(id)` ON DELETE CASCADE)
- `child_id` (UUID, NOT NULL, references `children(id)` ON DELETE CASCADE)
- `clarity_score` (NUMERIC(5,2), NOT NULL)
- `pacing_score` (NUMERIC(5,2), NOT NULL)
- `courage_score` (NUMERIC(5,2), NOT NULL)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())
*Indexes:* `idx_metrics_parent_session` on `(parent_id, session_id)`

#### Table 5: `public.badges` (Earned Accomplishments)
*Purpose:* Stores unlocked milestones (e.g. `first_speech`, `brave_voice`, `story_teller`).
- `id` (UUID, Primary Key, DEFAULT gen_random_uuid())
- `parent_id` (UUID, NOT NULL, references `parents(id)` ON DELETE CASCADE)
- `child_id` (UUID, NOT NULL, references `children(id)` ON DELETE CASCADE)
- `badge_key` (TEXT, NOT NULL)
- `unlocked_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())
- `UNIQUE(child_id, badge_key)`
*Indexes:* `idx_badges_parent_child` on `(parent_id, child_id)`

#### Table 6: `public.points` (Star Points Ledger)
*Purpose:* Non-monetary in-app currency earned through brave practice. Zero real-money microtransactions.
- `id` (UUID, Primary Key, DEFAULT gen_random_uuid())
- `parent_id` (UUID, NOT NULL, references `parents(id)` ON DELETE CASCADE)
- `child_id` (UUID, NOT NULL, references `children(id)` ON DELETE CASCADE)
- `stars_earned` (INTEGER, NOT NULL, DEFAULT 0)
- `reason` (TEXT, NOT NULL) — e.g. `finish_recording`, `wheel_spin`
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())
*Indexes:* `idx_points_parent_child` on `(parent_id, child_id)`

#### Table 7: `public.settings` (Family Preferences & Consent Toggles)
*Purpose:* Controls parental configurations. All sensitive cloud toggles default strictly to FALSE.
- `id` (UUID, Primary Key, DEFAULT gen_random_uuid())
- `parent_id` (UUID, NOT NULL, UNIQUE, references `parents(id)` ON DELETE CASCADE)
- `store_recordings_opt_in` (BOOLEAN, NOT NULL, DEFAULT FALSE) — Strictly OFF by default
- `weekly_email_opt_in` (BOOLEAN, NOT NULL, DEFAULT FALSE) — Strictly OFF by default
- `sound_effects_enabled` (BOOLEAN, NOT NULL, DEFAULT TRUE)
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())

#### Table 8: `public.consent_records` (Legal Verifiable Parental Consent Archive)
*Purpose:* Documents compliance with FTC COPPA Rule § 312.5 and GDPR-K Article 8.
- `id` (UUID, Primary Key, DEFAULT gen_random_uuid())
- `parent_id` (UUID, NOT NULL, references `parents(id)` ON DELETE CASCADE)
- `policy_version` (TEXT, NOT NULL) — e.g. `2026.1`
- `consent_metrics_processing` (BOOLEAN, NOT NULL)
- `consent_store_recordings` (BOOLEAN, NOT NULL, DEFAULT FALSE)
- `consent_email_summaries` (BOOLEAN, NOT NULL, DEFAULT FALSE)
- `verification_method` (TEXT, NOT NULL) — e.g. `signed_email_token`, `credit_card`
- `verification_reference` (TEXT) — e.g. `VPC-CONFIRMED-...`
- `withdrawn_at` (TIMESTAMPTZ, NULL)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())
*Indexes:* `idx_consent_parent` on `(parent_id)`

#### Table 9: `public.streaks` (Daily Practice & Anti-Anxiety Streak Freeze)
*Purpose:* Manages consecutive practice streaks with guilt-free Streak Freeze protection.
- `id` (UUID, Primary Key, DEFAULT gen_random_uuid())
- `parent_id` (UUID, NOT NULL, references `parents(id)` ON DELETE CASCADE)
- `child_id` (UUID, NOT NULL, UNIQUE, references `children(id)` ON DELETE CASCADE)
- `current_streak` (INTEGER, NOT NULL, DEFAULT 0)
- `last_practice_date` (DATE)
- `streak_freezes_available` (INTEGER, NOT NULL, DEFAULT 1)
- `freeze_used_dates` (DATE[], NOT NULL, DEFAULT '{}')
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())
*Indexes:* `idx_streaks_parent_child` on `(parent_id, child_id)`

#### Table 10: `public.shop_purchases` (Mascot Reward Customizations)
*Purpose:* Records equipped hats, outfits, color themes, and backgrounds unlocked with star points.
- `id` (UUID, Primary Key, DEFAULT gen_random_uuid())
- `parent_id` (UUID, NOT NULL, references `parents(id)` ON DELETE CASCADE)
- `child_id` (UUID, NOT NULL, references `children(id)` ON DELETE CASCADE)
- `item_id` (TEXT, NOT NULL)
- `item_type` (TEXT, NOT NULL, CHECK in `'hat'`, `'outfit'`, `'theme'`, `'background'`)
- `is_equipped` (BOOLEAN, NOT NULL, DEFAULT FALSE)
- `purchased_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())
- `UNIQUE(child_id, item_id)`
*Indexes:* `idx_shop_purchases_parent_child` on `(parent_id, child_id)`

#### Table 11: `public.admin_audit_logs` (Tamper-Proof Audit Trail)
*Purpose:* Logs administrative actions with STRICT EXCLUSION of child speech transcripts or audio.
- `id` (UUID, Primary Key, DEFAULT gen_random_uuid())
- `parent_id` (UUID, references `parents(id)` ON DELETE SET NULL)
- `actor_id` (TEXT, NOT NULL)
- `actor_role` (TEXT, NOT NULL, CHECK in `'parent'`, `'system'`, `'admin'`, `'auditor'`)
- `action` (TEXT, NOT NULL, CHECK in `'login'`, `'logout'`, `'view_sessions'`, `'view_metrics'`, `'export_data_json'`, `'export_data_csv'`, `'delete_session'`, `'delete_child_data'`, `'delete_account'`, `'update_consent'`, `'security_alert_review'`, `'pin_verify_success'`, `'pin_verify_failed'`)
- `target_resource_id` (TEXT)
- `target_resource_type` (TEXT, NOT NULL, CHECK in `'session'`, `'child_profile'`, `'consent_record'`, `'parent_account'`, `'settings'`, `'recording_media'`)
- `ip_address_hash` (TEXT) — Cryptographically hashed IP address
- `user_agent_hash` (TEXT)
- `success` (BOOLEAN, NOT NULL, DEFAULT TRUE)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())
*Indexes:* `idx_audit_logs_parent` on `(parent_id)`, `idx_audit_logs_retention` on `(created_at)`

#### Table 12: `public.parent_verification_tokens` (Cryptographic Auth & VPC)
*Purpose:* Manages single-use HMAC-SHA256 tokens for email verification, VPC consent, and PIN resets.
- `id` (UUID, Primary Key, DEFAULT gen_random_uuid())
- `parent_id` (UUID, NOT NULL, references `parents(id)` ON DELETE CASCADE)
- `token_hash` (TEXT, NOT NULL) — SHA-256 digest of raw random token
- `token_type` (TEXT, NOT NULL, CHECK in `'vpc_consent'`, `'pin_reset'`, `'email_verify'`)
- `verification_metadata` (JSONB, DEFAULT '{}')
- `expires_at` (TIMESTAMPTZ, NOT NULL) — 24-hour expiration window
- `used_at` (TIMESTAMPTZ, NULL) — Prevents replay attacks
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())
*Indexes:* `idx_verification_tokens_parent` on `(parent_id)`, `idx_verification_tokens_lookup` on `(token_hash, expires_at)`

---

### 2.2 Migrations Inventory & Version History

| Migration File | Description & Scope |
| :--- | :--- |
| [`20261018000000_schema.sql`](file:///d:/SpeakUp%20Stars/supabase/migrations/20261018000000_schema.sql) | Baseline schema: Tables `parents`, `children`, `sessions`, `metrics`, `badges`, `points`, `settings`, `consent_records`. Enables RLS on all tables with `auth.uid() = parent_id` isolation. |
| [`20261018010000_rewards_and_streaks.sql`](file:///d:/SpeakUp%20Stars/supabase/migrations/20261018010000_rewards_and_streaks.sql) | Gamification schema: Tables `streaks` and `shop_purchases`. Adds compound unique constraints and RLS policies. |
| [`20261018020000_security_and_audit.sql`](file:///d:/SpeakUp%20Stars/supabase/migrations/20261018020000_security_and_audit.sql) | Security hardening: Creates `admin_audit_logs`, append-only RLS, and an automated PL/pgSQL loop verifying RLS on every table. |
| [`20261022000000_retention_and_verification.sql`](file:///d:/SpeakUp%20Stars/supabase/migrations/20261022000000_retention_and_verification.sql) | Retention & Verification: Creates `parent_verification_tokens` table and 5 server-side stored procedures for automatic data retention purges. |

---

### 2.3 Stored Procedures & Retention Purge Routines

1. **`public.purge_expired_recordings()`**:
   - *Target:* Stored recordings where `created_at < now() - INTERVAL '30 days'` and `recording_stored = TRUE`.
   - *Action:* Discards recording binary references (`recording_stored = FALSE`, `recording_url = NULL`). Logs audit record.
2. **`public.purge_expired_transcripts()`**:
   - *Target:* Sessions older than 12 months (or parent-configured threshold).
   - *Action:* Overwrites `topic` text with `[EXPIRED_AND_PURGED_UNDER_DATA_RETENTION_POLICY]`. Preserves numeric metrics for child growth tracking.
3. **`public.purge_inactive_accounts()`**:
   - *Target:* Parent accounts where `updated_at < now() - INTERVAL '24 months'`.
   - *Action:* Cascades deletion across `parents`, `children`, `sessions`, `metrics`, `badges`, `streaks`, and `shop_purchases`.
4. **`public.purge_expired_audit_logs()`**:
   - *Target:* Audit log entries older than 30 days.
   - *Action:* Hard-deletes expired records from `admin_audit_logs`.
5. **`public.run_all_retention_purges()`**:
   - *Function:* Unified master transaction executing all 4 routines sequentially and returning a structured JSON report:
     `{ timestamp, recordings_purged, transcripts_purged, inactive_accounts_purged, logs_purged, total_purged }`.

---

### 2.4 Row-Level Security (RLS) Policies

All 12 tables in the `public` schema have Row-Level Security enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
- **Core Tenant Isolation Pattern:**
  ```sql
  CREATE POLICY "Parents can only view their own family data"
      ON public.<table_name> FOR SELECT
      USING (auth.uid() = parent_id);

  CREATE POLICY "Parents can insert/update their family data"
      ON public.<table_name> FOR ALL
      USING (auth.uid() = parent_id)
      WITH CHECK (auth.uid() = parent_id);
  ```
- **Audit Logs Append-Only Guard:**
  ```sql
  CREATE POLICY "Parents can only view their own audit logs"
      ON public.admin_audit_logs FOR SELECT
      USING (auth.uid() = parent_id);

  CREATE POLICY "System can record audit logs"
      ON public.admin_audit_logs FOR INSERT
      WITH CHECK (true);
  -- UPDATE and DELETE policies intentionally omitted: Audit records are immutable.
  ```

---

### 2.5 Supabase Edge Functions Suite

Located in `supabase/functions/`:

1. [**`generate-feedback`**](file:///d:/SpeakUp%20Stars/supabase/functions/generate-feedback/index.ts):
   - *Runtime:* Deno / TypeScript.
   - *Provider:* Anthropic Claude 3.5 Sonnet under Zero Data Retention contract.
   - *Guards:* Ingests ONLY PII-scrubbed transcripts and numeric metrics. Validates output through regex safety filters, rejecting appearance, accent, medical, and shaming remarks. Instant fallback to safe curated templates.
2. [**`verify-parental-consent`**](file:///d:/SpeakUp%20Stars/supabase/functions/verify-parental-consent/index.ts):
   - *Method:* Cryptographic Signed Email Verification Token (COPPA § 312.5(b)(2)).
   - *Guards:* Generates 32-byte cryptographic random tokens, hashes via SHA-256, enforces 24-hour expiration, and records timestamped legal consent upon verification.
3. [**`send-parent-email`**](file:///d:/SpeakUp%20Stars/supabase/functions/send-parent-email/index.ts):
   - *Provider:* Resend API.
   - *Guards:* Rejects any email sent to child accounts; blocks manipulative habit-forming wording (e.g. "streak will break").
4. [**`run-retention-purge`**](file:///d:/SpeakUp%20Stars/supabase/functions/run-retention-purge/index.ts):
   - *Function:* Server-authoritative daily cron runner invoking `public.run_all_retention_purges()` via Service Role, protected by `CRON_SECRET`.

---

### 2.6 Environment Configuration (Client vs. Server)

Defined in [`.env.example`](file:///d:/SpeakUp%20Stars/.env.example):
- **Client-Side (Exposed in Vite Browser Bundle):**
  - `VITE_SUPABASE_URL`: Supabase project endpoint.
  - `VITE_SUPABASE_ANON_KEY`: Supabase anonymous public key.
  - `VITE_PRIVACY_METRICS_ENDPOINT`: Optional self-hosted anonymous metrics ingest endpoint.
  - `VITE_PUBLIC_APP_URL`: Base application URL for verification redirects.
- **Server-Side Only (Edge Functions & Secret Manager):**
  - `SUPABASE_SERVICE_ROLE_KEY`: Admin key for retention purges.
  - `ANTHROPIC_API_KEY`: API key for Claude ZDR feedback.
  - `RESEND_API_KEY`: API key for transactional emails.
  - `CRON_SECRET`: Authorization secret for cron execution.

---

## 3. MACHINE LEARNING & AI PIPELINE SPECIFICATION

### 3.1 Speech-to-Text (STT) Architecture
- **Provider Interface:** `SpeechToTextProvider` in [`sttProvider.ts`](file:///d:/SpeakUp%20Stars/src/services/speech/sttProvider.ts).
- **Active Implementation:** `WebSpeechSTTProvider` utilizing native `window.SpeechRecognition` / `webkitSpeechRecognition`. Operates client-side in browser memory and generates timestamped word arrays with 0.92 confidence scores.
- **Local Whisper Module:** `WhisperSTTProvider` is structured to accept local `@xenova/transformers` ONNX weights (`Xenova/whisper-tiny.en`) for environments requiring complete offline local transcription.

### 3.2 Real-Time Vocal Energy & VAD Engine (Web Audio)
- **Engine:** `AudioVolumeTracker` in [`audioVolumeTracker.ts`](file:///d:/SpeakUp%20Stars/src/services/games/audioVolumeTracker.ts).
- **Signal Extraction:** Web Audio API `AnalyserNode` connected to microphone stream. Reads byte time-domain data (RMS amplitude) via `requestAnimationFrame`.
- **Smoothing:** Exponential Moving Average (EMA) smoothing:
  $$\text{Volume}_{t} = \alpha \cdot \text{Raw}_{t} + (1 - \alpha) \cdot \text{Volume}_{t-1} \quad (\alpha = 0.25)$$
- **State Classification:**
  - `silence`: Volume $< 0.12$
  - `gentle`: $0.12 \le \text{Volume} < 0.30$
  - `steady`: $0.30 \le \text{Volume} < 0.65$ (Target clear speaking zone)
  - `erupting`: $\text{Volume} \ge 0.65$ (Peak confident voice)
- **Hardware Cleanup:** `stop()` immediately cancels animation frame, disconnects nodes, closes `AudioContext`, and stops all microphone MediaStream tracks.

### 3.3 Computer Vision & Positive Expression Estimator
- **Engine:** `FaceAnalysisService` in [`faceAnalysisService.ts`](file:///d:/SpeakUp%20Stars/src/services/vision/faceAnalysisService.ts).
- **Sampling Frequency:** ~2 frames per second (500ms interval) to remain cool and battery-friendly on mobile devices.
- **Scratch Canvas:** Downscaled 160x120 temporary canvas. Pixel data is evaluated and **immediately cleared** via `ctx.clearRect(0, 0, 160, 120)` so no image frames linger in device RAM.
- **Signals Extracted (Positive-Only):**
  1. *Eye Contact Ratio:* Proportion of frames where face center is within $\pm 25\%$ of canvas center.
  2. *Head Steadiness:* Inverse of inter-frame bounding center variance.
  3. *Smile / Expression Energy:* Mouth corner horizontal/vertical delta relative to face width. Neutral faces are never penalized.
- **Performance Fallback:** If frame processing exceeds 250ms for 3 consecutive ticks, the service automatically halts to protect device responsiveness.

### 3.4 Speech Scoring Engine & Age-Normed Formulas
Implemented in [`speechAnalysisPipeline.ts`](file:///d:/SpeakUp%20Stars/src/services/speech/speechAnalysisPipeline.ts):

- **Words Per Minute (WPM):**
  $$\text{WPM} = \frac{\text{Word Count}}{\text{Duration in Minutes}}$$
  - Age 3–5: Target 40–80 WPM
  - Age 6–8: Target 65–110 WPM
  - Age 9–12: Target 85–140 WPM
- **Filler Word Detection:** Matches international filler expressions (`um`, `uh`, `er`, `like`, `you know`, `actually`, `basically`).
- **Composite Brave Voice Score (0–100):**
  $$\text{Brave Voice} = (\text{Clarity} \times 0.25) + (\text{Voice Steadiness} \times 0.25) + (\text{Eye Contact} \times 0.20) + (\text{Story} \times 0.15) + (\text{Energy} \times 0.15)$$
- **Anti-Anxiety Design Floors:**
  - Speaking effort guarantees a minimum baseline score of 50.
  - Zero red failure screens; mapped to growth tiers: **Seedling** (0–39), **Sprout** (40–59), **Flower** (60–74), **Tree** (75–89), **Star** (90–100).
  - *Gentle Mode:* If enabled, filler word count and pacing penalties are completely ignored.

### 3.5 AI Coaching Pipeline (Anthropic Claude ZDR Edge Proxy)
- **Pipeline:** [`aiFeedbackService.ts`](file:///d:/SpeakUp%20Stars/src/services/ai/aiFeedbackService.ts) connected to `generate-feedback` Edge Function.
- **Data Minimization:** Transmits ONLY PII-scrubbed transcripts and numeric metrics. Zero child names, audio blobs, or video frames.
- **Contractual Terms:** Zero Data Retention (ZDR) agreement. Prompts and completions are never stored on LLM servers or used to train general models.

### 3.6 Input Harm & Distress Interception Filter
- **Keywords Monitored:** Domestic abuse, physical violence, neglect, self-harm, and severe distress (e.g. `/(someone|he|she|mom|dad)\s+(hurts|beats|hits)\s+me/i`, `/(want|wish)\s+to\s+(die|kill myself)/i`).
- **Intervention Flow:** Halts standard evaluation; presents a loving reassurance card ("You are brave, kind, and you matter so much"); logs a quiet, confidential alert in `parentSafetyAlertService` for parent dashboard review.

### 3.7 Output Safety Regex Guardrails & Curated Fallbacks
- **Filtered Categories:** Appearance, physical body, clothing, foreign accents, dialects, speech pathology/medical diagnoses (`stutter`, `adhd`, `autism`), and shaming remarks (`bad`, `terrible`, `failed`).
- **Fallback Action:** Any output containing forbidden patterns is discarded and replaced with pre-written, kid-safe praise templates.

### 3.8 Multilingual PII Scrubber Benchmark (5 Languages)
Implemented in [`piiScrubber.ts`](file:///d:/SpeakUp%20Stars/src/services/security/piiScrubber.ts). Tested across 40 benchmark sentences in `tests/pii-scrubber.test.ts`:
- **English:** Redacts names (`[NAME]`), street addresses (`[ADDRESS]`), phone numbers (`[PHONE]`), emails (`[EMAIL]`), schools (`[SCHOOL]`).
- **Urdu:** Redacts Pakistani names (Ali, Fatima, Zainab), locations, and schools.
- **Arabic:** Redacts Middle Eastern names (Mohammed, Layla, Tariq) and locations.
- **Hindi:** Redacts Indian names (Aarav, Diya, Rohan), phones, and cities.
- **Spanish:** Redacts Hispanic names (Mateo, Sofia, Diego), streets (`Calle ...`), and schools.

---

## 4. FRONTEND & UI/UX SPECIFICATION

### 4.1 Route Catalog & Guard Policies

| Route Path | Component Name | Access Guard / Gate | Purpose |
| :--- | :--- | :--- | :--- |
| `/` | `HomePage` | Open (Child default) | Hero banner, daily speaking adventure, quick navigation. |
| `/wheel` | `WheelPage` | Open (Filtered by age) | Interactive topic wheel, Wheel of the Day bonus (+15 pts). |
| `/prep` | `PrepPage` | Open (Receives topic state) | 3 idea bubbles, 4 duration options, warm-up games. |
| `/record` | `RecordPage` | Hardware permission gate | Microphone & camera stream, live recording, volume meter. |
| `/results` | `ResultsPage` | Open (Receives session state) | Brave Voice meter, 3 things great, read-aloud TTS. |
| `/games` | `GamesHubPage` | Open | Mini-Games catalog grid. |
| `/games/volcano`| `VolumeVolcanoGamePage` | Microphone permission gate | 3D WebGL Volume Volcano game powered by Web Audio. |
| `/rewards` | `RewardsPage` | Open | Star points balance, daily streaks, Reward Shop, dressing room. |
| `/profile` | `ProfilePage` | Open | Child profile overview and avatar display. |
| `/parent` | `ParentDashboardPage` | Adult PIN Gate (`PinGateModal`) | Progress charts, category controls, 1-click export & delete. |
| `/privacy` | `ParentPrivacyPolicyPage` | Open | Plain-language privacy policy with vendor matrix. |
| `/kids-privacy` | `KidFriendlyPrivacyPage` | Open | Mascot-narrated privacy story with read-aloud button. |
| `/terms` | `TermsOfUsePage` | Open | Terms of use and essential storage declaration. |
| `*` | Catch-all redirect to `/` | Redirect | Graceful redirect for invalid URLs. |

### 4.2 Component Hierarchy & Inventory
- **Layout & Structure:** `AppLayout`, `Header`, `BottomNav` (mobile navigation), `Sidebar` (desktop navigation), `Footer`.
- **Common Atoms:** `Button` (primary, secondary, outline, danger with 56px touch targets), `Card` (bouncy shadow), `Modal` (accessible dialog with focus trap), `ProgressBar`, `PwaInstallPrompt`, `PinProtectedLink`.
- **Feature Molecules:** `SparkyMascot` (SVG mascot with dynamic emotion and outfit props), `SpinWheelCanvas` (interactive SVG topic wheel), `WarmUpModal` (calming breathing & tongue twisters), `AnalysisLoadingScreen` (rotating coaching tips), `BraveVoiceMeter` (Seedling-to-Star gauge), `SkillsRadarChart` (5-axis SVG radar), `RestYourVoiceModal` (gentle screen time rest modal), `PolicyReconsentModal`.
- **3D Graphics Components:** `VolcanoScene3D` (Three.js / React Three Fiber canvas, floating island ground, procedural volcano cone, magma particle system, crystal accents, ambient clouds).

### 4.3 Design System, Color Tokens & Typography
- **Core Kid-Safe Palette:**
  - `sunny` (`#FFD12E`): Primary cheerful yellow.
  - `sky` (`#38BDF8`): Encouraging bright blue.
  - `coral` (`#FF6B6B`): Warm action accent.
  - `mint` (`#3FD094`): Success and growth green.
  - `purple` (`#B388FF`): Magical achievement purple.
- **Typography:**
  - Headings: `Fredoka` (playful, rounded, approachable).
  - Body: `Nunito` (highly legible, friendly font).
  - Dyslexia-Friendly Mode: Globally swaps font family to `OpenDyslexic`.
- **Touch Ergonomics:** All actionable buttons and controls enforce a minimum touch target of **56px by 56px** (`min-h-[56px] min-w-[56px]`).

### 4.4 Responsive Layout Architecture
- **Phone (360px–390px):** Single-column layout. Desktop sidebar hides; sticky bottom navigation bar activates (`BottomNav.tsx`). Results screen replaces radar chart with simplified linear progress bars. Parent dashboard converts session table into card-based cards.
- **Tablet (768px–820px):** 2-column grid structures on Home, Wheel, and Games Hub.
- **Laptop / Desktop (1024px–1440px):** Collapsible desktop sidebar; 5-dimension SVG radar chart; full 6-column data table in Parent Dashboard.
- **Landscape Mobile:** Flexible vertical scaling on `RecordPage.tsx`, wrapping idea bubbles below camera view.

### 4.5 Accessibility, i18n & PWA Offline Engine
- **Accessibility Controls ([`AccessibilityContext.tsx`](file:///d:/SpeakUp%20Stars/src/context/AccessibilityContext.tsx)):**
  - Dyslexia-friendly font toggle.
  - High-contrast mode (thick dark borders, AAA text contrast).
  - Reduced-motion toggle (disables canvas spin animations and Framer Motion transitions).
  - Adjustable text scaling (Default, Large, Extra Large).
  - Sound effects toggle and calm mode.
- **Internationalization ([`I18nContext.tsx`](file:///d:/SpeakUp%20Stars/src/context/I18nContext.tsx)):**
  - 5 Languages: English (`en`), Urdu (`ur`), Arabic (`ar`), Hindi (`hi`), Spanish (`es`).
  - Automatic RTL (Right-to-Left) layout switching for Arabic and Urdu.
- **Progressive Web App (PWA):**
  - Configured via `vite-plugin-pwa` with Workbox Service Worker (`sw.js`).
  - Precaches application shell, manifest, and assets (1.99 MB). Works completely offline for topic wheel and warm-up exercises.

---

## 5. COMPREHENSIVE FEATURE MATRIX

### 5.1 Onboarding & Verifiable Parental Consent
- Multi-step parent wizard requiring parent email, password, and bcrypt PIN.
- Separate unticked consent checkboxes for speech metrics, optional recording storage (defaults OFF), and weekly email summaries (defaults OFF).
- Verifiable Parental Consent via cryptographic signed email tokens (COPPA § 312.5).
- Child profile restricted to nickname and age band only.

### 5.2 Curated Topic Library & Wheel of the Day
- 120 curated topics stored in [`topics.json`](file:///d:/SpeakUp%20Stars/src/data/topics.json) across 6 categories: *Animals*, *Silly Stories*, *Science & Space*, *Family & Friends*, *Superpowers*, *Daily Life*.
- Strictly filtered by age band (`3-5`, `6-8`, `9-12`).
- Interactive SVG spin wheel with RNG-first selection, sound effects, re-spin limit (1 re-spin allowed), Spacebar keyboard trigger, and reduced-motion instant jump.
- Deterministic "Wheel of the Day" with +15 bonus star points.

### 5.3 Speech Prep Stage & Calming Warm-Ups
- Displays chosen topic and 3 floating spark idea bubbles with read-aloud TTS.
- Speaking duration picker (30s for 3-5, 60s for 6-8, 90s for 9-12, 120s superstar).
- Mascot Privacy Reminder: *"Sparky says: let's not say our last name, address, or school today!"*
- Warm-Up Exercises Modal: 4-2-4 calming breathing bubble, age-tailored tongue twisters, and lion roar vocal warmups.

### 5.4 Live Recording Stage & Ephemeral Memory Management
- Dual-mode recording: Live Video (Camera + Mic) or Audio-Only Mode.
- 3-2-1 countdown, soft circular timer ring, pause, resume, restart, and finish early controls.
- Ephemeral storage: Recorded audio/video blobs exist strictly in browser RAM. Object URLs are explicitly revoked on completion via `URL.revokeObjectURL`.
- Hardware release: Camera and microphone streams are stopped immediately when unmounting, leaving the screen, or when the browser tab is hidden (`visibilitychange`).

### 5.5 Results Screen & Brave Voice Meter
- Non-punitive 0–100 Brave Voice Meter with growth levels (Seedling, Sprout, Flower, Tree, Star).
- Mascot Feedback Card: Exactly 3 things done great, 1-2 next steps to try next time, next speaking challenge, and Sparky cheer.
- On-device speech synthesis read-aloud helper (`speechHelper.speak()`).
- Responsive display: 5-dimension SVG radar chart on laptop; simplified skill progress bars on mobile.

### 5.6 Mini-Games Hub & 3D Volume Volcano
- Games Hub displaying catalog with game cards and skill badges.
- **Volume Volcano (Active 3D Game):** 60-second round where child's real-time voice volume powers magma glow and causes the volcano to erupt with star confetti. Uses Web Audio API on-device analysis; zero audio stored. Award points and Brave Voice badge.

### 5.7 Reward Shop, Badges & Mascot Dressing Room
- Star points balance and level progress bar.
- Daily practice streak with non-punitive Streak Freeze protection.
- Badges showcase with inspection modal (unlocked bright with confetti, locked greyed-out with kid-friendly instructions).
- Reward Shop featuring hats, outfits, color themes, and backgrounds.
- Real-time Mascot Dressing Room Preview where Sparky immediately models selected customizations.

### 5.8 Parent Dashboard & Data Rights Hub
- Protected by 4-6 digit parent PIN with 5-strike rate limiting and 15-minute lockout.
- Skill trends line charts, practice time statistics, and topics explored breakdown.
- Daily speaking time limits (Unlimited, 5, 10, 15, 20, 30 min) with gentle "time to rest your voice" screen.
- Category filtering toggles (enable/disable specific topic categories on the wheel).
- Gentle Mode toggle (ignores pacing and filler words).
- **Data Rights Transparency:** "See All Data We Have" modal displaying raw stored records.
- **1-Click Portable Exports:** Machine-readable JSON and spreadsheet CSV downloads.
- **Irreversible Deletion Controls:** Delete single session, delete all child data, or delete entire account with PIN confirmation and email deletion receipt.

---

## 6. CHILD PRIVACY, SAFETY & REGULATORY COMPLIANCE

### 6.1 COPPA Compliance (FTC 16 CFR Part 312)
- Direct notice via plain-language Parent Privacy Policy (`/privacy`).
- Verifiable Parental Consent (VPC) via cryptographic signed email tokens (§ 312.5).
- Data minimization: Only nickname and age band collected (§ 312.7).
- Ephemeral on-device audio/video processing (§ 312.5).
- Parental rights to inspect, export, and delete child data (§ 312.6).
- 30-day maximum retention on opted-in recordings (§ 312.10).
- Zero third-party advertising or commercial tracking SDKs.

### 6.2 GDPR-K & UK Age-Appropriate Design Code (15 Standards)
- Standard 1 (Best interests of the child): Non-punitive scoring, gentle rest screens.
- Standard 2 (Age-appropriate application): 120 topics filtered across 3 age brackets.
- Standard 3 (Transparent notice): Kid-friendly privacy story (`/kids-privacy`) with TTS.
- Standard 4 (Detrimental use): Input distress filter intercepts abuse keywords.
- Standard 5 (High privacy by default): Recordings default OFF; face analysis on-device.
- Standard 6 (Data minimization): Multilingual PII scrubber on all speech transcripts.
- Standard 7 (No sharing/chat): Zero user-to-user messaging, chat, or public profiles.
- Standard 8 (Geolocation): Geolocation APIs are disabled and blocked.
- Standard 9 (Parental controls): Complete control over time limits, categories, and purges.
- Standard 10 (Profiling ban): Zero Data Retention agreement on LLM; no behavioral profiles.
- Standard 11 (Nudge techniques ban): No manipulative notifications; max 2 parent notices/week.
- Standard 12 (Connected devices): Camera/mic hardware tracks strictly stop on page exit.
- Standard 13 (Online tools): 1-click self-serve JSON/CSV export and cascading deletion.
- Standard 14 (Accountability): Comprehensive documentation (`DATA_MAP.md`, `VENDORS.md`).

### 6.3 Apple App Store & Google Play Families Policies
- Apple Guideline 1.3 (Kids Category): Zero third-party analytics and zero ad networks.
- Apple Guideline 5.1.4 (Parental Gate): All external links and dashboard settings sit behind adult PIN.
- Google Play Families Policy: Target age groups declared; zero ads declared in Data Safety.

### 6.4 Data Map & Centralized Retention Engine
Governed by [`retentionConfig.ts`](file:///d:/SpeakUp%20Stars/src/services/retention/retentionConfig.ts):
- Recordings (Opt-In): 30 days maximum (auto-purged daily). Defaults to 0s if opt-in absent.
- Scrubbed Transcripts: 12 months default (parent-configurable to 3, 6, 12, or 24 months).
- Inactive Accounts: 23-month dormancy warning email; 24-month permanent cascading deletion.
- Administrative Audit Logs: 30 days rolling auto-purge.
- Media Signed URLs: 15-minute temporary TTL.

### 6.5 Third-Party Vendor Matrix
Documented in [`VENDORS.md`](file:///d:/SpeakUp%20Stars/VENDORS.md):
1. **Hosting & CDN:** Vercel Inc. / Cloudflare Inc. (US & Global Anycast, edge logs max 24h, signed DPA).
2. **Database & Storage:** Supabase Inc. / AWS `us-east-1` (AES-256 encryption at rest, RLS isolation, SOC 2 Type II).
3. **Speech-to-Text:** Local Client Browser Engine (On-device execution, 0s retention, 0 network dispatch).
4. **LLM Coaching Feedback:** Anthropic PBC (Claude API, Zero Data Retention agreement, 0 model training).
5. **Transactional Email:** Resend Inc. / AWS SES (Parent-only notifications, 7-day transient mail logs, signed DPA).
6. **Payments & Consent:** Stripe Inc. (PCI-DSS Level 1, child mode features $0 transactions).
7. **Error Tracking & Telemetry:** Internal Privacy-Safe Scrubber Logger ([`logger.ts`](file:///d:/SpeakUp%20Stars/src/services/logger.ts)). **ZERO third-party tracking SDKs installed**.

---

## 7. VERIFICATION, TESTING & METRICS

### 7.1 Test Suites Catalog (18 Files, 158 Tests Passed)

```
Test Files  18 passed (18)
     Tests  158 passed (158)
  Duration  5.10s (vitest run)
```

1. [`tests/full-loop-journey.test.ts`](file:///d:/SpeakUp%20Stars/tests/full-loop-journey.test.ts) (8 tests): Complete end-to-end user loop from parent signup, VPC consent, child creation, topic spin, prep, recording, speech analysis, rewards, to parent deletion.
2. [`tests/ai-feedback-pipeline.test.ts`](file:///d:/SpeakUp%20Stars/tests/ai-feedback-pipeline.test.ts) (13 tests): Harm/distress filter, output safety guardrails, 5 skill scores, non-discouraging floors, safe fallbacks.
3. [`tests/pii-scrubber.test.ts`](file:///d:/SpeakUp%20Stars/tests/pii-scrubber.test.ts) (7 tests): 40 benchmark sentences across English, Urdu, Arabic, Hindi, and Spanish.
4. [`tests/biometric-safeguards.test.ts`](file:///d:/SpeakUp%20Stars/tests/biometric-safeguards.test.ts) (8 tests): In-memory frame discard, voiceprint ban, zero-biometric storage validation.
5. [`tests/cross-family-rls.test.ts`](file:///d:/SpeakUp%20Stars/tests/cross-family-rls.test.ts) (6 tests): Multi-table tenant isolation across children, sessions, recordings, and audit logs.
6. [`tests/family-isolation.test.ts`](file:///d:/SpeakUp%20Stars/tests/family-isolation.test.ts) (4 tests): Bcrypt PIN lockout, rate limiting, and profile schema validation.
7. [`tests/recording-lifecycle.test.ts`](file:///d:/SpeakUp%20Stars/tests/recording-lifecycle.test.ts) (7 tests): Opt-in gate, 30-day purge, signed URL TTL, and consent revocation.
8. [`tests/retention-jobs.test.ts`](file:///d:/SpeakUp%20Stars/tests/retention-jobs.test.ts) (11 tests): Automated purges for recordings, transcripts, inactive accounts, and audit logs.
9. [`tests/parent-dashboard.test.ts`](file:///d:/SpeakUp%20Stars/tests/parent-dashboard.test.ts) (12 tests): Skill trends, time limits, categories, JSON/CSV exports, and deletions.
10. [`tests/rewards-system.test.ts`](file:///d:/SpeakUp%20Stars/tests/rewards-system.test.ts) (17 tests): Star points, streaks, streak freezes, badge unlocking, and dressing room.
11. [`tests/mini-games-framework.test.ts`](file:///d:/SpeakUp%20Stars/tests/mini-games-framework.test.ts) (7 tests): Web Audio volume tracker and Volume Volcano game scoring.
12. [`tests/child-safety-guardrails.test.ts`](file:///d:/SpeakUp%20Stars/tests/child-safety-guardrails.test.ts) (10 tests): Chat ban, external link PIN gates, nickname-only growth board.
13. [`tests/child-onboarding.test.ts`](file:///d:/SpeakUp%20Stars/tests/child-onboarding.test.ts) (3 tests): Nickname validation, age band validation, avatar select.
14. [`tests/prep.test.ts`](file:///d:/SpeakUp%20Stars/tests/prep.test.ts) (5 tests): Duration picker, warm-up breathing, mascot safety reminder.
15. [`tests/speech-pipeline.test.ts`](file:///d:/SpeakUp%20Stars/tests/speech-pipeline.test.ts) (6 tests): WPM, filler words, pause calculation, gentle mode.
16. [`tests/topics.test.ts`](file:///d:/SpeakUp%20Stars/tests/topics.test.ts) (7 tests): 120 curated topics, age filtering, helper prompts.
17. [`tests/accessibility-polish.test.ts`](file:///d:/SpeakUp%20Stars/tests/accessibility-polish.test.ts) (14 tests): Dyslexia font, high-contrast, i18n, screen time limits.
18. [`tests/legal-privacy-pages.test.ts`](file:///d:/SpeakUp%20Stars/tests/legal-privacy-pages.test.ts) (8 tests): Policy disclosures, vendor matrix, reconsent modal.

### 7.2 Build Metrics & Production Bundle Breakdown
```
> node scripts/check-privacy.js && tsc -b && vite build

✅ Child Privacy Check Passed: Zero trackers, analytics SDKs, or ad scripts detected.
✓ 2,780 modules transformed.
dist/registerSW.js                  0.13 kB
dist/manifest.webmanifest           0.42 kB
dist/index.html                     1.86 kB │ gzip:   0.90 kB
dist/assets/index-B2SlTXov.css     93.25 kB │ gzip:  14.74 kB
dist/assets/index-DwFIjlmj.js   1,946.97 kB │ gzip: 550.62 kB
✓ built in 22.79s
PWA precache: 6 entries (1,999.69 KiB)
```

---
*Report Certified by SpeakUp Stars System Architecture & Security Engineering.*
