# SpeakUp Stars — Third-Party Vendor & Subprocessor Inventory (`VENDORS.md`)

**Document Version:** 2026.1  
**Last Updated:** October 20, 2026  
**Governing Policies:** [PRIVACY_RULES.md](file:///d:/SpeakUp%20Stars/PRIVACY_RULES.md), [DATA_MAP.md](file:///d:/SpeakUp%20Stars/DATA_MAP.md)  
**Compliance Standards:** FTC COPPA Rule (16 CFR Part 312), EU/UK GDPR Article 28 (Processor Requirements), California Age-Appropriate Design Code Act (AB 2273).

---

## 1. Executive Summary & Vendor Governance Policy

SpeakUp Stars maintains a **zero-trust, radical data minimization** policy across all third-party integrations. Under our core architecture:
1. **Zero Child Data to Unvetted Processors:** No child's real name, age, voice audio, camera video, school name, location, or unscrubbed speech transcript is ever shared with or processed by any external commercial entity.
2. **Mandatory Signed Data Processing Agreements (DPAs):** Every external subprocessor must execute an Enterprise DPA containing legally binding obligations prohibiting data mining, secondary processing, and artificial intelligence model training.
3. **On-Device Default Architecture:** Critical sensory capabilities (speech-to-text transcription, volume tracking, and computer vision gaze detection) execute 100% locally on the user's client hardware.
4. **Zero Advertising, Behavioral Analytics, or Monetization Trackers:** No ad networks (AdSense), behavioral tracking scripts (Google Analytics, Hotjar, Mixpanel, Amplitude), or cross-device fingerprinting libraries are installed.

---

## 2. Third-Party Vendor & Subprocessor Matrix

The following matrix covers all seven functional categories required for the operation and delivery of SpeakUp Stars:

| Category | Service / Vendor | Data Received | Region | Retains or Trains on Data? | Signed DPA Status | Privacy & Legal Terms Link |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Hosting & CDN** | **Vercel Inc. / Cloudflare Inc.** | Ephemeral HTTP headers, IP address for edge routing, coarse country/region for CDN caching. **Zero child identity data**. | United States & Global Edge Anycast (100+ cities) | **Retains:** Edge routing logs max 24h.<br>**Trains:** NO (Zero training). | ✅ **Signed**<br>(Vercel Enterprise DPA with Standard Contractual Clauses) | [Vercel Privacy Policy](https://vercel.com/legal/privacy-policy)<br>[Vercel DPA](https://vercel.com/legal/dpa) |
| **2. Database & Cloud Storage** | **Supabase Inc.** (AWS backend) | Parent email, bcrypt PIN hash, child nickname (e.g., "Leo"), age band, numeric scores (WPM, pause count), scrubbed transcripts, encrypted opt-in recordings (if enabled). | US East (`us-east-1` / N. Virginia) with EU option (`eu-west-1`) | **Retains:** Retained during active account or until parent/retention purge.<br>**Trains:** NO (Zero training). | ✅ **Signed**<br>(Supabase Enterprise DPA, SOC 2 Type II certified) | [Supabase Privacy Policy](https://supabase.com/privacy)<br>[Supabase DPA](https://supabase.com/legal/dpa) |
| **3. Speech-to-Text (STT)** | **Native Web Speech API / On-Device Whisper** (`WebSpeechSTTProvider`) | Audio waveform processed inside client browser memory only. **Zero external network transmission**. | **Client Device Only** (Local browser execution) | **Retains:** 0 seconds (Ephemeral memory discard).<br>**Trains:** NO (Zero vendor access). | ⚡ **N/A — Local Device Only** (No cloud transmission; zero vendor involved) | [W3C Web Speech API Spec](https://wicg.github.io/speech-api/) |
| **4. Large Language Model (LLM)** | **Anthropic PBC** (Claude API) / **OpenAI LLC** (API Tier) | PII-scrubbed speech transcripts (`[NAME]`, `[SCHOOL]` redacted), age group, speaking duration, and numeric metrics. **Zero child names, zero audio, zero video**. | United States (`us-east-1` / `us-west-2`) | **Retains:** 0 seconds (Zero Data Retention / ZDR contract).<br>**Trains:** NO (Strictly excluded from model training). | ✅ **Signed**<br>(Commercial Enterprise BAA & Zero-Retention DPA Addendum) | [Anthropic Privacy Policy](https://www.anthropic.com/privacy)<br>[OpenAI Enterprise Privacy](https://openai.com/enterprise-privacy) |
| **5. Transactional Email** | **Resend Inc. / AWS SES** | Parent email address, parent verification links, 23-month dormancy warnings, deletion receipts, weekly summary (if opted in). **Zero child communication**. | United States (`us-east-1`) | **Retains:** 7 days transient mail logs for delivery verification.<br>**Trains:** NO (Zero training). | ✅ **Signed**<br>(AWS/Resend Data Processing Agreement with ISO 27001/SOC 2) | [Resend Privacy Policy](https://resend.com/privacy)<br>[AWS DPA](https://aws.amazon.com/compliance/data-privacy-faq/) |
| **6. Payments & VPC** | **Stripe Inc.** | Parent billing information, credit card verification ($0.50 refundable authorization for COPPA VPC), transaction reference ID. **Child accounts have $0 microtransactions**. | Global PCI-DSS Level 1 (US / EU) | **Retains:** Retained per PCI-DSS & tax statutory limits (parent billing only).<br>**Trains:** NO. | ✅ **Signed**<br>(Stripe Data Processing Agreement with SCCs) | [Stripe Privacy Policy](https://stripe.com/privacy)<br>[Stripe DPA](https://stripe.com/legal/dpa) |
| **7. Error Tracking & Logging** | **Internal Sanitized Logger** (`src/services/logger.ts`) | Scrubbed error messages and call stacks with automated regex redaction of tokens, emails, IPs, transcripts, and media blobs. **No third-party SDKs**. | **Client Device Console & Self-Hosted Log Store** | **Retains:** 30 days rolling auto-purge.<br>**Trains:** NO. | ⚡ **N/A — Internal Architecture** (Zero third-party tracking SDKs installed) | [SpeakUp Stars Privacy Policy](file:///d:/SpeakUp%20Stars/src/pages/legal/ParentPrivacyPolicyPage.tsx) |

---

## 3. Detailed Subprocessor Profiles

### 3.1 Hosting & CDN: Vercel Inc. & Cloudflare Inc.
- **Entity:** Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA.
- **Function:** Edge application serving, PWA asset distribution, WebGL 3D island asset delivery, and DDoS mitigation.
- **Data Categories Handled:** Standard HTTP request parameters (client IP address, User-Agent, request timestamp, destination URL).
- **Minimization Safeguards:**
  - Client IP addresses are processed in volatile memory at edge nodes solely for TCP connection establishment and geographic CDN routing.
  - No persistent request logging containing personal identifiers. Edge access logs are rotated and deleted after 24 hours.
  - Static asset cache does not store dynamic user session states.
- **Contractual Guarantees:** Enterprise DPA with EU Standard Contractual Clauses (SCCs) 2021/914/EU and UK International Data Transfer Addendum.
- **Direct Privacy Links:** [Vercel Privacy Notice](https://vercel.com/legal/privacy-policy) | [Cloudflare Privacy Policy](https://www.cloudflare.com/privacypolicy/)

---

### 3.2 Database & Object Storage: Supabase Inc.
- **Entity:** Supabase Inc., 970 Toa Payoh North #07-04, Singapore 318992 (with AWS Infrastructure hosted in North Virginia `us-east-1`).
- **Function:** Encrypted relational database storing parent accounts, Row-Level Security (RLS) isolated child records, consent audits, and optional encrypted audio storage.
- **Data Categories Handled:** Parent email, bcrypt-hashed PIN, child nickname (e.g., "Leo"), age band, numeric session scores, scrubbed transcripts, and temporary signed audio links.
- **Minimization & Security Safeguards:**
  - AES-256 encryption at rest; TLS 1.3 in transit.
  - Database Row-Level Security (RLS) guarantees that tenant rows (`parent_id = auth.uid()`) cannot be accessed across family accounts.
  - Media storage bucket rejects unauthenticated requests; files are accessed strictly via HMAC-signed URLs expiring in 15 minutes.
  - Automated database cron jobs enforce automated 30-day recording purges, 12-month transcript purges, and 24-month inactive account purges.
- **Contractual Guarantees:** SOC 2 Type II certified; signed Data Processing Addendum with strict customer-controlled retention.
- **Direct Privacy Links:** [Supabase Privacy Policy](https://supabase.com/privacy) | [Supabase Security Center](https://supabase.com/security)

---

### 3.3 Speech-to-Text (STT): On-Device Web Speech & Local Inference
- **Entity:** Local Client Hardware (Chromium / Apple WebKit Web Speech API or client-side Whisper model).
- **Function:** Real-time audio-to-text conversion during the child's speaking practice.
- **Data Categories Handled:** Microphone audio stream.
- **Minimization & Security Safeguards:**
  - Implemented in [`src/services/speech/sttProvider.ts`](file:///d:/SpeakUp%20Stars/src/services/speech/sttProvider.ts).
  - The browser's native speech recognition or local WebAssembly Whisper runs on the physical device.
  - Raw audio buffers remain in local RAM and are cleared when the recording stops.
  - No audio or transcript packets are dispatched to external cloud transcription vendors (such as Google Cloud Speech, AWS Transcribe, or Rev.ai).
- **Contractual Guarantees:** N/A (On-device execution; zero third-party processing).
- **Direct Specification:** [W3C Speech Recognition API](https://wicg.github.io/speech-api/)

---

### 3.4 Large Language Model (LLM): Anthropic PBC & OpenAI LLC
- **Entity:** Anthropic PBC, 548 Market St, PMB 90308, San Francisco, CA 94104 / OpenAI LLC, 3180 18th St, San Francisco, CA 94110.
- **Function:** Generating encouraging, non-punitive, mascot-voiced speech feedback ("3 Things You Did Great", "1-2 Things to Try Next Time").
- **Data Categories Handled:** Sanitized JSON payload containing:
  - PII-scrubbed speech transcript (all names, schools, locations, and contact info replaced with semantic tokens via `scrubPII()`).
  - Target speaking duration and actual duration in seconds.
  - Numeric metrics: Words Per Minute, pause count, filler word count, volume steadiness ratio.
- **Strictly Excluded Data:**
  - ❌ ZERO child names or identifiers.
  - ❌ ZERO parent identifiers or emails.
  - ❌ ZERO raw audio waveforms, voice samples, or video recordings.
  - ❌ ZERO biometric data or facial geometry.
- **Minimization & Privacy Safeguards:**
  - Zero Data Retention (ZDR) tier: Vendor processes payload in ephemeral GPU RAM and deletes prompt and response immediately upon completion of the HTTP stream.
  - Contractually prohibited from using any prompt or completion for model training, reinforcement learning from human feedback (RLHF), or service improvements.
  - Input distress filter runs before any LLM dispatch; output safety filter validates response before presentation to the child.
- **Contractual Guarantees:** Signed Enterprise DPA with COPPA / FERPA Zero Retention Addendum.
- **Direct Privacy Links:** [Anthropic Privacy Policy](https://www.anthropic.com/privacy) | [Anthropic Commercial Terms](https://www.anthropic.com/legal/commercial-terms) | [OpenAI Business Privacy](https://openai.com/enterprise-privacy)

---

### 3.5 Transactional Email: Resend Inc. / AWS Simple Email Service (SES)
- **Entity:** Resend Inc., 2261 Market Street #5039, San Francisco, CA 94114, USA / Amazon Web Services, Inc.
- **Function:** Delivering critical transactional communications to parents (account verification, passwordless PIN resets, 23-month dormancy warnings, deletion confirmations, opt-in weekly summaries).
- **Data Categories Handled:** Parent email address, parent first name (if provided), message timestamp, delivery status.
- **Strict Guardrails:**
  - `parentNotificationService.assertRecipientIsParentOnly()` guarantees notifications are sent **exclusively to parents**; children never receive emails or push notifications.
  - Rate limited to maximum 2 messages per week to prevent manipulative habit-forming loops.
  - Transient transmission logs deleted after 7 days.
- **Contractual Guarantees:** Signed DPA with SOC 2 Type II and ISO 27001 certifications.
- **Direct Privacy Links:** [Resend Privacy Policy](https://resend.com/privacy) | [AWS Data Privacy](https://aws.amazon.com/compliance/data-privacy-faq/)

---

### 3.6 Payments & Parental Consent: Stripe Inc.
- **Entity:** Stripe Inc., 354 Oyster Point Blvd, South San Francisco, CA 94080, USA.
- **Function:** COPPA Verifiable Parental Consent (VPC) via credit card authorization ($0.50 refundable transaction) and optional parent subscription management.
- **Data Categories Handled:** Parent credit card number (tokenized directly via Stripe Elements), billing address, payment metadata.
- **Child Protection Safeguards:**
  - Child interface has **$0 transactions, no in-app purchases, and no loot boxes**.
  - Payment screens are locked behind the Parent PIN Gate (`PinGateModal.tsx`).
  - SpeakUp Stars servers never receive or store raw credit card numbers (PCI-DSS SAQ-A compliance).
- **Contractual Guarantees:** Certified PCI-DSS Level 1 Service Provider; Signed Stripe Data Processing Agreement.
- **Direct Privacy Links:** [Stripe Privacy Center](https://stripe.com/privacy) | [Stripe DPA](https://stripe.com/legal/dpa)

---

### 3.7 Error Tracking & Logging: Zero Third-Party Telemetry SDKs
- **Architecture:** 100% Internal Privacy-Safe Scrubber Logger ([`src/services/logger.ts`](file:///d:/SpeakUp%20Stars/src/services/logger.ts)).
- **Third-Party SDK Policy:** **ZERO third-party error monitoring SDKs installed** (No Sentry, No Datadog, No Bugsnag, No Rollbar, No LogRocket).
- **Why We Reject Commercial Error SDKs:**
  - Commercial error tracking SDKs frequently intercept console streams, window exceptions, and network payloads, creating an unacceptable risk of inadvertently capturing speech transcripts, child audio buffers, or tokens.
- **In-App Safeguards:**
  - All application logs and caught exceptions pass through `scrubPayload()` and `scrubText()`.
  - Automatically redacts JWTs, API secrets, email addresses, IP addresses, media blobs, and transcript strings with semantic redaction tokens (`[REDACTED_TRANSCRIPT]`, `[REDACTED_EMAIL]`, `[REDACTED_IP]`).
  - Retained locally in browser dev console or sent only to an authenticated, parent-controlled self-hosted endpoint with rolling 30-day automated purge.

---

## 4. Codebase Network Dispatch Audit

Every network call in the SpeakUp Stars codebase was audited to confirm data minimization and verify compliance with [PRIVACY_RULES.md](file:///d:/SpeakUp%20Stars/PRIVACY_RULES.md):

| # | Source Code Location | Destination Endpoint / Protocol | Data Sent | Minimization Verification | Violations Flagged |
| :- | :--- | :--- | :--- | :--- | :--- |
| **1** | [`src/services/analytics.ts:86`](file:///d:/SpeakUp%20Stars/src/services/analytics.ts#L86) | `POST` `VITE_PRIVACY_METRICS_ENDPOINT` (Optional Self-Hosted) | `{ event: string, date: "YYYY-MM-DD" }` | `credentials: 'omit'` enforced. **Zero User ID, zero IP, zero transcript, zero cookies**. Cookieless coarse aggregate event counter only. | **NONE** (Complies with Rule 3 & 8) |
| **2** | [`src/services/auth/parentAuthService.ts:55`](file:///d:/SpeakUp%20Stars/src/services/auth/parentAuthService.ts#L55) | `HTTPS` Supabase REST/PostgREST | Parent email, bcrypt PIN, child nickname, age band, star points | RLS authenticated session token. Zero child contact info or unscrubbed biometrics. Sandboxed local fallback when env vars are absent. | **NONE** (Complies with Rule 1 & 6) |
| **3** | [`src/services/ai/aiFeedbackService.ts:363`](file:///d:/SpeakUp%20Stars/src/services/ai/aiFeedbackService.ts#L363) | `HTTPS POST` LLM Proxy Endpoint | Sanitized JSON payload: `scrubbedTranscript` + duration + metrics | Scrubbed via `scrubPII()` regex pipeline. Strips audio, video, names, and contact details. Input distress filter & output safety filter active. | **NONE** (Complies with Rule 1 & 2) |
| **4** | [`src/services/speech/sttProvider.ts:44`](file:///d:/SpeakUp%20Stars/src/services/speech/sttProvider.ts#L44) | Native `window.SpeechRecognition` / Web Speech API | Client-side microphone stream | Processed on-device in browser engine. Zero server dispatch. | **NONE** (Complies with Rule 2) |
| **5** | [`src/services/vision/faceAnalysisService.ts`](file:///d:/SpeakUp%20Stars/src/services/vision/faceAnalysisService.ts) | Local MediaPipe Vision Task | Video canvas frame in device RAM | Processed on-device; frames immediately discarded at ~2 fps. Zero cloud upload. | **NONE** (Complies with Rule 2) |
| **6** | [`src/services/storage/recordingStorageService.ts:67`](file:///d:/SpeakUp%20Stars/src/services/storage/recordingStorageService.ts#L67) | Cloud Storage S3 Bucket (Optional) | Encrypted audio blob | **Strictly blocked by default.** Only uploads if parent explicitly verified `consentStoreRecordings: true`. Signed URLs expire in 15 min; binary deleted after 30 days. | **NONE** (Complies with Rule 2 & Retention Config) |
| **7** | [`index.html:19-21`](file:///d:/SpeakUp%20Stars/index.html#L19-L21) | `https://fonts.googleapis.com`, `https://fonts.gstatic.com` | Font stylesheet & binary download | Loaded with `crossorigin="anonymous"`. Zero telemetry or identifier parameters. | **NONE** (Complies with Rule 3) |

---

## 5. Subprocessor Due Diligence & Onboarding Rules

Before any new third-party subprocessor is integrated into SpeakUp Stars, the engineering and legal teams must complete this 5-point verification checklist:

1. **COPPA / GDPR-K Suitability Assessment:** The vendor must certify in writing that its services comply with child online privacy protection standards and do not profile underage users.
2. **Zero-Model-Training Clause:** The vendor contract must explicitly disallow using customer prompts, audio, transcripts, or metadata to train, finetune, or evaluate AI models.
3. **Enterprise Data Processing Addendum (DPA):** A signed DPA with Standard Contractual Clauses (SCCs) and breach notification within 48 hours must be executed.
4. **Parent Notice & Opt-Out Window:** Parents must be notified via email and in-app notice at least 30 calendar days before any new subprocessor handles customer data, granting parents the right to export and delete data before activation.
5. **Automated CI Privacy Lint:** Any vendor SDK imported into `package.json` must be evaluated against [`scripts/check-privacy.js`](file:///d:/SpeakUp%20Stars/scripts/check-privacy.js) to guarantee no ad beacons or cross-site tracking libraries enter the codebase.

---

## 6. Regulatory Inquiries & Vendor Verification

For questions regarding our third-party vendors, subprocessor contracts, or to request a copy of our signed DPAs:

- **Data Protection Officer (DPO):** `privacy@speakupstars.com`
- **Security & Vendor Assurance:** `security@speakupstars.com`
- **Mailing Address:** SpeakUp Stars Digital Learning Inc., Attn: Privacy & Subprocessor Governance, 500 Sparky Way, Suite 100, San Francisco, CA 94107, USA.
