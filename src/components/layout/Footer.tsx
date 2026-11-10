/**
 * GLOBAL RESPONSIVE APPLICATION FOOTER
 * 
 * - Includes plain-language links to:
 *   - Parent Privacy Policy (/privacy)
 *   - Kid's Privacy Guide (/kids-privacy)
 *   - Terms of Use & Essential Storage Notice (/terms)
 *   - Parents Area (/parent)
 * - COPPA & GDPR-K Compliance badge
 * - Supports all 5 languages and RTL layouts
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Lock, Sparkles, HardDrive, FileText } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { CURRENT_POLICY_VERSION } from '../../services/legal/policyVersionService';

export const Footer: React.FC = () => {
  const { t } = useI18n();
  const location = useLocation();

  // Hide footer during full-screen camera recording or 3D games to avoid distraction
  const isImmersiveScreen =
    location.pathname === '/record' ||
    location.pathname === '/games/volcano';

  if (isImmersiveScreen) {
    return null;
  }

  return (
    <footer className="w-full bg-slate-900 text-slate-300 py-8 px-4 sm:px-6 lg:px-8 border-t border-slate-800 text-xs sm:text-sm select-none">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand & Mission Statement */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-1.5 max-w-sm">
          <div className="flex items-center gap-2 text-white font-heading font-black text-base">
            <span className="text-xl">⭐</span>
            <span>SpeakUp Stars</span>
            <span className="text-[10px] bg-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded-full border border-slate-700">
              v{CURRENT_POLICY_VERSION}
            </span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            {t('footer.coppa') || 'COPPA & GDPR-K Privacy First • 100% On-Device Voice Processing • Zero Ads'}
          </p>
        </div>

        {/* Legal & Privacy Navigation Links */}
        <nav
          aria-label="Legal & Privacy Links"
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-medium"
        >
          <Link
            to="/privacy"
            className="hover:text-white transition-colors hover:underline underline-offset-4 flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{t('nav.privacy') || 'Parent Privacy Policy'}</span>
          </Link>

          <Link
            to="/kids-privacy"
            className="hover:text-amber-300 transition-colors hover:underline underline-offset-4 flex items-center gap-1.5 text-amber-200"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{t('nav.kidsPrivacy') || "Kid's Privacy"}</span>
          </Link>

          <Link
            to="/terms"
            className="hover:text-white transition-colors hover:underline underline-offset-4 flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4 text-sky-400" />
            <span>{t('nav.terms') || 'Terms of Use'}</span>
          </Link>

          <Link
            to="/terms#storage"
            className="hover:text-white transition-colors hover:underline underline-offset-4 flex items-center gap-1.5"
          >
            <HardDrive className="w-4 h-4 text-teal-400" />
            <span>{t('nav.storageNotice') || 'Storage Notice'}</span>
          </Link>

          <Link
            to="/parent"
            className="hover:text-white transition-colors hover:underline underline-offset-4 flex items-center gap-1.5 text-slate-400 hover:text-slate-200"
          >
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>{t('nav.parent') || 'Parents'}</span>
          </Link>
        </nav>
      </div>

      {/* Bottom Copyright & Trust Note */}
      <div className="max-w-7xl mx-auto mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 text-center sm:text-left">
        <div>
          &copy; {new Date().getFullYear()} SpeakUp Stars Digital Learning Inc. {t('footer.rights')}
        </div>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Zero Trackers • Zero Commercial Ad Networks • On-Device AI Voice Safeguards</span>
        </div>
      </div>
    </footer>
  );
};
