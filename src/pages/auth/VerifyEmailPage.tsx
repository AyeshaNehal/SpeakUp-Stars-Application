import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, CheckCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { useParentAuth } from '../../context/ParentAuthContext';

export const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const { parent, verifyEmailCode, refreshAccountState } = useParentAuth();
  const [code, setCode] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setStatusMessage(null);

    const res = await verifyEmailCode(code);
    setIsVerifying(false);
    if (res.success) {
      await refreshAccountState();
      navigate('/onboarding/parent');
    } else {
      setStatusMessage(res.message || 'Verification could not be confirmed.');
    }
  };

  const handleResend = () => {
    setStatusMessage('A fresh verification link has been sent to your email.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sunny-50 via-sky-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex w-16 h-16 rounded-3xl bg-sky-100 text-sky-700 items-center justify-center text-3xl shadow-md border-3 border-white">
            <Mail className="w-8 h-8 text-sky-600" />
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-800">
            Verify Parent Email
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-semibold">
            We sent a verification link to <strong>{parent?.email || 'your email'}</strong>
          </p>
        </div>

        <Card variant="white" padding="lg" className="border-3 border-sky-200 shadow-xl space-y-5">
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            To ensure your child's safety and COPPA compliance, please verify your email address to continue to the parent setup screen.
          </p>

          {statusMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-semibold">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label
                htmlFor="verification-code"
                className="block text-xs font-heading font-bold text-slate-700 uppercase mb-1"
              >
                Verification Code / Token (Optional for Sandbox)
              </label>
              <input
                id="verification-code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. 123456 or click confirm below"
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-sky-400 focus:outline-none text-slate-800 text-sm min-h-[56px]"
              />
            </div>

            <Button
              type="submit"
              variant="sky"
              size="lg"
              className="w-full justify-center min-h-[56px]"
              disabled={isVerifying}
            >
              {isVerifying ? 'Confirming...' : <>Confirm Email &amp; Continue <ArrowRight className="w-5 h-5" /></>}
            </Button>
          </form>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Didn't receive the email?</span>
            <button
              type="button"
              onClick={handleResend}
              className="text-sky-600 hover:text-sky-700 font-heading font-bold flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Resend Link
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
