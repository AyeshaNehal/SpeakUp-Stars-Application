# Data Breach & Security Incident Response Plan (INCIDENT_RESPONSE.md)

**App:** SpeakUp Stars  
**Target Audience:** Children aged 3–12 & their Parents/Guardians  
**Compliance Frameworks:** COPPA (16 CFR Part 312), GDPR-K (Regulation (EU) 2016/679), UK Data Protection Act, California CCPA/CPRA, and FERPA.  
**Effective Date:** October 19, 2026  
**Document Owner:** Data Protection Officer (DPO) & Information Security Team  

---

## 1. Executive Summary & Core Principles

SpeakUp Stars maintains an uncompromising standard for child privacy and security:
1. **Zero Biometrics at Rest:** Video frames, face meshes, landmarks, embeddings, and voiceprints are processed strictly in ephemeral browser memory and discarded immediately (~2 fps). They are never written to disk or transmitted to servers.
2. **Strict Data Minimization:** Child accounts require only a nickname and an age band (`3-5`, `6-8`, `9-12`). Full names, emails, birthdays, schools, phone numbers, and addresses are strictly rejected.
3. **Data Redaction (PII Scrubber):** Every transcript is sanitized with brackets (e.g. `[NAME]`, `[SCHOOL]`, `[CITY]`) before storage.
4. **Immediate Parent Notification:** Because our users are vulnerable young children, our incident response prioritizes immediate containment, full transparency to parents, and regulatory reporting well within statutory deadlines.

---

## 2. Severity Classification Matrix

| Level | Severity | Definition | Examples | Maximum Notification SLA |
| :--- | :--- | :--- | :--- | :--- |
| **P1** | **Critical** | Confirmed unauthorized access to private storage, child transcripts, or parent account credentials affecting multiple families. | Compromised database service key, exposed S3/Supabase storage bucket, unauthorized bulk export. | **Regulators:** $\le 72$ hours (GDPR)<br>**Parents:** $\le 24$ hours |
| **P2** | **Major** | Anomaly or security failure affecting single tenant or isolated system with potential PII exposure. | Rate limiter failure on single PIN endpoint, single-session token replay, credential stuffing alert. | **Regulators:** $\le 72$ hours (if risk to rights)<br>**Parents:** $\le 48$ hours |
| **P3** | **Minor / Contained** | Localized security anomaly, failed exploit attempt, or internal safeguard trip without data exfiltration. | Single child safety distress keyword trip, failed brute force lockout, automated scanner probe blocked by WAF. | Documented in internal audit log; no parent disclosure required. |

---

## 3. Incident Response Lifecycle (6 Phases)

```
[Phase 1: DETECT] ──► [Phase 2: CONTAIN] ──► [Phase 3: ASSESS] ──► [Phase 4: NOTIFY] ──► [Phase 5: RECOVER] ──► [Phase 6: POST-MORTEM]
```

### Phase 1: Detect & Identify
- **Automated Detection Systems:**
  - Database access anomalies via `admin_audit_logs`.
  - Rate limiting threshold breaches (Auth & PIN lockouts).
  - PII scrubber integrity alerts (automated canary sentence detection).
  - Web Application Firewall (WAF) triggers and CSP violation reports.
- **Reporting Inlets:**
  - Parent or security researcher disclosures (`security@speakupstars.local`).
  - Automated dependency vulnerability alerts (Dependabot / npm audit).
- **First Responder Action:**
  - Create incident ticket: `INC-YYYYMMDD-XX`.
  - Designate Incident Commander (IC) and Lead Technical Investigator.

### Phase 2: Contain & Isolate (Target: $\le 60$ Minutes)
- **Immediate Containment Actions:**
  1. **Credential & Key Invalidation:** Revoke and rotate compromised Supabase anon keys, service keys, or database passwords immediately.
  2. **Session Termination:** Invalidate all active parent JWT sessions and cookies (`auth.signout_all()`).
  3. **Storage Lock:** If media storage is compromised, immediately revoke all signed URLs and switch private buckets to read-disabled state.
  4. **Circuit Breaker:** Temporarily freeze outbound AI feedback calls and external webhooks.
  5. **Forensic Snapshot:** Preserve server logs, database transaction logs, and `admin_audit_logs` before rebooting or rolling back instances.

