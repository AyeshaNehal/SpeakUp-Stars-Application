import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { SparkyMascot } from '../../components/mascot/SparkyMascot';
import { useParentAuth } from '../../context/ParentAuthContext';
import { useI18n } from '../../context/I18nContext';
import { SupportedLanguage, SUPPORTED_LANGUAGES } from '../../services/i18n/translations';

export const ParentSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { parent, updateParentProfile } = useParentAuth();
  const { setLanguage } = useI18n();

  const [displayName, setDisplayName] = useState(parent?.displayName || '');
  const [preferredLang, setPreferredLang] = useState<SupportedLanguage>(
    (parent?.preferredLanguage as SupportedLanguage) || 'en'
  );
  const [isGuardian, setIsGuardian] = useState(Boolean(parent?.isLegalGuardian));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setPreferredLang(lang);
    setLanguage(lang);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!displayName.trim()) {
      setErrorMessage('Please enter your first name or a display nickname.');
      return;
    }
    if (!isGuardian) {
      setErrorMessage('Please verify that you are the parent or legal guardian.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updateParentProfile({
        displayName: displayName.trim(),
        preferredLanguage: preferredLang,
        isLegalGuardian: isGuardian,
      });

      if (res.success) {
        navigate('/onboarding/consent');
      } else {
        setErrorMessage(res.message || 'Could not save parent profile.');
      }
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sunny-50 via-sky-50 to-purple-50 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-4xl">
        {/* Progress header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-amber-400 text-amber-950 font-heading font-black text-sm flex items-center justify-center">
              1
            </span>
            <span className="font-heading font-black text-slate-700 text-sm sm:text-base">
              Step 1 of 4: Parent Setup
            </span>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-white/80 px-3 py-1 rounded-full border border-slate-200">
            25% Complete
          </span>
        </div>

        {/* Responsive layout: Laptop 2-column (Sparky on left, form on right), Phone stacked */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column (Laptop Mascot Display) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center text-center p-6 bg-white/70 backdrop-blur-sm rounded-4xl border-3 border-amber-200 shadow-sm">
            <SparkyMascot size="lg" isWaving className="animate-pulse" />
            <h2 className="mt-4 font-heading font-black text-xl text-slate-800">
              Welcome, Parent!
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xs">
              Sparky is thrilled to help your child build confident speaking habits. Let's configure your parent profile first!
            </p>
            <div className="mt-4 p-2.5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-[11px] font-medium flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>We never ask for birthdates, phone numbers, or physical addresses.</span>
            </div>
          </div>

          {/* Right Column (Parent Setup Form) */}
          <div className="lg:col-span-7">
            <Card variant="white" padding="lg" className="border-3 border-amber-300 shadow-xl space-y-6">
              <div>
                <h1 className="font-heading font-black text-2xl text-slate-800">
                  Parent or Legal Guardian Setup
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  We collect only the minimal details necessary to manage your family's account.
                </p>
              </div>

              {errorMessage && (
                <div
                  role="alert"
                  className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold"
                >
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* 1. Parent Display Name */}
                <div>
                  <label
                    htmlFor="parent-display-name"
                    className="block text-xs font-heading font-bold text-slate-700 uppercase mb-1"
                  >
                    Parent Display Name (First name or nickname)
                  </label>
                  <div className="relative">
                    <User className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      id="parent-display-name"
                      type="text"
                      required
                      maxLength={30}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Alex or Mom"
                      className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-amber-400 focus:outline-none text-slate-800 text-sm font-semibold min-h-[56px]"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    First name or nickname only. No full legal name required.
                  </p>
                </div>

                {/* 2. Preferred Language */}
                <div>
                  <label
                    htmlFor="parent-language"
                    className="block text-xs font-heading font-bold text-slate-700 uppercase mb-1"
                  >
                    Preferred Language
                  </label>
                  <div className="relative">
                    <Globe className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <select
                      id="parent-language"
                      value={preferredLang}
                      onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
                      className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-amber-400 focus:outline-none text-slate-800 text-sm font-semibold min-h-[56px] bg-white appearance-none cursor-pointer"
                    >
                      {SUPPORTED_LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.nativeName} ({l.name})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. Guardian Confirmation Checkbox */}
                <div className="pt-2">
                  <label className="flex items-start gap-3 p-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl cursor-pointer hover:bg-amber-50/50 transition-colors">
                    <input
                      id="parent-guardian-checkbox"
                      type="checkbox"
                      checked={isGuardian}
                      onChange={(e) => setIsGuardian(e.target.checked)}
                      className="w-5 h-5 mt-0.5 text-amber-500 rounded focus:ring-amber-400 cursor-pointer"
                    />
                    <div className="text-xs sm:text-sm text-slate-700 font-semibold leading-relaxed">
                      I am the parent or legal guardian of the child who will use this app.
                    </div>
                  </label>
                </div>

                {/* Submit button */}
                <Button
                  type="submit"
                  variant="sunny"
                  size="lg"
                  className="w-full justify-center min-h-[56px] text-base"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : <>Save &amp; Continue to Consent <ArrowRight className="w-5 h-5" /></>}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
