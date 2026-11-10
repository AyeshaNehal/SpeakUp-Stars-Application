import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  children,
  footer,
  maxWidth = 'md',
  showCloseButton = true,
}) => {
  // Listen for Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className={`
              relative w-full ${maxWidthClasses[maxWidth]} my-auto
              bg-white rounded-4xl sm:rounded-5xl shadow-2xl border-4 border-sunny-200
              overflow-hidden flex flex-col z-10
            `}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between px-6 py-4 sm:px-8 sm:py-5 bg-gradient-to-r from-sunny-100/60 to-sky-100/60 border-b-2 border-slate-100">
                <div className="flex items-center gap-3">
                  {icon && <div className="text-2xl flex-shrink-0">{icon}</div>}
                  {title && (
                    <h3 className="text-xl sm:text-2xl font-bold font-heading text-slate-800">
                      {title}
                    </h3>
                  )}
                </div>

                {showCloseButton && (
                  <button
                    onClick={onClose}
                    aria-label="Close dialog"
                    className="
                      min-h-[56px] min-w-[56px] -mr-2
                      flex items-center justify-center rounded-2xl
                      bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800
                      border-2 border-slate-200 transition-colors
                      focus-visible:ring-4 focus-visible:ring-sunny-400 focus-visible:outline-none
                      active:scale-95 cursor-pointer
                    "
                  >
                    <X className="w-7 h-7" />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="px-6 py-5 sm:px-8 sm:py-6 overflow-y-auto max-h-[70vh]">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-6 py-4 sm:px-8 sm:py-5 bg-slate-50 border-t-2 border-slate-100 flex flex-wrap items-center justify-end gap-3">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
