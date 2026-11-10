/**
 * PARENT PRIVACY POLICY (Plain Language Edition)
 * 
 * ============================================================================
 * /* LEGAL REVIEW REQUIRED:
 * A qualified children's digital privacy attorney must review and approve this
 * document, vendor list, and consent verification flow prior to commercial deployment
 * in compliance with FTC COPPA Rule (16 CFR Part 312), EU/UK GDPR-K, and California AADC.
 * ============================================================================
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Eye,
  Trash2,
  Download,
  AlertTriangle,
  Mail,
  MapPin,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import {
  CURRENT_POLICY_VERSION,
  POLICY_LAST_UPDATED,
  DPO_CONTACT_EMAIL,
  DPO_MAILING_ADDRESS,
  AUTHORIZED_VENDORS,
} from '../../services/legal/policyVersionService';

export const ParentPrivacyPolicyPage: React.FC = () => {
  const navigate = useNavigate();
  const [openSection, setOpenSection] = useState<string | null>('collect');

  const toggleSection = (id: string) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 select-text">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 p-6 sm:p-10 text-white shadow-xl">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-heading font-black">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>COPPA &amp; GDPR-K Compliant</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white/90 text-xs font-mono font-bold">
              <span>Version {CURRENT_POLICY_VERSION}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white/90 text-xs font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>Last Updated: {POLICY_LAST_UPDATED}</span>
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black tracking-tight drop-shadow-xs">
            Parent Privacy Policy 📋
          </h1>
          <p className="text-base sm:text-lg text-sky-100 max-w-2xl font-medium leading-relaxed">
            Written in plain, straightforward language for parents and guardians. We protect your
            child’s voice, identity, and imagination with military-grade privacy and zero commercial
            tracking.
          </p>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/30"
              icon={<Sparkles className="w-4 h-4 text-amber-300" />}
              onClick={() => navigate('/kids-privacy')}
            >
              See Kid-Friendly Version (with Sparky!)
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/30"
              icon={<Lock className="w-4 h-4 text-sky-200" />}
              onClick={() => navigate('/parent')}
            >
              Manage Privacy in Parent Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Legal Review Notice Badge */}
      <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 sm:p-5 flex items-start gap-3.5 text-amber-900 shadow-xs">
        <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm space-y-1">
          <p className="font-heading font-black text-amber-950">
            Official Legal Transparency &amp; Attorney Review Notice
          </p>
          <p className="text-amber-900/90 leading-relaxed">
            /* LEGAL REVIEW REQUIRED: A qualified children&apos;s digital privacy attorney must review
            and approve this document and verified parental consent flows prior to production deployment
            under 16 CFR Part 312 (COPPA), EU GDPR-K (Article 8), and state age-appropriate design codes. */
          </p>
        </div>
      </div>

      {/* Main Accordion / Content Sections */}
      <div className="space-y-4">
        {/* Section 1: What We Collect */}
        <div className="rounded-2xl border-2 border-slate-200 bg-white overflow-hidden shadow-xs">
          <button
            onClick={() => toggleSection('collect')}
            className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700 font-black">
                1
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-heading font-black text-slate-900">
                  What We Collect (And What We NEVER Collect)
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Microphone audio, facial feedback, child nicknames, and speaking stats
                </p>
              </div>
            </div>
            {openSection === 'collect' ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {openSection === 'collect' && (
            <div className="px-5 pb-6 sm:px-6 pt-2 border-t border-slate-100 space-y-4 text-sm text-slate-700 leading-relaxed">
              <p>
                We believe in <strong>radical data minimization</strong>. We only collect the bare minimum
                information necessary to help your child practice speaking with confidence:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                  <h3 className="font-heading font-black text-emerald-950 flex items-center gap-1.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>What We Process:</span>
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-emerald-900 text-xs sm:text-sm">
                    <li><strong>Child Nickname &amp; Age Band:</strong> E.g. &quot;Leo&quot;, age &quot;6-8&quot;. Never full names.</li>
                    <li><strong>Temporary Voice Audio:</strong> Streamed into device RAM to measure volume, pace, and clarity.</li>
                    <li><strong>Real-time Smile/Eye-Contact:</strong> Estimated on-device at ~2fps and immediately deleted.</li>
                    <li><strong>Scrubbed Transcripts:</strong> Text of the speech with all names, locations, and personal info stripped out.</li>
                    <li><strong>Speaking Milestones:</strong> Star points, streak days, and fun badges earned.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                  <h3 className="font-heading font-black text-rose-950 flex items-center gap-1.5 text-sm">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>What We NEVER Collect:</span>
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-rose-900 text-xs sm:text-sm">
                    <li><strong>NO Biometric Identifiers:</strong> Zero voiceprints, face templates, or facial geometry.</li>
                    <li><strong>NO Full Names or Real IDs:</strong> We never request child birth certificates or SSNs.</li>
                    <li><strong>NO Precise Geolocation:</strong> Zero GPS tracking or home address collection.</li>
                    <li><strong>NO Contacts or Chat Messages:</strong> Zero social features, friend requests, or open forums.</li>
                    <li><strong>NO Advertising Cookies:</strong> Zero cross-site tracking or advertising profiling.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Why We Collect It */}
        <div className="rounded-2xl border-2 border-slate-200 bg-white overflow-hidden shadow-xs">
          <button
            onClick={() => toggleSection('why')}
            className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-black">
                2
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-heading font-black text-slate-900">
                  Why We Process This Information
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Coaching, progress milestones, and parent dashboard insights
                </p>
              </div>
            </div>
            {openSection === 'why' ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {openSection === 'why' && (
            <div className="px-5 pb-6 sm:px-6 pt-2 border-t border-slate-100 space-y-3 text-sm text-slate-700 leading-relaxed">
              <p>We process child speech data solely for the following strictly educational purposes:</p>
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="font-heading font-bold text-slate-900">1. Instant Speaking Growth Feedback</p>
                  <p className="text-xs sm:text-sm text-slate-600">
                    To show the child an encouraging &quot;Brave Voice&quot; meter and 3 positive things they did great
                    plus 1 gentle tip to try next time.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="font-heading font-bold text-slate-900">2. Motivation &amp; Mascot Gamification</p>
                  <p className="text-xs sm:text-sm text-slate-600">
                    To award Star Points, track daily streaks (with generous streak freezes), and unlock cute mascot accessories
                    in the Rewards Shop (zero real-money transactions).
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="font-heading font-bold text-slate-900">3. Parent Peace of Mind</p>
                  <p className="text-xs sm:text-sm text-slate-600">
                    To let parents see skill growth trends (volume, pace, clarity) in the PIN-protected Parent Dashboard.
                  </p>
                </div>
              </div>
              <p className="text-xs font-semibold text-slate-500 italic pt-1">
                We NEVER sell, rent, monetize, or license any child or family information to third parties, advertisers, or data brokers.
              </p>
            </div>
          )}
        </div>

        {/* Section 3: Who Processes It (Vendor Disclosures) */}
        <div className="rounded-2xl border-2 border-slate-200 bg-white overflow-hidden shadow-xs">
          <button
            onClick={() => toggleSection('vendors')}
            className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 font-black">
                3
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-heading font-black text-slate-900">
                  Who Processes It (Authorized Service Vendors)
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Complete list of third-party processors and zero-retention commitments
                </p>
              </div>
            </div>
            {openSection === 'vendors' ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {openSection === 'vendors' && (
            <div className="px-5 pb-6 sm:px-6 pt-2 border-t border-slate-100 space-y-4 text-sm text-slate-700 leading-relaxed">
              <p>
                Under FTC COPPA Rule § 312.4, we list every subprocessor that receives any portion of service data.
                We maintain legally binding Data Processing Agreements (DPAs) with strict zero-data-retention clauses:
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-slate-900 font-heading font-bold">
                      <th className="p-3">Vendor / Processor</th>
                      <th className="p-3">Role &amp; Function</th>
                      <th className="p-3">Data Shared</th>
                      <th className="p-3">Retention Policy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {AUTHORIZED_VENDORS.map((v) => (
                      <tr key={v.name} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900 whitespace-nowrap">{v.name}</td>
                        <td className="p-3 text-slate-600">{v.role}</td>
                        <td className="p-3 text-slate-700 font-medium">{v.dataSent}</td>
                        <td className="p-3 text-emerald-800 font-semibold">{v.dataRetained}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900">
                <strong>Zero AI Model Training Guarantee:</strong> Our AI contracts explicitly stipulate that child speech transcripts
                are NEVER stored on LLM servers and NEVER used to train, fine-tune, or improve general AI models.
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Retention Schedule */}
        <div className="rounded-2xl border-2 border-slate-200 bg-white overflow-hidden shadow-xs">
          <button
            onClick={() => toggleSection('retention')}
            className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 font-black">
                4
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-heading font-black text-slate-900">
                  How Long We Keep Your Data (Retention Schedule)
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Automatic purges, ephemeral in-memory video, and 30-day recording limits
                </p>
              </div>
            </div>
            {openSection === 'retention' ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {openSection === 'retention' && (
            <div className="px-5 pb-6 sm:px-6 pt-2 border-t border-slate-100 space-y-3 text-sm text-slate-700 leading-relaxed">
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Live Camera Video &amp; Face Frames:</strong> Kept for <strong>0 seconds</strong>. Processed in ephemeral
                    RAM and destroyed immediately after smile/eye-contact scoring.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Practice Audio Recordings (Optional):</strong> Default is <strong>never stored</strong>. If parent explicitly
                    opts in via Verified Consent, stored for a maximum of <strong>30 days</strong> before an automated daily purge job
                    deletes them permanently.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Child Practice Scores &amp; Transcripts:</strong> Retained in encrypted database until parent initiates
                    a deletion request or terminates their family account.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Security Audit Logs:</strong> Maintained for 12 months for COPPA compliance (contains zero child speech or audio).
                  </span>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Section 5: Parent & Child Rights */}
        <div className="rounded-2xl border-2 border-slate-200 bg-white overflow-hidden shadow-xs">
          <button
            onClick={() => toggleSection('rights')}
            className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-black">
                5
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-heading font-black text-slate-900">
                  Parent and Child Rights (COPPA &amp; GDPR-K)
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Review data, revoke consent, download exports, and delete everything
                </p>
              </div>
            </div>
            {openSection === 'rights' ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {openSection === 'rights' && (
            <div className="px-5 pb-6 sm:px-6 pt-2 border-t border-slate-100 space-y-4 text-sm text-slate-700 leading-relaxed">
              <p>Under COPPA § 312.6 and GDPR-K Article 17, parents hold absolute authority over child data:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-heading font-bold text-slate-900 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-sky-600" />
                    <span>Right to Inspect</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Review every speech topic, date, metric score, and scrubbed transcript in the Parent Dashboard at any time.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-heading font-bold text-slate-900 flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-emerald-600" />
                    <span>Right to Portability</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Download your child’s complete learning history in structured JSON and CSV format with one click.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-heading font-bold text-slate-900 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-amber-600" />
                    <span>Right to Revoke Consent</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Turn off recording storage, face feedback, or email notifications anytime. Changes take effect instantly.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-heading font-bold text-slate-900 flex items-center gap-1.5">
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span>Right to Total Erasure</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Delete a single session, delete all child records, or delete the entire family account permanently.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 6: How to Delete Data */}
        <div className="rounded-2xl border-2 border-slate-200 bg-white overflow-hidden shadow-xs">
          <button
            onClick={() => toggleSection('delete')}
            className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700 font-black">
                6
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-heading font-black text-slate-900">
                  How to Delete Your Data (Step-by-Step)
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Instant self-serve deletion behind your secure Parent PIN
                </p>
              </div>
            </div>
            {openSection === 'delete' ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {openSection === 'delete' && (
            <div className="px-5 pb-6 sm:px-6 pt-2 border-t border-slate-100 space-y-3 text-sm text-slate-700 leading-relaxed">
              <ol className="list-decimal list-inside space-y-2 text-slate-700 text-xs sm:text-sm">
                <li>Navigate to the <strong>Parent Dashboard</strong> (lock icon in header or footer).</li>
                <li>Enter your secure <strong>Parent PIN</strong>.</li>
                <li>Scroll down to the <strong>Privacy &amp; Data</strong> section.</li>
                <li>
                  Choose your deletion scope:
                  <ul className="list-disc list-inside pl-5 pt-1 space-y-1 text-slate-600">
                    <li><strong>&quot;Delete One Session&quot;</strong> — removes selected session and audio.</li>
                    <li><strong>&quot;Delete All of This Child&apos;s Data&quot;</strong> — wipes all speeches, points, and transcripts.</li>
                    <li><strong>&quot;Delete My Whole Account&quot;</strong> — permanently purges parent account, login credentials, and all children.</li>
                  </ul>
                </li>
                <li>Confirm with your Parent PIN. Deletions complete instantly and a confirmation receipt is emailed.</li>
              </ol>
            </div>
          )}
        </div>

        {/* Section 7: Security Breach Response */}
        <div className="rounded-2xl border-2 border-slate-200 bg-white overflow-hidden shadow-xs">
          <button
            onClick={() => toggleSection('breach')}
            className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700 font-black">
                7
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-heading font-black text-slate-900">
                  How We Handle Security Breaches
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  72-hour notifications, automatic containment, and incident response plan
                </p>
              </div>
            </div>
            {openSection === 'breach' ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {openSection === 'breach' && (
            <div className="px-5 pb-6 sm:px-6 pt-2 border-t border-slate-100 space-y-3 text-sm text-slate-700 leading-relaxed">
              <p>
                In accordance with our formal <code>INCIDENT_RESPONSE.md</code> protocol, in the unlikely event
                of a verified security breach affecting child or parent data:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-slate-700">
                <li><strong>Immediate Containment:</strong> Systems and keys are rotated within 60 minutes of detection.</li>
                <li><strong>Regulatory Notice:</strong> We notify the FTC and relevant Data Protection Authorities within <strong>72 hours</strong>.</li>
                <li><strong>Parent Notification:</strong> We directly email all impacted parent accounts with plain-language explanations of what occurred and immediate protective actions taken.</li>
                <li><strong>No Child Contact:</strong> We never attempt to communicate security incidents directly to children.</li>
              </ul>
            </div>
          )}
        </div>

        {/* Section 8: How to Contact Us */}
        <div className="rounded-2xl border-2 border-slate-200 bg-white overflow-hidden shadow-xs">
          <button
            onClick={() => toggleSection('contact')}
            className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700 font-black">
                8
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-heading font-black text-slate-900">
                  How to Contact Our Data Protection Officer (DPO)
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Direct inquiries, privacy questions, and formal legal notices
                </p>
              </div>
            </div>
            {openSection === 'contact' ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {openSection === 'contact' && (
            <div className="px-5 pb-6 sm:px-6 pt-2 border-t border-slate-100 space-y-3 text-sm text-slate-700 leading-relaxed">
              <p>We welcome questions and feedback from parents, educators, and regulators:</p>
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2 text-slate-800">
                  <Mail className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>
                    <strong>DPO Privacy Email:</strong>{' '}
                    <a href={`mailto:${DPO_CONTACT_EMAIL}`} className="text-sky-600 underline font-semibold">
                      {DPO_CONTACT_EMAIL}
                    </a>
                  </span>
                </div>
                <div className="flex items-start gap-2 text-slate-800">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Postal Address:</strong> {DPO_MAILING_ADDRESS}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation Shortcut */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-slate-100 border border-slate-200">
        <div className="text-xs sm:text-sm text-slate-600 text-center sm:text-left">
          Have a question about what your child sees? Check our kid-friendly version!
        </div>
        <div className="flex items-center gap-3">
          <Button variant="coral" size="sm" onClick={() => navigate('/kids-privacy')}>
            Sparky&apos;s Kid Guide 🦖
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/terms')}>
            Terms &amp; Storage Notice 📄
          </Button>
        </div>
      </div>
    </div>
  );
};
