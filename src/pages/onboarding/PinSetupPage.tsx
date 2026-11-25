import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, KeyRound, ShieldAlert, ArrowRight, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { SparkyMascot } from '../../components/mascot/SparkyMascot';
import { useParentAuth } from '../../context/ParentAuthContext';

export const PinSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { saveParentPin } = useParentAuth();

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cleanPin = pin.trim().replace(/\D/g, '');
  const cleanConfirmPin = confirmPin.trim().replace(/\D/g, '');

  const isPinValidLength = cleanPin.length >= 4 && cleanPin.length <= 6;
  const isConfirmValidLength = cleanConfirmPin.length >= 4 && cleanConfirmPin.length <= 6;
  const isMatch = isPinValidLength && isConfirmValidLength && cleanPin === cleanConfirmPin;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isPinValidLength) {
      setErrorMessage('PIN must be 4 to 6 numeric digits (0-9).');
      return;
    }
    if (cleanPin !== cleanConfirmPin) {
      setErrorMessage('PINs do not match. Please verify both entries.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await saveParentPin(cleanPin);
      if (res.success) {
        navigate(res.nextRoute || '/onboarding/child');
      } else {
        setErrorMessage(res.message || 'Unable to configure PIN.');
      }
    } catch {
      setErrorMessage('Server communication error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sunny-50 via-sky-50 to-purple-50 flex items-center justify-center p-4 py-6">
      <div className="w-full max-w-3xl">
        {/* Progress header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/onboarding/consent')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <span className="text-slate-300">|</span>
            <span className="w-7 h-7 rounded-full bg-purple-600 text-white font-heading font-black text-xs flex items-center justify-center">
              3
            </span>
            <span className="font-heading font-black text-slate-700 text-xs sm:text-sm">
              Step 3 of 4: Parent Gate PIN
            </span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 bg-white/80 px-2.5 py-0.5 rounded-full border border-slate-200">
            75% Complete
          </span>
        </div>

        {/* Responsive layout: Laptop 2-column, Phone stacked */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Left Column (Mascot / Security explainer) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center text-center p-5 bg-white/85 backdrop-blur-sm rounded-3xl border-2 border-purple-200 shadow-xs">
            <SparkyMascot size="md" />
            <h2 className="mt-3 font-heading font-black text-lg text-slate-800">
              Parent Gate Protection
            </h2>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed max-w-xs">
              Your PIN prevents children from accessing settings, downloading data, modifying profiles, or deleting practice history.
            </p>
            <div className="mt-3 p-2.5 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 text-[11px] text-left space-y-1">
              <p className="font-heading font-bold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-purple-600" /> Server-Side Security:
              </p>
              <p className="text-[11px] text-purple-800 leading-normal">
                PIN is cryptographically salted and hashed server-side. Never stored in plaintext on your device.
              </p>
            </div>
          </div>

          {/* Right Column (PIN Entry Form) */}
          <div className="lg:col-span-7">
            <Card variant="white" padding="md" className="border-2 border-purple-300 shadow-md space-y-5">
              <div>
                <h1 className="font-heading font-black text-xl text-slate-800">
                  Set Your 4-6 Digit Parent PIN
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Choose a secret code only you know. You will enter this when viewing progress or changing child settings.
                </p>
              </div>

              {errorMessage && (
                <div
                  role="alert"
                  className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold"
                >
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="parent-pin"
                    className="block text-[11px] font-heading font-bold text-slate-700 uppercase mb-1"
                  >
                    Enter 4 to 6 Digit PIN
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="parent-pin"
                      type={showPin ? 'text' : 'password'}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      required
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border-2 border-slate-200 focus:border-purple-400 focus:outline-none text-slate-800 text-base font-mono tracking-widest min-h-[46px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      title={showPin ? 'Hide PIN' : 'Show PIN'}
                      aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="parent-pin-confirm"
                    className="block text-[11px] font-heading font-bold text-slate-700 uppercase mb-1"
                  >
                    Confirm PIN
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="parent-pin-confirm"
                      type={showConfirmPin ? 'text' : 'password'}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      required
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border-2 border-slate-200 focus:border-purple-400 focus:outline-none text-slate-800 text-base font-mono tracking-widest min-h-[46px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPin(!showConfirmPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      title={showConfirmPin ? 'Hide PIN' : 'Show PIN'}
                      aria-label={showConfirmPin ? 'Hide PIN' : 'Show PIN'}
                    >
                      {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Real-time PIN helper / validation feedback */}
                {isMatch && (
                  <div className="flex items-center gap-1.5 text-xs font-heading font-bold text-emerald-600 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>PINs match! Ready to save.</span>
                  </div>
                )}

                {cleanPin.length > 0 && cleanConfirmPin.length > 0 && !isMatch && (
                  <div className="flex items-center gap-1.5 text-xs font-heading font-bold text-rose-600 bg-rose-50 p-2 rounded-xl border border-rose-200">
                    <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>PINs do not match. Make sure both fields match.</span>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="purple"
                  size="md"
                  className="w-full justify-center min-h-[46px] text-sm"
                  disabled={isSubmitting || !isMatch}
                >
                  {isSubmitting ? (
                    'Securing PIN...'
                  ) : (
                    <>
                      Save PIN &amp; Start Child Setup <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
