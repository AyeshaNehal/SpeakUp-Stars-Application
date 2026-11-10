/**
 * CHILD PRIVACY NOTE (Rule 1, Rule 5):
 * - PIN Confirmation Modal for Destructive Data Deletions
 * - Requires parent PIN verification before deleting sessions, child profiles, or accounts.
 * - Prevents accidental deletions by children or unauthorized actors.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X, Lock, Loader2 } from 'lucide-react';
import { Button } from '../common/Button';
import { useParentAuth } from '../../context/ParentAuthContext';
import { parentAuthService } from '../../services/auth/parentAuthService';
import { pinRateLimiter } from '../../services/security/pinSecurity';

interface PinConfirmDeletionModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  itemDetails?: string;
  scope: 'session' | 'child' | 'account';
  onClose: () => void;
  onConfirmed: () => Promise<void>;
}

export const PinConfirmDeletionModal: React.FC<PinConfirmDeletionModalProps> = ({
  isOpen,
  title,
  description,
  itemDetails,
  scope,
  onClose,
  onConfirmed,
}) => {
  const { parent } = useParentAuth();
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + digit);
      setErrorMsg('');
    }
  };

  const handleDeleteDigit = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleExecuteDeletion = async () => {
    if (!pin || pin.length < 4) {
      setErrorMsg('Please enter your 4-6 digit Parent PIN.');
      return;
    }

    // Check rate limiter
    const status = pinRateLimiter.getStatus();
    if (status.isLocked) {
      setErrorMsg(`Locked out. Try again in ${Math.ceil(status.remainingLockoutMs / 1000)}s.`);
      return;
    }

    // Verify PIN if parent account exists
    if (parent) {
      const pinResult = await parentAuthService.verifyParentPin(pin, parent.id);
      if (!pinResult.success) {
        setErrorMsg(pinResult.errorMessage || 'Incorrect Parent PIN.');
        setPin('');
        return;
      }
    }

    // Verified! Proceed with deletion
    setIsDeleting(true);
    try {
      await onConfirmed();
      setPin('');
      onClose();
    } catch {
      setErrorMsg('Failed to process deletion. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border-2 border-rose-100 relative space-y-5"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            aria-label="Cancel deletion"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading font-black text-lg text-slate-900">{title}</h3>
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                Irreversible Action • COPPA Compliant
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="text-xs sm:text-sm text-slate-600 space-y-2">
            <p>{description}</p>
            {itemDetails && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-700">
                {itemDetails}
              </div>
            )}
            <p className="text-rose-600 font-semibold text-xs">
              ⚠️ This will completely erase data from database tables and local storage. It cannot be recovered.
            </p>
          </div>

          {/* PIN Input & Keypad */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-heading font-bold text-slate-700 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                Enter Parent PIN to Confirm
              </label>
              <span className="text-[11px] text-slate-400">{pin.length} / 6 digits</span>
            </div>

            {/* PIN Dots */}
            <div className="flex justify-center gap-2 py-2">
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                    idx < pin.length
                      ? 'bg-rose-500 border-rose-500 scale-110'
                      : 'bg-slate-100 border-slate-300'
                  }`}
                />
              ))}
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-600 font-bold text-center bg-rose-50 p-2 rounded-xl">
                {errorMsg}
              </p>
            )}

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    if (k === 'C') setPin('');
                    else if (k === '⌫') handleDeleteDigit();
                    else handleDigit(k);
                  }}
                  className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-heading font-bold text-sm transition-all flex items-center justify-center"
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-2">
            <Button
              variant="outline"
              size="md"
              className="flex-1 text-slate-600"
              onClick={onClose}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="coral"
              size="md"
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
              onClick={handleExecuteDeletion}
              disabled={isDeleting || pin.length < 4}
              icon={isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            >
              {isDeleting ? 'Deleting...' : scope === 'account' ? 'Delete Account' : 'Confirm Delete'}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
