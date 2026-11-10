/**
 * CHILD PRIVACY NOTE (Rule 1, Rule 2, Rule 3, Rule 5):
 * - Multi-Step Parent Account & Verifiable Consent Wizard
 * - Collects verifiable parent consent using plain, non-legalese language.
 * - Enforces separate unticked checkboxes (recording storage defaults to OFF).
 * - Restricts child creation to nickname and age band only.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  CreditCard,
  FileSignature,
  FileCheck2,
} from 'lucide-react';
import { Button } from '../common/Button';
import { useParentAuth } from '../../context/ParentAuthContext';
import { AgeGroup } from '../../types';

interface ParentOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted: () => void;
}

export const ParentOnboardingModal: React.FC<ParentOnboardingModalProps> = ({
  isOpen,
  onClose,
  onCompleted,
}) => {
  const { signUpParent, submitConsent, createChild } = useParentAuth();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Parent Account Form
  const [parentEmail, setParentEmail] = useState('');
  const [parentPassword, setParentPassword] = useState('');
  const [parentPin, setParentPin] = useState('');

  // Step 2: Separate Unticked Consent Checkboxes
  const [consentMetrics, setConsentMetrics] = useState(false); // REQUIRED
  const [consentRecordings, setConsentRecordings] = useState(false); // OPTIONAL (Defaults to OFF)
  const [consentEmails, setConsentEmails] = useState(false); // OPTIONAL (Defaults to OFF)

  // Step 3: Verifiable Parental Consent Method
  const [vpcMethod, setVpcMethod] = useState<'signed_econsent' | 'credit_card' | 'government_id'>('signed_econsent');
  const [signatureName, setSignatureName] = useState('');

  // Step 4: Child Profile (Nickname + Age Band ONLY)
  const [childNickname, setChildNickname] = useState('');
  const [childAgeBand, setChildAgeBand] = useState<AgeGroup>('6-8');
  const [childAvatar, setChildAvatar] = useState('🦁');

  if (!isOpen) return null;

  // Handle Step 1: Parent Sign Up
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    const res = await signUpParent(parentEmail, parentPassword, parentPin);
    setIsSubmitting(false);

    if (res.success) {
      setStep(2);
    } else {
      setErrorMsg(res.message || 'Signup failed.');
    }
  };

  // Handle Step 2: Consent Check
  const handleStep2Submit = () => {
    if (!consentMetrics) {
      setErrorMsg('Please check the required speech metrics box so your child can play.');
      return;
    }
    setErrorMsg('');
    setStep(3);
  };

  // Handle Step 3: Verifiable Parental Consent
  const handleStep3Submit = async () => {
    setIsSubmitting(true);
    setErrorMsg('');

    const res = await submitConsent(
      {
        metricsProcessing: consentMetrics,
        storeRecordings: consentRecordings,
        emailSummaries: consentEmails,
      },
      vpcMethod
    );

    setIsSubmitting(false);
    if (res.success) {
      setStep(4);
    } else {
      setErrorMsg(res.message || 'Parent verification failed.');
    }
  };

  // Handle Step 4: Create Child Profile
  const handleStep4Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    const res = await createChild(childNickname, childAgeBand, childAvatar);
    setIsSubmitting(false);

    if (res.success) {
      onCompleted();
      onClose();
    } else {
      setErrorMsg(res.message || 'Could not create child profile.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="
          relative w-full max-w-xl my-auto
          bg-white rounded-4xl sm:rounded-5xl shadow-2xl border-4 border-sunny-200
          overflow-hidden z-10 flex flex-col max-h-[90vh]
        "
      >
        {/* Step Indicator Header */}
        <div className="bg-gradient-to-r from-sunny-100 to-sky-100 px-6 py-4 border-b-2 border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white shadow-xs flex items-center justify-center text-xl">
              🛡️
            </div>
            <div>
              <p className="text-xs uppercase font-heading font-black tracking-wider text-slate-500">
                Parent Setup • Step {step} of 4
              </p>
              <h3 className="font-heading font-black text-lg text-slate-800">
                {step === 1 && 'Create Parent Account'}
                {step === 2 && 'Child Privacy & Consent'}
                {step === 3 && 'Parent Verification'}
                {step === 4 && 'Create Child Profile'}
              </h3>
            </div>
          </div>
          <span className="text-xs font-heading font-bold text-slate-500 bg-white/80 px-2.5 py-1 rounded-full">
            Adult Only 👨‍👧
          </span>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          {/* STEP 1: Parent Account */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div className="bg-sky-50 rounded-2xl p-4 border border-sky-200 text-xs text-sky-950 font-medium">
                💡 <strong>Important:</strong> Parents always hold the account. Children never sign up or have separate passwords.
              </div>

              <div>
                <label className="block text-xs font-heading font-bold text-slate-700 uppercase mb-1">
                  Parent / Guardian Email
                </label>
                <input
                  type="email"
                  required
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  placeholder="parent@example.com"
                  className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-sky-400 focus:outline-none text-slate-800 min-h-[52px]"
                />
              </div>

              <div>
                <label className="block text-xs font-heading font-bold text-slate-700 uppercase mb-1">
                  Parent Password (min 8 characters, letter + number)
                </label>
                <input
                  type="password"
                  required
                  value={parentPassword}
                  onChange={(e) => setParentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-sky-400 focus:outline-none text-slate-800 min-h-[52px]"
                />
              </div>

              <div>
                <label className="block text-xs font-heading font-bold text-slate-700 uppercase mb-1">
                  Parent Mode PIN (4 to 6 numbers to protect settings from child)
                </label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={parentPin}
                  onChange={(e) => setParentPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="1234"
                  className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-sky-400 focus:outline-none text-slate-800 font-mono tracking-widest min-h-[52px]"
                />
              </div>

              <div className="pt-2">
                <Button
                  variant="sunny"
                  size="lg"
                  fullWidth
                  disabled={isSubmitting}
                  iconRight={<ArrowRight className="w-5 h-5" />}
                >
                  {isSubmitting ? 'Creating Account...' : 'Continue to Consent'}
                </Button>
              </div>
            </form>
          )}

          {/* STEP 2: Plain-Language Consent */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-3 bg-slate-50 p-4 rounded-3xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                <h4 className="font-heading font-black text-sm text-slate-900">
                  How We Protect Your Child's Privacy:
                </h4>
                <p>
                  <strong>1. What we collect:</strong> Only a nickname, an age band (e.g. 6-8), and practice minutes. Never full names, school names, or photos.
                </p>
                <p>
                  <strong>2. Why we collect it:</strong> To pick age-appropriate speech ideas and celebrate confidence milestones.
                </p>
                <p>
                  <strong>3. Who processes it:</strong> Audio is processed directly on your device. We do not sell data or share it with third parties.
                </p>
                <p>
                  <strong>4. How long it is kept:</strong> Stored on this device until you clear it. You can withdraw consent anytime.
                </p>
              </div>

              {/* Separate Unticked Checkboxes */}
              <div className="space-y-3 pt-1">
                {/* Required: Speech metrics */}
                <label className="flex items-start gap-3 p-3.5 rounded-2xl border-2 border-slate-200 hover:bg-slate-50 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={consentMetrics}
                    onChange={(e) => setConsentMetrics(e.target.checked)}
                    className="w-5 h-5 mt-0.5 rounded text-sunny accent-amber-500 flex-shrink-0 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-heading font-bold text-slate-900 block">
                      Required: Process speech duration and volume metrics on-device
                    </span>
                    <span className="text-slate-500">
                      Needed so the game can hear speaking rhythm and grant stars.
                    </span>
                  </div>
                </label>

                {/* Optional: Store audio recordings (DEFAULT OFF) */}
                <label className="flex items-start gap-3 p-3.5 rounded-2xl border-2 border-slate-200 hover:bg-slate-50 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={consentRecordings}
                    onChange={(e) => setConsentRecordings(e.target.checked)}
                    className="w-5 h-5 mt-0.5 rounded text-sunny accent-amber-500 flex-shrink-0 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-heading font-bold text-slate-900 block">
                      Optional: Save audio recordings on this device (Defaults to OFF)
                    </span>
                    <span className="text-slate-500">
                      Allows parent and child to listen back to past speeches. You can delete anytime.
                    </span>
                  </div>
                </label>

                {/* Optional: Weekly email summaries (DEFAULT OFF) */}
                <label className="flex items-start gap-3 p-3.5 rounded-2xl border-2 border-slate-200 hover:bg-slate-50 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={consentEmails}
                    onChange={(e) => setConsentEmails(e.target.checked)}
                    className="w-5 h-5 mt-0.5 rounded text-sunny accent-amber-500 flex-shrink-0 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-heading font-bold text-slate-900 block">
                      Optional: Send weekly parent progress email (Defaults to OFF)
                    </span>
                    <span className="text-slate-500">
                      A simple weekly summary of speaking minutes and badges unlocked.
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-2">
                <Button
                  variant="sunny"
                  size="lg"
                  fullWidth
                  onClick={handleStep2Submit}
                  iconRight={<ArrowRight className="w-5 h-5" />}
                >
                  Verify My Consent
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Verifiable Parental Consent (Pluggable Provider) */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 font-medium">
                To comply with child privacy laws, choose how you wish to verify your adult consent:
              </p>

              <div className="space-y-2.5">
                {[
                  {
                    id: 'signed_econsent' as const,
                    title: 'Digital E-Consent Signature (Fastest)',
                    icon: FileSignature,
                    desc: 'Sign your name digitally confirming you are the parent/guardian.',
                  },
                  {
                    id: 'credit_card' as const,
                    title: 'Credit Card Verification',
                    icon: CreditCard,
                    desc: 'Instant $0.50 micro-authorization (immediately refunded) to verify adulthood.',
                  },
                ].map((method) => {
                  const Icon = method.icon;
                  const isSelected = vpcMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setVpcMethod(method.id)}
                      className={`
                        w-full text-left p-3.5 rounded-2xl border-2 transition-all flex items-start gap-3
                        ${isSelected ? 'bg-sky-50 border-sky-400 text-sky-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'}
                      `}
                    >
                      <Icon className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-heading font-bold text-sm">{method.title}</p>
                        <p className="text-xs text-slate-500 font-normal mt-0.5">{method.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <label className="block text-xs font-heading font-bold text-slate-700 uppercase mb-1">
                  Parent / Guardian Full Legal Name
                </label>
                <input
                  type="text"
                  required
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-slate-800 text-sm"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Used ephemerally for verifiable consent timestamping only. Never shown to child.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  variant="mint"
                  size="lg"
                  fullWidth
                  disabled={isSubmitting || !signatureName.trim()}
                  onClick={handleStep3Submit}
                  icon={<FileCheck2 className="w-5 h-5" />}
                >
                  {isSubmitting ? 'Confirming Consent...' : 'Sign & Complete Consent'}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: Create Child Profile */}
          {step === 4 && (
            <form onSubmit={handleStep4Submit} className="space-y-4">
              <div className="bg-mint-50 p-3.5 rounded-2xl border border-mint-200 text-xs text-emerald-950 font-medium">
                ✅ <strong>Verifiable consent recorded!</strong> Now set up a safe, nickname-only profile for your child.
              </div>

              <div>
                <label className="block text-xs font-heading font-bold text-slate-700 uppercase mb-1">
                  Child Nickname (No real full names)
                </label>
                <input
                  type="text"
                  required
                  value={childNickname}
                  onChange={(e) => setChildNickname(e.target.value)}
                  placeholder="e.g. Leo, StarExplorer, Sammy"
                  className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-mint-400 focus:outline-none text-slate-800 min-h-[52px]"
                />
              </div>

              <div>
                <label className="block text-xs font-heading font-bold text-slate-700 uppercase mb-1">
                  Age Band (Determines speech difficulty)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['3-5', '6-8', '9-12'] as AgeGroup[]).map((band) => (
                    <button
                      key={band}
                      type="button"
                      onClick={() => setChildAgeBand(band)}
                      className={`
                        py-3 px-2 rounded-2xl border-2 font-heading font-bold text-sm min-h-[48px]
                        ${childAgeBand === band ? 'bg-mint text-emerald-950 border-emerald-500 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600'}
                      `}
                    >
                      Ages {band}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-heading font-bold text-slate-700 uppercase mb-1">
                  Choose Starting Mascot
                </label>
                <div className="flex gap-2 justify-between">
                  {['🦁', '🐼', '🦊', '🐨', '🚀'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setChildAvatar(emoji)}
                      className={`
                        w-12 h-12 rounded-2xl text-2xl flex items-center justify-center border-2
                        ${childAvatar === emoji ? 'bg-sunny-100 border-sunny shadow-sm scale-105' : 'bg-slate-50 border-slate-200'}
                      `}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="coral"
                  size="lg"
                  fullWidth
                  disabled={isSubmitting || !childNickname.trim()}
                  icon={<Sparkles className="w-5 h-5" />}
                >
                  {isSubmitting ? 'Saving Profile...' : 'Start Playing in Child Mode!'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
