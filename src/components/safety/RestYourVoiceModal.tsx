import React, { useState } from 'react';
import { SparkyMascot } from '../mascot/SparkyMascot';
import { PinGateModal } from '../auth/PinGateModal';
import { healthyUsageService } from '../../services/safety/healthyUsageService';
import { Moon, Star, Clock, Heart } from 'lucide-react';

interface RestYourVoiceModalProps {
  isOpen: boolean;
  childNickname: string;
  childId: string;
  onDismiss: () => void;
  onExtendMinutes?: (newLimit: number) => void;
}

export const RestYourVoiceModal: React.FC<RestYourVoiceModalProps> = ({
  isOpen,
  childNickname,
  childId,
  onDismiss,
  onExtendMinutes,
}) => {
  const [showPinModal, setShowPinModal] = useState(false);
  const [parentExtended, setParentExtended] = useState(false);

  if (!isOpen) return null;

  const handleParentUnlock = () => {
    setShowPinModal(false);
    // Add 15 minutes extension
    const updatedStatus = healthyUsageService.extendTimeForToday(childId, 15);
    setParentExtended(true);
    if (onExtendMinutes) {
      onExtendMinutes(updatedStatus.limitMinutes);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-gradient-to-b from-indigo-950 via-slate-900 to-indigo-900 p-8 text-center text-white shadow-2xl border border-indigo-500/30">
        {/* Soft floating stars & crescent moon */}
        <div className="absolute top-4 left-6 flex items-center space-x-2 text-amber-300/80 animate-pulse">
          <Moon className="w-6 h-6" />
          <Star className="w-4 h-4" />
        </div>
        <div className="absolute top-6 right-8 text-amber-300/60">
          <Star className="w-5 h-5 animate-pulse" />
        </div>

        {/* Mascot in cozy resting mode */}
        <div className="mx-auto my-4 flex justify-center">
          <div className="relative">
            <div className="w-36 h-36 rounded-full bg-indigo-800/40 flex items-center justify-center border-2 border-indigo-400/30 shadow-inner">
              <SparkyMascot theme="cosmic" size="md" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-900 p-2 rounded-full shadow-lg">
              <Moon className="w-5 h-5" />
            </div>
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-amber-200 tracking-wide mb-2">
          Time to Rest Your Voice! 🌙
        </h2>

        <p className="text-base sm:text-lg text-indigo-100/90 leading-relaxed max-w-md mx-auto mb-6">
          Wonderful job speaking today, <span className="font-bold text-amber-300">{childNickname}</span>! Your vocal
          cords worked super hard and did great brave speaking. Let&apos;s give them a cozy rest so they are ready for
          more fun tomorrow!
        </p>

        {/* Guilt-free reassurance badge */}
        <div className="inline-flex items-center space-x-2 bg-indigo-800/60 px-4 py-2 rounded-full text-indigo-200 text-sm font-medium mb-8 border border-indigo-400/20">
          <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
          <span>Your streak and stars are all safely tucked in!</span>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onDismiss}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 font-bold text-base hover:from-amber-300 hover:to-orange-300 shadow-lg shadow-orange-500/25 transition-all transform active:scale-95"
          >
            See You Tomorrow! 🌟
          </button>

          <button
            onClick={() => setShowPinModal(true)}
            className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-indigo-200 text-sm font-semibold transition-all border border-white/10 flex items-center justify-center space-x-2"
          >
            <Clock className="w-4 h-4" />
            <span>Parent Time Controls</span>
          </button>
        </div>

        {parentExtended && (
          <p className="mt-4 text-xs text-emerald-300 font-medium">
            ✓ Parent approved +15 minutes for today!
          </p>
        )}
      </div>

      {showPinModal && (
        <PinGateModal
          isOpen={showPinModal}
          onSuccess={handleParentUnlock}
          onClose={() => setShowPinModal(false)}
        />
      )}
    </div>
  );
};
