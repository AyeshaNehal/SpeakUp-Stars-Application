/**
 * PRIVACY POLICY RE-CONSENT MODAL
 * 
 * ============================================================================
 * /* LEGAL REVIEW REQUIRED:
 * When material updates occur to the Privacy Policy or Terms of Use, COPPA § 312.5
 * and GDPR Article 7 require affirmative verified parental re-consent prior to
 * continued processing.
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, FileText } from 'lucide-react';
import { Button } from '../common/Button';
import {
  CURRENT_POLICY_VERSION,
  POLICY_LAST_UPDATED,
  policyVersionService,
  POLICY_VERSION_HISTORY,
} from '../../services/legal/policyVersionService';
import { useI18n } from '../../context/I18nContext';
import { soundEffects } from '../../services/sound/soundEffects';

interface PolicyReconsentModalProps {
  parentId?: string;
  parentConsentedVersion?: string;
  onConsentRecorded?: () => void;
}

export const PolicyReconsentModal: React.FC<PolicyReconsentModalProps> = ({
  parentId,
  parentConsentedVersion,
  onConsentRecorded,
}) => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if reconsent is needed
    const needsConsent = policyVersionService.isReconsentRequired(parentConsentedVersion);
    if (needsConsent) {
      setIsOpen(true);
    }
  }, [parentConsentedVersion]);

  if (!isOpen) return null;

  const handleAgree = () => {
    soundEffects.playCelebration();
    policyVersionService.recordConsent(parentId);
    setIsOpen(false);
    if (onConsentRecorded) {
      onConsentRecorded();
    }
  };

  const handleReviewPolicy = () => {
    navigate('/privacy');
  };

  const latestChanges = POLICY_VERSION_HISTORY[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reconsent-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-xl bg-white rounded-3xl border-3 border-sky-400 shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header with Shield */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-100 border border-sky-200 text-sky-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-xs font-mono font-bold">
              <span>Version {CURRENT_POLICY_VERSION}</span>
              <span>•</span>
              <span>{POLICY_LAST_UPDATED}</span>
            </div>
            <h2 id="reconsent-title" className="text-xl sm:text-2xl font-heading font-black text-slate-900">
              {t('reconsent.title') || 'Privacy Policy & Terms Update'}
            </h2>
          </div>
        </div>

        {/* Plain Language Summary of Changes */}
        <div className="space-y-3 text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <p className="font-heading font-bold text-slate-900 text-xs sm:text-sm">
            {t('reconsent.message') ||
              'We updated our Privacy Policy and Terms of Use. Please review key protections and confirm agreement to continue.'}
          </p>

          {latestChanges && (
            <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-600 pt-1">
              {latestChanges.details.map((detail, idx) => (
                <li key={idx} className="leading-snug">
                  {detail}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Protection Commitments Reminder */}
        <div className="flex items-center gap-3 text-xs text-slate-600 bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>
            <strong>Our Unbreakable Pledge:</strong> 100% on-device speech analysis, zero commercial ads,
            and zero selling of your child’s voice or data.
          </span>
        </div>

        {/* Actions (56px Touch Targets) */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Button
            variant="coral"
            size="lg"
            className="w-full sm:flex-1 min-h-[56px] text-base"
            icon={<CheckCircle2 className="w-5 h-5" />}
            onClick={handleAgree}
          >
            {t('reconsent.btnAgree') || 'I Understand & Agree'}
          </Button>

          <Button
            variant="outline"
            size="md"
            className="w-full sm:w-auto min-h-[48px]"
            icon={<FileText className="w-4 h-4" />}
            onClick={handleReviewPolicy}
          >
            {t('reconsent.btnReview') || 'Read Full Policy'}
          </Button>
        </div>
      </div>
    </div>
  );
};
