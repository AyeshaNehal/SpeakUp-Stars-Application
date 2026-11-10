/**
 * TERMS OF USE & ESSENTIAL STORAGE NOTICE
 * 
 * ============================================================================
 * /* LEGAL REVIEW REQUIRED:
 * A qualified attorney specializing in youth consumer protection and digital safety
 * must review and approve these Terms of Use and Storage Disclosures prior to public launch.
 * ============================================================================
 */

import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  HardDrive,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import {
  CURRENT_POLICY_VERSION,
  POLICY_LAST_UPDATED,
} from '../../services/legal/policyVersionService';

export const TermsOfUsePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll to #storage anchor if requested in hash
  useEffect(() => {
    if (location.hash === '#storage') {
      const el = document.getElementById('storage-notice');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location.hash]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 select-text">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-800 to-indigo-900 p-6 sm:p-10 text-white shadow-xl space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-mono font-bold">
            <span>Version {CURRENT_POLICY_VERSION}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs">
            <span>Effective: {POLICY_LAST_UPDATED}</span>
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-heading font-black tracking-tight">
          Terms of Use &amp; Storage Notice 📜
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-2xl font-medium leading-relaxed">
          Welcome to SpeakUp Stars. These terms explain the rules for using our platform, our
          zero-ad promise, and our essential-only storage policy.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            icon={<HardDrive className="w-4 h-4 text-emerald-400" />}
            onClick={() => {
              const el = document.getElementById('storage-notice');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Jump to Storage Notice
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            onClick={() => navigate('/privacy')}
          >
            Parent Privacy Policy
          </Button>
        </div>
      </div>

      {/* Legal Review Required Notice */}
      <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-xs sm:text-sm text-amber-950 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-heading font-bold">Attorney Review Notice</p>
          <p className="text-amber-900/90 leading-relaxed">
            /* LEGAL REVIEW REQUIRED: A qualified attorney must review these Terms of Use and Storage
            Notice before commercial launch. */
          </p>
        </div>
      </div>

      {/* Plain Language Terms Sections */}
      <div className="space-y-6">
        {/* Term 1 */}
        <div className="p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-xs space-y-2">
          <h2 className="text-lg sm:text-xl font-heading font-black text-slate-900 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center text-sm font-black">
              1
            </span>
            <span>Who Can Use SpeakUp Stars (Parent Supervision)</span>
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            SpeakUp Stars is designed for children aged 3 to 12. To protect young learners, an account
            must be created and administered by a parent, legal guardian, or authorized educator.
            Parents maintain full control over settings, privacy choices, and session history behind a
            PIN gate.
          </p>
        </div>

        {/* Term 2 */}
        <div className="p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-xs space-y-2">
          <h2 className="text-lg sm:text-xl font-heading font-black text-slate-900 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center text-sm font-black">
              2
            </span>
            <span>No Advertising, No Microtransactions, No Data Selling</span>
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            We pledge a clean, safe, and commercial-free sanctuary for young children:
          </p>
          <ul className="list-disc list-inside text-sm text-slate-700 space-y-1 pl-2">
            <li><strong>Zero Commercial Ads:</strong> We never display banner ads, popups, or sponsored promotional content.</li>
            <li><strong>No Real-Money Purchases for Children:</strong> All shop items, mascot accessories, and hats are unlocked purely through speech practice Star Points. There is no credit card input in child mode.</li>
            <li><strong>Zero Sale of Personal Data:</strong> We never sell, rent, trade, or monetize child voice recordings or transcripts.</li>
          </ul>
        </div>

        {/* Term 3 */}
        <div className="p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-xs space-y-2">
          <h2 className="text-lg sm:text-xl font-heading font-black text-slate-900 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center text-sm font-black">
              3
            </span>
            <span>Educational Nature &amp; Speech Disclaimer</span>
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            SpeakUp Stars is a playful, gamified speech practice and self-confidence tool. <strong>It is
            NOT medical software, diagnostic healthcare, or speech-language pathology therapy.</strong> It
            should never replace professional speech evaluation or individualized clinical therapy from a
            licensed medical practitioner.
          </p>
        </div>

        {/* Term 4 */}
        <div className="p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-xs space-y-2">
          <h2 className="text-lg sm:text-xl font-heading font-black text-slate-900 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center text-sm font-black">
              4
            </span>
            <span>Kindness &amp; Acceptable Speaking Environment</span>
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            SpeakUp Stars provides a kind, uplifting space. We strictly prohibit utilizing the software to
            generate or input harmful, abusive, hateful, or sexually explicit content. If speech input
            indicates distress or harm, our safety guardrails will offer gentle reassurance and alert the
            parent quietly in the dashboard without alarming the child.
          </p>
        </div>

        {/* Term 5 */}
        <div className="p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-xs space-y-2">
          <h2 className="text-lg sm:text-xl font-heading font-black text-slate-900 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center text-sm font-black">
              5
            </span>
            <span>Account Termination &amp; Complete Data Erasure</span>
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            Parents can close their family account at any time through the Parent Dashboard. Upon account
            deletion, all child progress, points, and transcripts are permanently and irreversibly purged
            from our servers in compliance with COPPA and GDPR-K.
          </p>
        </div>
      </div>

      {/* DEDICATED STORAGE NOTICE SECTION */}
      <div
        id="storage-notice"
        className="rounded-3xl border-3 border-emerald-400 bg-gradient-to-br from-emerald-50 via-teal-50 to-white p-6 sm:p-8 shadow-md space-y-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-heading font-black text-emerald-800 uppercase tracking-wider">
              Transparency Disclosure
            </span>
            <h2 className="text-2xl font-heading font-black text-slate-900">
              Essential Storage Notice 💾
            </h2>
          </div>
        </div>

        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-xs space-y-2">
            <p className="font-heading font-bold text-emerald-950 text-base flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>We Use ONLY Essential Local Storage. No Tracking Cookies!</span>
            </p>
            <p className="text-slate-600 text-xs sm:text-sm">
              SpeakUp Stars does <strong>NOT use third-party tracking cookies, advertising beacons, or marketing pixels</strong>.
              Under ePrivacy and GDPR rules, the browser storage we use is strictly categorized as
              <strong> &quot;Technically Essential&quot;</strong> to operate the application and safeguard child privacy.
            </p>
          </div>

          <h3 className="font-heading font-black text-slate-900 text-base pt-2">
            What We Store in Your Device’s Local Browser Storage:
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
              <p className="font-heading font-bold text-slate-900 text-xs sm:text-sm">1. Parent PIN Hash</p>
              <p className="text-xs text-slate-600">
                A cryptographic bcrypt/argon2 hash of your 4-digit Parent PIN so only you can access the Parent Dashboard.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
              <p className="font-heading font-bold text-slate-900 text-xs sm:text-sm">2. Language &amp; RTL Preference</p>
              <p className="text-xs text-slate-600">
                Saves your chosen language (English, Urdu, Arabic, Hindi, or Spanish) so the UI stays in your language.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
              <p className="font-heading font-bold text-slate-900 text-xs sm:text-sm">3. Accessibility Settings</p>
              <p className="text-xs text-slate-600">
                Persists your preferences for Dyslexia-friendly font, high contrast, text scaling, speech rate, and calm audio.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
              <p className="font-heading font-bold text-slate-900 text-xs sm:text-sm">4. Active Child Profile &amp; Points</p>
              <p className="text-xs text-slate-600">
                Tracks your child&apos;s nickname, mascot color, star points, and daily streak locally so practice works offline.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
              <p className="font-heading font-bold text-slate-900 text-xs sm:text-sm">5. Policy Consent Version</p>
              <p className="text-xs text-slate-600">
                Records which version of this privacy policy was accepted, ensuring we re-prompt you only when terms update.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
              <p className="font-heading font-bold text-slate-900 text-xs sm:text-sm">6. Sound FX &amp; Music Mute</p>
              <p className="text-xs text-slate-600">
                Remembers if you prefer sound effects or background music enabled or muted.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-100 text-xs text-slate-600">
            <strong>How to Clear Local Storage:</strong> You can wipe this local storage at any time through your
            browser settings (under &quot;Clear Browsing Data / Local Storage&quot;) or by clicking &quot;Delete All Data&quot;
            inside the Parent Dashboard.
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-slate-100 border border-slate-200">
        <span className="text-xs sm:text-sm text-slate-600 text-center sm:text-left">
          Questions regarding these terms? Contact our team directly.
        </span>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/privacy')}>
            Parent Privacy Policy 📋
          </Button>
          <Button variant="coral" size="sm" onClick={() => navigate('/kids-privacy')}>
            Sparky&apos;s Kid Guide 🦖
          </Button>
        </div>
      </div>
    </div>
  );
};
