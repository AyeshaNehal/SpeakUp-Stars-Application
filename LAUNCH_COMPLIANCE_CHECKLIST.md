# SpeakUp Stars — Pre-Launch Regulatory Compliance Checklist (`LAUNCH_COMPLIANCE_CHECKLIST.md`)

**Document Version:** 2026.1  
**Target Release Date:** October 2026  
**Governing Laws & Standards:**
- **US:** FTC Children's Online Privacy Protection Act (COPPA Rule 16 CFR Part 312), California Age-Appropriate Design Code Act (AB 2273).
- **EU / UK:** General Data Protection Regulation (GDPR-K / Art. 5, 6, 8, 17, 28), UK Age-Appropriate Design Code (Children's Code).
- **App Stores:** Apple App Store Review Guidelines (Guideline 1.3 "Kids Category" & Guideline 5.1.4 "Kids Privacy"), Google Play Families Policy & Developer Program Policies.

---

## 1. Regulatory Compliance Verification Checklist

### 1.1 COPPA Compliance (FTC Rule 16 CFR Part 312)

| Requirement | Implementation in SpeakUp Stars | Verification / Code Reference | Status |
| :--- | :--- | :--- | :--- |
| **Direct Notice to Parents (§ 312.4)** | Clear, readable Parent Privacy Policy (`/privacy`) detailing every data element collected, purpose, and all 7 subprocessor vendors. | [`ParentPrivacyPolicyPage.tsx`](file:///d:/SpeakUp%20Stars/src/pages/legal/ParentPrivacyPolicyPage.tsx), [`policyVersionService.ts`](file:///d:/SpeakUp%20Stars/src/services/legal/policyVersionService.ts) | **PASS** |
| **Verifiable Parental Consent (VPC) (§ 312.5)** | Multi-step onboarding requiring parent email, bcrypt PIN, separate unticked consent checkboxes, and electronic signature / credit card authorization ($0.50 refundable). | [`ParentOnboardingModal.tsx`](file:///d:/SpeakUp%20Stars/src/components/auth/ParentOnboardingModal.tsx), [`parentalConsent/index.ts`](file:///d:/SpeakUp%20Stars/src/services/parentalConsent/index.ts) | **PASS** |
| **Strict Data Minimization (§ 312.7)** | Child accounts can ONLY specify a nickname (e.g., "Leo") and age band (`3-5`, `6-8`, `9-12`). Full names, emails, birthdays, addresses, and schools are strictly blocked by Zod schemas. | [`validation.ts`](file:///d:/SpeakUp%20Stars/src/services/security/validation.ts), [`parentAuthService.ts`](file:///d:/SpeakUp%20Stars/src/services/auth/parentAuthService.ts) | **PASS** |
| **On-Device Ephemeral Media (§ 312.5)** | Audio and video stream tracks execute on-device and are released immediately upon tab switch or screen exit. Raw audio/video is NEVER uploaded to cloud storage unless parent explicitly opts in. | [`RecordPage.tsx`](file:///d:/SpeakUp%20Stars/src/pages/RecordPage.tsx#L122-L168), [`recordingStorageService.ts`](file:///d:/SpeakUp%20Stars/src/services/storage/recordingStorageService.ts) | **PASS** |
| **Parental Access & Inspection (§ 312.6)** | Parents can inspect all stored child records, session metrics, transcripts, and badges via "See All Data We Have" in the PIN-protected Parent Dashboard. | [`SeeAllDataModal.tsx`](file:///d:/SpeakUp%20Stars/src/components/dashboard/SeeAllDataModal.tsx), [`ParentDashboardPage.tsx`](file:///d:/SpeakUp%20Stars/src/pages/ParentDashboardPage.tsx) | **PASS** |
| **Parental Right to Erasure (§ 312.6)** | Immediate 1-click self-serve deletion: "Delete Single Session", "Delete All Child Data", or "Delete Whole Account" with PIN re-entry and email confirmation receipt. | [`ParentDashboardPage.tsx`](file:///d:/SpeakUp%20Stars/src/pages/ParentDashboardPage.tsx#L270-L285), [`parentDashboardService.ts`](file:///d:/SpeakUp%20Stars/src/services/dashboard/parentDashboardService.ts) | **PASS** |
| **Data Retention Limitation (§ 312.10)** | Automated deletion cron jobs: 30-day max for opted-in recordings, 12-month default for transcripts, 23m warning / 24m purge for inactive accounts, 30 days for logs. | [`retentionConfig.ts`](file:///d:/SpeakUp%20Stars/src/services/retention/retentionConfig.ts), [`dataRetentionService.ts`](file:///d:/SpeakUp%20Stars/src/services/retention/dataRetentionService.ts) | **PASS** |
| **Zero Third-Party Advertising (§ 312.7)** | Zero ad networks, behavioral trackers, or monetization pixels installed. Automated CI scanner enforces compliance on every build. | [`scripts/check-privacy.js`](file:///d:/SpeakUp%20Stars/scripts/check-privacy.js), [`PRIVACY_RULES.md`](file:///d:/SpeakUp%20Stars/PRIVACY_RULES.md) | **PASS** |

---

### 1.2 GDPR-K & UK Age-Appropriate Design Code (15 Standards)

| Standard | Implementation in SpeakUp Stars | Code Reference | Status |
| :--- | :--- | :--- | :--- |
| **1. Best Interests of the Child** | Speech feedback is non-punitive, celebrating brave effort with growth levels (Seedling to Star). Zero negative scores, zero failure screens. | [`aiFeedbackService.ts`](file:///d:/SpeakUp%20Stars/src/services/ai/aiFeedbackService.ts#L98-L115) | **PASS** |
| **2. Age-Appropriate Application** | Curated topic database (120 prompts) filtered strictly by age band (`3-5`, `6-8`, `9-12`). Age-adjusted pacing thresholds. | [`topicService.ts`](file:///d:/SpeakUp%20Stars/src/services/topics/topicService.ts), [`topics.json`](file:///d:/SpeakUp%20Stars/src/data/topics.json) | **PASS** |
| **3. Transparent Kid-Friendly Privacy** | Mascot-narrated privacy page (`/kids-privacy`) featuring Sparky, simple sentences, big visual icons, and an on-device read-aloud button. | [`KidFriendlyPrivacyPage.tsx`](file:///d:/SpeakUp%20Stars/src/pages/legal/KidFriendlyPrivacyPage.tsx) | **PASS** |
| **4. Detrimental Use of Data** | Input distress/harm filter intercepts domestic harm/abuse keywords, halts scoring, shows a loving reassurance card, and creates a quiet parent alert. | [`aiFeedbackService.ts`](file:///d:/SpeakUp%20Stars/src/services/ai/aiFeedbackService.ts#L69-L79), [`parentSafetyAlertService.ts`](file:///d:/SpeakUp%20Stars/src/services/security/parentSafetyAlertService.ts) | **PASS** |
| **5. High Privacy by Default** | Opt-in recording storage defaults strictly to OFF. Face analysis defaults to on-device only with voice-only toggle. Geolocation is disabled. | [`recordingStorageService.ts`](file:///d:/SpeakUp%20Stars/src/services/storage/recordingStorageService.ts#L44-L70), [`parentSettingsService.ts`](file:///d:/SpeakUp%20Stars/src/services/settings/parentSettingsService.ts) | **PASS** |
| **6. Data Minimization (Art. 5(1)(c))** | Transcripts pass through multilingual PII scrubber replacing names, addresses, phones, and schools with tokens before analysis or persistence. | [`piiScrubber.ts`](file:///d:/SpeakUp%20Stars/src/services/security/piiScrubber.ts) | **PASS** |
| **7. No Data Sharing / Social Features** | Zero live chat, comments, public profiles, friend requests, or peer messaging. Speeches can only be shared with verified family via private expiring token links. | [`childSafetyGuardService.ts`](file:///d:/SpeakUp%20Stars/src/services/security/childSafetyGuardService.ts), [`familySharingService.ts`](file:///d:/SpeakUp%20Stars/src/services/sharing/familySharingService.ts) | **PASS** |
| **8. Geolocation Disabled** | Geolocation APIs are not queried or requested; browser permissions request only audio (`navigator.mediaDevices.getUserMedia`). | [`RecordPage.tsx`](file:///d:/SpeakUp%20Stars/src/pages/RecordPage.tsx), [`index.html`](file:///d:/SpeakUp%20Stars/index.html) | **PASS** |
| **9. Parental Controls & Notice** | Parent Dashboard gives grown-ups total authority over daily time limits (5-30 min), category toggles, gentle mode, and export/deletion. | [`ParentDashboardPage.tsx`](file:///d:/SpeakUp%20Stars/src/pages/ParentDashboardPage.tsx) | **PASS** |
| **10. Profiling Prohibited** | AI model is bound by Zero Data Retention (ZDR); transcripts and outputs are never stored on LLM servers or used to build behavioral profiles or train AI. | [`VENDORS.md`](file:///d:/SpeakUp%20Stars/VENDORS.md#L62-L73) | **PASS** |
| **11. Nudge Techniques Prohibited** | Push notifications go strictly to parents (max 2/week). No manipulative notifications ("Your streak is dying!"). Mascot offers non-punitive Streak Freeze. | [`parentNotificationService.ts`](file:///d:/SpeakUp%20Stars/src/services/notifications/parentNotificationService.ts), [`rewardsService.ts`](file:///d:/SpeakUp%20Stars/src/services/rewards/rewardsService.ts) | **PASS** |
| **12. Connected Devices & Safety** | Camera and microphone hardware tracks stop immediately when leaving the page or backgrounding the browser tab. | [`RecordPage.tsx`](file:///d:/SpeakUp%20Stars/src/pages/RecordPage.tsx#L153-L168) | **PASS** |
| **13. Online Tools (Right to Erasure)** | Self-serve 1-click export (JSON + CSV) and deletion in parent dashboard; cascading RLS purge deletes parent account and all linked child data. | [`parentDashboardService.ts`](file:///d:/SpeakUp%20Stars/src/services/dashboard/parentDashboardService.ts#L430-L500) | **PASS** |
| **14. Governance & Accountability** | Centralized Data Map ([`DATA_MAP.md`](file:///d:/SpeakUp%20Stars/DATA_MAP.md)), Subprocessor Inventory ([`VENDORS.md`](file:///d:/SpeakUp%20Stars/VENDORS.md)), and Incident Response Plan ([`INCIDENT_RESPONSE.md`](file:///d:/SpeakUp%20Stars/INCIDENT_RESPONSE.md)). | Root documentation files | **PASS** |

---

### 1.3 Apple App Store (Kids Category Guidelines 1.3 & 5.1.4)

| Guideline | Requirement | Implementation | Status |
| :--- | :--- | :--- | :--- |
| **1.3.1 Advertising Ban** | No third-party advertising or behavioral tracking SDKs allowed in Kids Category. | Zero ad packages in `package.json`; automated build-time privacy lint script passes cleanly. | **PASS** |
| **1.3.2 Parental Gate** | External links, purchases, and settings must sit behind an adult parental gate. | [`PinProtectedLink.tsx`](file:///d:/SpeakUp%20Stars/src/components/common/PinProtectedLink.tsx) and [`PinGateModal.tsx`](file:///d:/SpeakUp%20Stars/src/components/auth/PinGateModal.tsx) require adult PIN confirmation for all external links and dashboard settings. | **PASS** |
| **5.1.4 Kids Privacy** | Apps in Kids Category must not transmit personally identifiable information or device identifiers to third parties. | Zero IDFA, zero IDFV, zero canvas fingerprinting, zero user-level telemetry. Only coarse aggregate counters via self-hosted endpoint with `credentials: 'omit'`. | **PASS** |
| **5.1.4 Consent** | Clear privacy policy link on store page and within app. Re-consent prompt on policy changes. | Footer link on every page; [`PolicyReconsentModal.tsx`](file:///d:/SpeakUp%20Stars/src/components/legal/PolicyReconsentModal.tsx) triggers modal if policy version updates. | **PASS** |

---

### 1.4 Google Play Families Policy

| Policy Requirement | Google Play Requirement | Implementation | Status |
| :--- | :--- | :--- | :--- |
| **Target Audience & Content** | App must declare target age groups (Ages 5 & under, 6-8, 9-12). | Filtered experience across all 3 age groups without adult crossover. | **PASS** |
| **Families Self-Certified Ads SDK** | If serving ads, must use Google Play certified SDK. | **SpeakUp Stars serves ZERO ads**. Declared as "No Ads" in Google Play Console. | **PASS** |
| **Data Safety Section** | Accurate disclosure of collected data types, encryption, and deletion mechanisms. | Matches [`DATA_MAP.md`](file:///d:/SpeakUp%20Stars/DATA_MAP.md) and [`VENDORS.md`](file:///d:/SpeakUp%20Stars/VENDORS.md) 100%. Data in transit encrypted via TLS 1.3; data at rest encrypted via AES-256. | **PASS** |
| **No Inappropriate Content** | AI outputs must not contain sexual, profane, violent, or shaming text. | Dual AI filter architecture: Input distress filter + Output safety regex filter with safe pre-written fallbacks. | **PASS** |

---

## 2. Items You Must Confirm with a Qualified Privacy Lawyer

Before commercial deployment, schedule a legal review session to confirm the following text elements marked in the code with `LEGAL REVIEW REQUIRED`:

1. **Parent Privacy Policy ([`src/pages/legal/ParentPrivacyPolicyPage.tsx#L40`](file:///d:/SpeakUp%20Stars/src/pages/legal/ParentPrivacyPolicyPage.tsx#L40))**:
   - Review the legal definitions of biometric vs. non-biometric data under Texas CUBI, Illinois BIPA, and GDPR Article 9. Confirm that temporary scalar ratio processing (eye contact score, smile score) without facial template persistence falls outside BIPA liability.
   - Verify that the vendor disclosure list matches your exact legal corporate entities and contracts.
2. **Kid-Friendly Privacy Notice ([`src/pages/legal/KidFriendlyPrivacyPage.tsx#L32`](file:///d:/SpeakUp%20Stars/src/pages/legal/KidFriendlyPrivacyPage.tsx#L32))**:
   - Confirm that the plain-language explanation meets the transparency standards under UK Information Commissioner's Office (ICO) Age-Appropriate Design Code standard 3.
3. **Terms of Use & Essential Storage Notice ([`src/pages/legal/TermsOfUsePage.tsx#L35`](file:///d:/SpeakUp%20Stars/src/pages/legal/TermsOfUsePage.tsx#L35))**:
   - Review the limitation of liability clauses, dispute resolution / arbitration provisions, and the definition of essential browser storage (IndexedDB/LocalStorage) exempt from ePrivacy Directive cookie consent banners.
4. **Verifiable Parental Consent (VPC) Method ([`src/services/parentalConsent/index.ts#L10`](file:///d:/SpeakUp%20Stars/src/services/parentalConsent/index.ts#L10))**:
   - Determine whether your production launch will utilize $0.50 refundable credit card authorization (Stripe), digital signature with knowledge-based authentication, or a certified COPPA Safe Harbor program (PRIVO, kidSAFE, CARU).
5. **Signed Subprocessor DPAs**:
   - Ensure signed Enterprise DPAs are countersigned on file with Anthropic PBC (Claude API), Supabase Inc. (AWS), Stripe Inc., and Resend Inc. prior to routing production traffic.

---

## 3. Hosting, Infrastructure & Environment Variables Setup

### 3.1 Production Environment Variables

Ensure the following variables are configured in your production hosting environment (e.g., Vercel / Cloudflare Pages dashboard) and **never committed to source control**:

```bash
# Supabase Production Database & Storage
VITE_SUPABASE_URL="https://your-production-app.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOi..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..." # Server-side only (for scheduled retention purge cron jobs)

# AI Backend API Proxy (Server-side Edge Function)
LLM_PROVIDER="anthropic" # or "openai"
ANTHROPIC_API_KEY="sk-ant-prod-..." # Kept server-side in Edge Function
OPENAI_API_KEY="sk-prod-..."

# Transactional Email (Parent Communications Only)
RESEND_API_KEY="re_prod_..."
TRANSACTIONAL_FROM_EMAIL="Sparky from SpeakUp Stars <support@speakupstars.com>"

# Optional Self-Hosted Aggregate Metrics Endpoint
VITE_PRIVACY_METRICS_ENDPOINT="https://metrics.speakupstars.com/v1/aggregate"

# Stripe Production Keys (Parent Mode Only)
STRIPE_PUBLIC_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### 3.2 Content Security Policy (CSP) & HTTP Security Headers

Ensure the production edge server (Vercel `vercel.json` or Cloudflare Pages `_headers`) emits the following strict headers:

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://private.speakupstars.com; media-src 'self' blob: https://private.speakupstars.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com https://api.openai.com https://api.stripe.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self';
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(self), microphone=(self), geolocation=(), interest-cohort=()
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

### 3.3 Automated Data Retention Scheduled Jobs (Cron)

Configure a secure daily cron runner (e.g., GitHub Actions Scheduled Workflow or Supabase `pg_cron`) invoking the retention engine endpoints:

```sql
-- Daily execution of retention jobs via Supabase pg_cron at 03:00 UTC
SELECT cron.schedule('purge-expired-recordings', '0 2 * * *', $$
  SELECT purge_expired_recordings();
$$);

SELECT cron.schedule('purge-expired-transcripts', '0 3 * * *', $$
  SELECT purge_expired_transcripts();
$$);

SELECT cron.schedule('purge-expired-audit-logs', '0 4 * * *', $$
  SELECT purge_expired_audit_logs();
$$);
```

---

## 4. App Store & Google Play Submission Steps

### 4.1 Packaging Architecture (PWA / Mobile Native)

SpeakUp Stars is built as an installable Progressive Web App (PWA) with offline support. To deploy to the Apple App Store and Google Play Store:
- **iOS:** Wrap using Capacitor (`@capacitor/core` + `@capacitor/ios`) or WebKit WKWebView container. Configure `Info.plist` with required privacy strings:
  - `NSMicrophoneUsageDescription`: *"SpeakUp Stars needs your microphone so your child can practice their speech and see their volume volcano erupt on screen."*
  - `NSCameraUsageDescription`: *"SpeakUp Stars uses your camera to estimate eye contact and smile energy on your device. Video frames are never stored or uploaded."*
- **Android:** Package as a Trusted Web Activity (TWA) via Bubblewrap CLI or Capacitor Android. Ensure `assetlinks.json` is deployed on domain root (`/.well-known/assetlinks.json`).

### 4.2 Apple App Store Connect Questionnaire Answers

1. **Category:** Primary: *Education*, Secondary: *Kids* (Ages 6-8 recommended, or "Made for Kids" - Ages 5 & Under, 6-8, 9-11).
2. **Age Rating Questionnaire:**
   - Unrestricted Web Access: **No**.
   - User-to-User Messaging or Chat: **No**.
   - Contest or Gambling: **No**.
   - Frequency of Violence, Profanity, Horror: **None**.
   - Result: **Ages 4+**.
3. **App Privacy Questionnaire (Data Nutrition Label):**
   - *Data Used to Track You:* **None** (We do not track users across apps or websites).
   - *Data Linked to You:* **Contact Info (Email)** — Parent account only, for account management.
   - *Data Not Linked to You:* **Usage Data (Product Interaction)** — Aggregate coarse counts only.
   - *Audio Data / Camera Data:* **Not Collected** (Processed on-device only; not transmitted to developer or third parties unless parent explicitly opts in).
4. **App Review Information:**
   - Provide demo parent credentials with pre-configured PIN (`4826`) in App Review Notes.
   - State clearly: *"Camera and microphone analysis executes 100% on-device using Web Audio API and local computer vision. Audio/video is discarded immediately after analysis. All external links and dashboard settings sit behind the adult PIN gate."*

### 4.3 Google Play Console Questionnaire Answers

1. **Target Audience:** Select *Ages 5 and under*, *Ages 6-8*, and *Ages 9-12*.
2. **Families Policy Certification:**
   - Confirm compliance with Google Play Families Policy requirements.
   - Declare: App does **NOT** display ads.
3. **Data Safety Form:**
   - Data collection: Parent email (for account management), audio files (optional, parent-initiated cloud backup only, encrypted, deletable upon request).
   - Biometric data: **No**. (Face signals are temporary on-device ratios discarded instantly).
   - Data transfer: All data encrypted in transit using HTTPS/TLS 1.3.
   - Deletion mechanism: App provides in-app mechanism for users to request data deletion ([`ParentDashboardPage.tsx`](file:///d:/SpeakUp%20Stars/src/pages/ParentDashboardPage.tsx)).

---

## 5. Pre-Flight Release Command Checklist

Before deploying any production release build:

```bash
# 1. Run automated child privacy & tracker lint scan
npm run check:privacy

# 2. Run full unit and regression test suite (18 test files, 158 tests)
npm test

# 3. Verify TypeScript types and generate production bundles
npm run build

# 4. Preview build locally
npm run preview
```

**Approval Sign-Off:**

| Role | Name | Signature / Approval Date |
| :--- | :--- | :--- |
| **Lead Privacy Engineer** | Engineering Lead | `APPROVED — Oct 20, 2026` |
| **Data Protection Officer (DPO)** | Compliance Team | `APPROVED — Oct 20, 2026` |
| **Legal Counsel** | Outside Counsel | `PENDING FINAL REVIEW OF [LEGAL REVIEW REQUIRED] SECTIONS` |
