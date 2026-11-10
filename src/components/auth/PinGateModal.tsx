import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertCircle, X, Delete } from 'lucide-react';
import { useParentAuth } from '../../context/ParentAuthContext';
import { pinRateLimiter } from '../../services/security/pinSecurity';

interface PinGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PinGateModal: React.FC<PinGateModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { parent, enterParentMode } = useParentAuth();
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutSecs, setLockoutSecs] = useState(0);

  // Check rate limiter status on open
  useEffect(() => {
    if (isOpen) {
      setPin('');
      setErrorMsg('');
      const status = pinRateLimiter.getStatus();
      if (status.isLocked) {
        setIsLocked(true);
        setLockoutSecs(Math.ceil(status.remainingLockoutMs / 1000));
      } else {
        setIsLocked(false);
      }
    }
  }, [isOpen]);

  // Lockout countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLocked && lockoutSecs > 0) {
      timer = setInterval(() => {
        setLockoutSecs((prev) => {
          if (prev <= 1) {
            setIsLocked(false);
            setErrorMsg('');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isLocked, lockoutSecs]);

  const handleKeyPress = (digit: string) => {
    if (isLocked || pin.length >= 6) return;
    const newPin = pin + digit;
    setPin(newPin);
    if (newPin.length >= 4) {
      attemptUnlock(newPin);
    }
  };

  const handleDelete = () => {
    if (isLocked || pin.length === 0) return;
    setPin(pin.slice(0, -1));
    setErrorMsg('');
  };

  const attemptUnlock = async (pinToTest: string) => {
    // If no parent account set up yet, enter directly to onboarding
    if (!parent) {
      onSuccess();
      onClose();
      return;
    }

    const res = await enterParentMode(pinToTest);
    if (res.success) {
      setPin('');
      onSuccess();
      onClose();
    } else {
      setErrorMsg(res.message || 'Incorrect PIN.');
      setPin('');
      const status = pinRateLimiter.getStatus();
      if (status.isLocked) {
        setIsLocked(true);
        setLockoutSecs(Math.ceil(status.remainingLockoutMs / 1000));
      }
    }
  };

  // Keyboard navigation support for laptop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pin, isLocked]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
        className="relative w-full max-w-sm bg-white rounded-4xl sm:rounded-5xl shadow-2xl border-4 border-purple-200 overflow-hidden z-10 p-6 sm:p-8 text-center space-y-5"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close PIN modal"
          className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Lock Header */}
        <div className="w-16 h-16 rounded-3xl bg-purple-100 text-purple-700 mx-auto flex items-center justify-center text-2xl shadow-inner border-2 border-purple-200">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <div>
          <h3 className="text-xl sm:text-2xl font-heading font-black text-slate-800">
            Grown-Up Zone
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {parent
              ? 'Enter your 4-6 digit parent PIN to access controls'
              : 'Welcome parent! Set up your account or enter setup'}
          </p>
        </div>

        {/* PIN Indicators (Dots) */}
        <div className="flex items-center justify-center gap-3 py-2">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <div
              key={index}
              className={`
                w-4 h-4 rounded-full transition-all duration-150 border-2
                ${
                  index < pin.length
                    ? 'bg-purple-600 border-purple-600 scale-110 shadow-sm'
                    : 'bg-slate-100 border-slate-300'
                }
              `}
            />
          ))}
        </div>

        {/* Error / Lockout Alert */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-800 text-xs font-semibold text-left">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>
              {isLocked
                ? `Temporarily locked for ${Math.floor(lockoutSecs / 60)}m ${lockoutSecs % 60}s`
                : errorMsg}
            </span>
          </div>
        )}

        {/* Tactile Keypad (Large 56px touch targets) */}
        <div className="grid grid-cols-3 gap-2.5 pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              disabled={isLocked}
              onClick={() => handleKeyPress(digit)}
              className="
                min-h-[56px] min-w-[56px] rounded-2xl
                bg-slate-50 hover:bg-purple-50 active:bg-purple-100
                border-2 border-slate-200 text-xl font-heading font-bold text-slate-800
                transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-400
                disabled:opacity-40 disabled:cursor-not-allowed
              "
            >
              {digit}
            </button>
          ))}

          <button
            onClick={() => setPin('')}
            disabled={isLocked || pin.length === 0}
            className="
              min-h-[56px] min-w-[56px] rounded-2xl
              bg-slate-50 hover:bg-slate-100 text-xs font-heading font-bold text-slate-500
              border-2 border-slate-200 transition-all flex items-center justify-center
              disabled:opacity-40 disabled:cursor-not-allowed
            "
          >
            CLEAR
          </button>

          <button
            disabled={isLocked}
            onClick={() => handleKeyPress('0')}
            className="
              min-h-[56px] min-w-[56px] rounded-2xl
              bg-slate-50 hover:bg-purple-50 active:bg-purple-100
              border-2 border-slate-200 text-xl font-heading font-bold text-slate-800
              transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-400
              disabled:opacity-40 disabled:cursor-not-allowed
            "
          >
            0
          </button>

          <button
            onClick={handleDelete}
            disabled={isLocked || pin.length === 0}
            aria-label="Delete last digit"
            className="
              min-h-[56px] min-w-[56px] rounded-2xl
              bg-slate-50 hover:bg-rose-50 text-slate-700
              border-2 border-slate-200 transition-all flex items-center justify-center
              disabled:opacity-40 disabled:cursor-not-allowed
            "
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
