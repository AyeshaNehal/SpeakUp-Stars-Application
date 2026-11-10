# 🛡️ SpeakUp Stars – Child Privacy Rules & Safety Architecture

> **MANDATORY POLICY**: These 6 rules govern the entire SpeakUp Stars codebase and must be strictly followed in every current and future feature, pull request, and refactoring step.

---

## 1. Data Minimization
- **Permitted Data Collection**:
  - Nickname only (e.g., "Leo", "StarExplorer")
  - Age band only: `3-5`, `6-8`, or `9-12`
  - Visual avatar choices (emojis, in-app cartoon avatars)
  - Numeric session metrics (e.g., speaking duration in seconds, star points earned, practice streak count)
- **Strictly Prohibited**:
  - Never collect real full names, birth dates, personal photos, school names, home/school addresses, phone numbers, email addresses, or precise GPS/location from child accounts.
  - No free-form personal profile bios that encourage sharing contact or identifiable information.

---

## 2. On-Device Media Processing
- **Audio & Video**:
  - Audio and video analysis (volume level, cadence, speech pitch, voice activity detection) must be computed **on-device** using Web Audio API and local browser models wherever technically feasible.
  - Raw audio or video recordings must remain stored in local client storage (IndexedDB/CacheStorage) by default.
  - Raw media **must never** be transmitted to an external server or cloud storage unless an authenticated parent/guardian has explicitly opted in with verified consent.

---

## 3. Zero Ads, Zero Trackers, Zero Behavioral Fingerprinting
- **Forbidden Technologies**:
  - No ad networks or monetization SDKs (e.g., Google AdSense, DoubleClick, Criteo).
  - No behavioral analytics or cross-site tracking SDKs (e.g., Google Analytics / Tag Manager, Facebook Pixel / Meta Events, Hotjar, Mixpanel, Amplitude, FullStory, Microsoft Clarity).
  - No device or browser canvas/audio fingerprinting tools (e.g., FingerprintJS).
  - No social media login SDKs (e.g., Facebook SDK, TikTok SDK) on child accounts.
- **Enforcement**:
  - Automated CI script (`scripts/check-privacy.js`) scans `package.json`, `index.html`, and all source code during builds, blocking the build if any forbidden tracker or ad signature is detected.

---

## 4. No Social Interactions or User-to-User Messaging
- SpeakUp Stars is a personal speech practice tool, not a social network.
- **Strictly Prohibited**:
  - No live chat, open comments, or direct messaging between users.
  - No public search directories or searchable user lists.
  - No friend requests, following, or peer-to-peer sharing.
  - Child profiles and voice recordings are private to the child and their parent/guardian.

---

## 5. Child Data Privacy Documentation in Code
- Every feature or component that handles, caches, or manipulates child-related data must include a standard documentation comment:
  ```ts
  /**
   * CHILD PRIVACY NOTE:
   * - Data used: [e.g. Nickname, selected avatar, numeric duration]
   * - Purpose: [e.g. To display greeting and calculate daily speech goal]
   * - Retention: [e.g. Local browser session / LocalStorage until cleared by parent]
   */
  ```

---

## 6. Secrets & API Keys Protection
- All API keys, cloud secrets, tokens, and backend credentials must stay strictly server-side in secure environment variables.
- Secrets must never be committed to repository code, exposed in client-side bundles, embedded in query parameters, or logged in client-side console logs.
- Client requests needing secure backend capabilities must proxy through secure server-side endpoints.

---

## 7. Privacy-Safe Logging & Log Scrubber
- Implemented in [`src/services/logger.ts`](file:///d:/SpeakUp%20Stars/src/services/logger.ts).
- All console messages, runtime exceptions, and unhandled promise rejections pass through `scrubPayload()` and `scrubText()`.
- Automatically redacts:
  - Speech transcripts & prompt text (`[REDACTED_TRANSCRIPT]`)
  - Authentication tokens, API keys & JWTs (`[REDACTED_TOKEN]`, `[REDACTED_JWT]`, `[REDACTED_SECRET]`)
  - Audio and video base64 blobs (`[REDACTED_MEDIA_BLOB]`)
  - Email addresses (`[REDACTED_EMAIL]`)
  - IP addresses (`[REDACTED_IP]`)

---

## 8. Cookieless, Aggregate-Only Analytics
- Implemented in [`src/services/analytics.ts`](file:///d:/SpeakUp%20Stars/src/services/analytics.ts).
- **Zero user IDs, zero IP tracking, zero session cookies, zero device fingerprinting**.
- Only tracks anonymous coarse event counts (e.g., `wheel_spun`, `recording_finished`).
- Defaults to purely on-device local storage counters (`speakup_aggregate_metrics_v1`).
- If an optional self-hosted endpoint is provided via `VITE_PRIVACY_METRICS_ENDPOINT`, requests are sent with `credentials: 'omit'` (no cookies/credentials) carrying only `{ event, date: 'YYYY-MM-DD' }`.

---

## 🌐 External Network Request Audit (Complete List)

Every external network request made by the web application has been audited and cataloged below:

| Destination / Domain | Purpose | Protocol / Method | Credentials / Cookies | Data Transmitted |
| :--- | :--- | :--- | :--- | :--- |
| `https://fonts.googleapis.com` | Downloads font stylesheet definitions for **Fredoka** & **Nunito** | `HTTPS GET` | **None** (`crossorigin="anonymous"`) | None (Standard browser font request) |
| `https://fonts.gstatic.com` | Downloads font binary files (`.woff2`) | `HTTPS GET` | **None** (`crossorigin="anonymous"`) | None (Cached font files) |
| `self` (`origin`) | Application bundles, PWA web manifest, Service Worker (`sw.js`), local assets | `HTTP(S) GET` | Same-origin | None |
| *(Optional Self-Hosted)* `VITE_PRIVACY_METRICS_ENDPOINT` | Optional aggregate count sync to self-hosted server | `HTTPS POST` | **Strictly Omitted** (`credentials: 'omit'`) | Aggregate event name + coarse date string only |

> **Audit Guarantee**: The application makes **ZERO** requests to ad networks, social SDKs, third-party analytics (Google, Meta, Hotjar, Mixpanel, Amplitude, etc.), or geolocation/fingerprinting providers.

---

## 🔒 Verification & Compliance Command
To run the automated tracker and child privacy validation check locally:
```bash
npm run check:privacy
```
This check is also automatically enforced during `npm run build`.
