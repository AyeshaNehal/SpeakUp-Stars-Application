import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, KeyRound, ShieldAlert, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { SparkyMascot } from '../../components/mascot/SparkyMascot';
import { useParentAuth } from '../../context/ParentAuthContext';

export const PinSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { saveParentPin } = useParentAuth();

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!/^\d{4,6}$/.test(pin)) {
      setErrorMessage('PIN must be 4 to 6 numeric digits (0-9).');
      return;
    }
    if (pin !== confirmPin) {
      setErrorMessage('PINs do not match. Please verify both entries.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await saveParentPin(pin);
      if (res.success) {
        navigate('/onboarding/child');
      } else {
        setErrorMessage(res.message || 'Unable to configure PIN.');
      }
    } catch {
      setErrorMessage('Server communication error.');
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
              onClick={() => navigate('/onboarding/consent')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <span className="text-slate-300">|</span>
            <span className="w-8 h-8 rounded-full bg-purple-600 text-white font-heading font-black text-sm flex items-center justify-center">
              3
            </span>
            <span className="font-heading font-black text-slate-700 text-sm sm:text-base">
              Step 3 of 4: Parent Gate PIN
            </span>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-white/80 px-3 py-1 rounded-full border border-slate-200">
            75% Complete
          </span>
        </div>

        {/* Responsive layout: Laptop 2-column, Phone stacked */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column (Mascot / Security explainer) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center text-center p-6 bg-white/80 backdrop-blur-sm rounded-4xl border-3 border-purple-200 shadow-sm">
            <SparkyMascot size="lg" />
            <h2 className="mt-4 font-heading font-black text-xl text-slate-800">
              Parent Gate Protection
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xs">
              Your PIN prevents children from accessing settings, downloading data, modifying profiles, or deleting practice history.
            </p>
            <div className="mt-4 p-3 bg-purple-50 rounded-2xl border border-purple-200 text-purple-900 text-xs text-left space-y-1">
              <p className="font-heading font-bold flex items-center gap-1">
                <ShieldAlert className="w-4 h-4 text-purple-600" /> Server-Side Security:
              </p>
              <p className="text-[11px] text-purple-800">
                PIN is cryptographically salted and hashed server-side. Never stored in plaintext on your device.
              </p>
            </div>
          </div>

          {/* Right Column (PIN Entry Form) */}
          <div className="lg:col-span-7">
            <Card variant="white" padding="lg" className="border-3 border-purple-300 shadow-xl space-y-6">
              <div>
                <h1 className="font-heading font-black text-2xl text-slate-800">
                  Set Your 4-6 Digit Parent PIN
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  Choose a secret code only you know. You will enter this when viewing progress or changing child settings.
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
                <div>
                  <label
                    htmlFor="parent-pin"
                    className="block text-xs font-heading font-bold text-slate-700 uppercase mb-1"
                  >
                    Enter 4 to 6 Digit PIN
                  </label>
                  <div className="relative">
                    <KeyRound className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      id="parent-pin"
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      required
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-purple-400 focus:outline-none text-slate-800 text-xl font-mono tracking-widest min-h-[56px]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="parent-pin-confirm"
                    className="block text-xs font-heading font-bold text-slate-700 uppercase mb-1"
                  >
                    Confirm PIN
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      id="parent-pin-confirm"
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      required
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-purple-400 focus:outline-none text-slate-800 text-xl font-mono tracking-widest min-h-[56px]"
                    />
                  </div>
                </div>

                {pin && confirmPin && pin === confirmPin && (
                  <div className="flex items-center gap-2 text-xs font-heading font-bold text-emerald-600 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>PINs match! Ready to save.</span>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="purple"
                  size="lg"
                  className="w-full justify-center min-h-[56px] text-base"
                  disabled={isSubmitting || !pin || pin !== confirmPin}
                >
                  {isSubmitting ? 'Securing PIN...' : <>Save PIN &amp; Start Child Setup <ArrowRight className="w-5 h-5" /></>}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
