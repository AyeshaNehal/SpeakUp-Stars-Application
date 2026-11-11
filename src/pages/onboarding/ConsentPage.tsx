import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { SparkyMascot } from '../../components/mascot/SparkyMascot';
import { useParentAuth } from '../../context/ParentAuthContext';

export const ConsentPage: React.FC = () => {
  const navigate = useNavigate();
  const { parent, submitConsent } = useParentAuth();

  // All checkboxes UNTICKED by default
  const [metricsProcessing, setMetricsProcessing] = useState(false);
  const [storeRecordings, setStoreRecordings] = useState(false);
  const [emailSummaries, setEmailSummaries] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Fail-closed requirement: no metrics consent = no child data collected
    if (!metricsProcessing) {
      setErrorMessage(
        'Speech metrics processing consent is required to calculate pacing, clarity, and confidence. Please check box (A) to proceed.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitConsent({
        metricsProcessing,
        storeRecordings,
        emailSummaries,
      });

      if (res.success) {
        navigate('/onboarding/pin');
      } else {
        setErrorMessage(res.message || 'Consent could not be recorded.');
      }
    } catch {
      setErrorMessage('Service temporarily unavailable.');
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
            <button
              type="button"
              onClick={() => navigate('/onboarding/parent')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <span className="text-slate-300">|</span>
            <span className="w-8 h-8 rounded-full bg-emerald-500 text-white font-heading font-black text-sm flex items-center justify-center">
              2
            </span>
            <span className="font-heading font-black text-slate-700 text-sm sm:text-base">
              Step 2 of 4: Verifiable Parental Consent
            </span>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-white/80 px-3 py-1 rounded-full border border-slate-200">
            50% Complete
          </span>
        </div>

        {/* Responsive layout: Laptop 2-column, Phone stacked */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (Mascot & Transparency Explainer) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex flex-col items-center justify-center text-center p-6 bg-white/80 backdrop-blur-sm rounded-4xl border-3 border-emerald-200 shadow-sm">
              <SparkyMascot size="md" />
              <h2 className="mt-3 font-heading font-black text-lg text-slate-800">
                Data Transparency Guarantee
              </h2>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Under COPPA and GDPR-K, parents have absolute control over what is processed and stored.
              </p>
            </div>

            {/* Plain language transparency box */}
            <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-3xl text-xs space-y-2 text-emerald-950">
              <h3 className="font-heading font-black flex items-center gap-1.5 text-emerald-900 text-sm">
                <Info className="w-4 h-4 text-emerald-600" /> What, Why, Who &amp; How Long:
              </h3>
              <ul className="space-y-1.5 list-disc pl-4 text-[11px] leading-relaxed">
                <li><strong>What:</strong> Audio volume, pacing (WPM), clarity score, and scrubbed speech text.</li>
                <li><strong>Why:</strong> To give encouraging star points and speech growth feedback.</li>
                <li><strong>Who:</strong> Processed on-device and securely stored under your isolated parent account. Zero third-party ad networks or trackers.</li>
                <li><strong>How Long:</strong> Retained only while your account is active. Audio recordings (if opted in) auto-expire and purge after 30 days.</li>
              </ul>
            </div>
          </div>

          {/* Right Column (Consent Form with 3 Separate Unticked Checkboxes) */}
          <div className="lg:col-span-7">
            <Card variant="white" padding="lg" className="border-3 border-emerald-300 shadow-xl space-y-6">
              <div>
                <h1 className="font-heading font-black text-xl sm:text-2xl text-slate-800">
                  Parental Consent Form
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Consent is recorded for parent account <strong>{parent?.email}</strong> (Policy Version: 2026.1).
                </p>
              </div>

              {errorMessage && (
                <div
                  role="alert"
                  className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2 text-rose-800 text-xs font-semibold"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Checkbox A: REQUIRED speech metrics */}
                <label className="flex items-start gap-3 p-4 bg-emerald-50/60 border-2 border-emerald-300 rounded-2xl cursor-pointer hover:bg-emerald-50 transition-colors">
                  <input
                    id="metricsConsent"
                    type="checkbox"
                    checked={metricsProcessing}
                    onChange={(e) => setMetricsProcessing(e.target.checked)}
                    className="w-5 h-5 mt-0.5 text-emerald-600 rounded focus:ring-emerald-400 cursor-pointer"
                  />
                  <div>
                    <span className="inline-block text-[10px] uppercase font-heading font-black bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-md mb-1">
                      Required
                    </span>
                    <p className="text-xs sm:text-sm font-heading font-bold text-slate-800">
                      (A) Process Speech Metrics
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Allow SpeakUp Stars to process your child's speaking audio in memory to calculate bravery scores, volume levels, and speed. Raw audio is discarded immediately after analysis unless opted into below.
                    </p>
                  </div>
                </label>

                {/* Checkbox B: OPTIONAL audio recording storage */}
                <label className="flex items-start gap-3 p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100/70 transition-colors">
                  <input
                    type="checkbox"
                    checked={storeRecordings}
                    onChange={(e) => setStoreRecordings(e.target.checked)}
                    className="w-5 h-5 mt-0.5 text-purple-600 rounded focus:ring-purple-400 cursor-pointer"
                  />
                  <div>
                    <span className="inline-block text-[10px] uppercase font-heading font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md mb-1">
                      Optional (Default: OFF)
                    </span>
                    <p className="text-xs sm:text-sm font-heading font-bold text-slate-800">
                      (B) Store Audio Recordings for Playback
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Allow saving short audio clips for 30 days so you and your child can replay speeches. Automatically deleted after 30 days or instantly upon your request.
                    </p>
                  </div>
                </label>

                {/* Checkbox C: OPTIONAL weekly email summary */}
                <label className="flex items-start gap-3 p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100/70 transition-colors">
                  <input
                    type="checkbox"
                    checked={emailSummaries}
                    onChange={(e) => setEmailSummaries(e.target.checked)}
                    className="w-5 h-5 mt-0.5 text-purple-600 rounded focus:ring-purple-400 cursor-pointer"
                  />
                  <div>
                    <span className="inline-block text-[10px] uppercase font-heading font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md mb-1">
                      Optional (Default: OFF)
                    </span>
                    <p className="text-xs sm:text-sm font-heading font-bold text-slate-800">
                      (C) Weekly Parent Progress Email
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Receive a once-per-week gentle summary email of speeches practiced, confidence growth milestones, and stars collected. (Maximum 2 emails per week capped).
                    </p>
                  </div>
                </label>

                <Button
                  type="submit"
                  variant="mint"
                  size="lg"
                  className="w-full justify-center min-h-[56px] text-base mt-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Recording Consent...' : <>Grant Consent &amp; Continue <ArrowRight className="w-5 h-5" /></>}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
