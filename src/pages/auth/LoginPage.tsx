import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Shield, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { useParentAuth } from '../../context/ParentAuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signInWithEmailPassword, signUpParent, signInWithGoogle } = useParentAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === 'signin') {
        const res = await signInWithEmailPassword(email, password);
        if (!res.success) {
          setErrorMessage(res.message || 'Unable to sign in. Please check your credentials.');
        } else {
          navigate('/');
        }
      } else {
        const res = await signUpParent(email, password);
        if (!res.success) {
          setErrorMessage(res.message || 'Unable to create parent account.');
        } else {
          navigate('/verify-email');
        }
      }
    } catch {
      setErrorMessage('Something went wrong. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const res = await signInWithGoogle();
      if (!res.success) {
        setErrorMessage(res.message || 'Google sign-in could not be completed.');
      }
    } catch {
      setErrorMessage('Google sign-in error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sunny-50 via-sky-50 to-purple-50 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-16 h-16 rounded-3xl bg-sunny text-amber-900 items-center justify-center text-3xl shadow-md border-3 border-white animate-bounce">
            ⭐
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-800">
            SpeakUp <span className="text-amber-500">Stars</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-semibold">
            Parent Account &amp; Safety Portal
          </p>
        </div>

        {/* Auth Card */}
        <Card variant="white" padding="lg" className="border-3 border-amber-200 shadow-xl space-y-5">
          {/* Mode Switcher */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2.5 rounded-xl font-heading font-bold text-xs sm:text-sm transition-all min-h-[44px] ${
                mode === 'signin'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Parent Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2.5 rounded-xl font-heading font-bold text-xs sm:text-sm transition-all min-h-[44px] ${
                mode === 'signup'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Child Protection Banner */}
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl flex items-start gap-2.5 text-purple-900 text-xs">
            <Shield className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Parent Zone:</strong> Children never create accounts or log in. Parents hold accounts and manage child practice.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2 text-rose-800 text-xs font-semibold"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Google Sign-In (Real OAuth Redirect via Supabase) */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 font-heading font-bold text-sm rounded-2xl shadow-xs transition-all min-h-[56px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative flex items-center justify-center py-1">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider absolute">
              or with email
            </span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="parent-email"
                className="block text-xs font-heading font-bold text-slate-700 uppercase mb-1"
              >
                Parent Email
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  id="parent-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="parent@example.com"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-amber-400 focus:outline-none text-slate-800 text-sm min-h-[56px]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="parent-password"
                className="block text-xs font-heading font-bold text-slate-700 uppercase mb-1"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  id="parent-password"
                  type="password"
                  required
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-amber-400 focus:outline-none text-slate-800 text-sm min-h-[56px]"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="sunny"
              size="lg"
              className="w-full justify-center min-h-[56px]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                'Processing...'
              ) : mode === 'signin' ? (
                <>Sign In to Parent Portal <ArrowRight className="w-5 h-5" /></>
              ) : (
                <>Create Parent Account <Sparkles className="w-5 h-5" /></>
              )}
            </Button>
          </form>
        </Card>

        {/* Legal Footer Links */}
        <div className="flex items-center justify-center gap-4 text-xs font-bold text-slate-500">
          <a href="/privacy" className="hover:text-slate-800 underline">Parent Privacy Policy</a>
          <span>•</span>
          <a href="/kids-privacy" className="hover:text-slate-800 underline">Kid-Friendly Privacy</a>
          <span>•</span>
          <a href="/terms" className="hover:text-slate-800 underline">Terms of Use</a>
        </div>
      </div>
    </div>
  );
};