### Phase 3: Assess & Investigate
- **Key Assessment Questions:**
  1. *Was child data accessed?* (Transcripts, audio recordings, nicknames).
  2. *Was parent account data compromised?* (Emails, hashed PINs, consent records).
  3. *Are biometric signals involved?* (Verify zero biometric persistence guard — confirm no video frames or face embeddings exist on disk).
  4. *What was the exact blast radius?* (List of affected Family IDs and Child Profile IDs).

### Phase 4: Mandatory Regulatory & Parent Notifications

#### A. Regulatory Notification ($\le 72$ Hours under GDPR Art. 33 / COPPA)
- **European Authorities (EU/UK GDPR):**
  - Notify Lead Supervisory Authority (e.g., Irish DPC, UK ICO, French CNIL) within **72 hours** of becoming aware of the breach.
  - Notification details: Nature of breach, categories of records, number of affected data subjects (highlighting children), DPO contact details, likely consequences, and remediation measures taken.
- **US Federal Trade Commission (FTC) & State AGs:**
  - Notify FTC under COPPA compliance guidelines and applicable State Attorneys General (e.g., California AG under CCPA/CPRA).

#### B. Direct Parent & Guardian Notification ($\le 24$ to $48$ Hours)
- Sent via email to verified parent account holders (`parent.email`).
- Written in clear, plain, reassuring language (no confusing legalese).

```markdown
Subject: Important Security Update Regarding Your SpeakUp Stars Account

Dear [Parent Name / Guardian],

We are writing to inform you of a security incident that occurred on [Date] affecting SpeakUp Stars. 
We take the safety and privacy of your family with the utmost seriousness, and we are providing 
this notification immediately with full transparency.

What Happened:
On [Date] at [Time], our security monitoring detected [brief, plain-language description of incident].

What Information Was Involved:
- Involved: [e.g. Practice session topics, child nickname, scrubbed transcript].
- CRUCIAL SAFETY CONFIRMATION: No real full names, home addresses, phone numbers, schools, 
  or credit card numbers were involved.
- ZERO BIOMETRIC DATA: SpeakUp Stars NEVER stores video footage, face models, or voiceprints. 
  No biometric information was accessed or stored.

What We Have Done:
1. We immediately contained the issue within [X] minutes by [containment actions].
2. We revoked all active sessions and rotated all security credentials.
3. We have reported this matter to the relevant data protection authorities.

What You Should Do:
- When you next log into the Grown-Up Zone, you will be prompted to reset your Parent PIN.
- You can review and delete any practice session or delete your entire account at any time 
  directly from your Parent Dashboard under "Privacy & Data".

For any questions, our Data Protection Officer is available directly at dpo@speakupstars.local.

Sincerely,
The SpeakUp Stars Safety & Security Team
```

### Phase 5: Recovery & Eradication
- Patch root vulnerability in source code or infrastructure.
- Execute full test suite (`npm test`) and automated privacy checks (`npm run check:privacy`).
- Verify complete row-level security policy enforcement across all database tables.
- Deploy fix via clean CI/CD pipeline.
- Restore systems to normal operating state with elevated monitoring for 14 days.

### Phase 6: Post-Incident Review & Permanent Documentation
- Conduct blameless post-mortem within 5 business days of incident resolution.
- Archive complete incident dossier (chronology, forensic evidence, correspondence, root cause analysis, action items).
- Review and update `INCIDENT_RESPONSE.md` and automated security test suites to prevent regression.

---

## 4. Key Incident Response Contacts

- **Security Lead & Incident Commander:** `security@speakupstars.local`
- **Data Protection Officer (DPO):** `dpo@speakupstars.local`
- **Parent Inquiries & Support:** `parents@speakupstars.local`
- **Emergency Escalation Hotline:** +1 (800) 555-SPARK (Internal Use Only)
