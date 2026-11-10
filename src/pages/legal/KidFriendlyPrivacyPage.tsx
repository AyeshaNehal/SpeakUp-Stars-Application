/**
 * KID-FRIENDLY PRIVACY PAGE
 * 
 * ============================================================================
 * CHILD-FACING EXPLANATION (Rule 1, Rule 6):
 * - Narrated by Sparky the Mascot.
 * - Big colorful cards with visual metaphors.
 * - Very simple sentences:
 *   "Sparky does not keep your video. Sparky never tells your secrets.
 *    Your grown-up is the boss of your info."
 * - Integrated Read-Aloud button using on-device Web Speech API.
 * - Interactive Sparky Privacy Champion badge.
 * ============================================================================
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Volume2,
  VolumeX,
  Sparkles,
  ShieldCheck,
  VideoOff,
  Lock,
  UserCheck,
  Star,
  Award,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { SparkyMascot } from '../../components/mascot/SparkyMascot';
import { speechHelper } from '../../services/speech/tts';
import { soundEffects } from '../../services/sound/soundEffects';

interface PrivacyCard {
  id: string;
  icon: React.ReactNode;
  title: string;
  simpleText: string;
  speechText: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}

export const KidFriendlyPrivacyPage: React.FC = () => {
  const navigate = useNavigate();
  const [isReading, setIsReading] = useState(false);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [hasTappedBadge, setHasTappedBadge] = useState(false);

  // Sparky's 5 Super Safe Rules
  const privacyCards: PrivacyCard[] = [
    {
      id: 'video',
      icon: <VideoOff className="w-10 h-10 text-amber-500" />,
      title: '1. Sparky Does Not Keep Your Video! 🎥',
      simpleText: 'When you finish speaking, the camera turns off. The video goes bye-bye and is never saved!',
      speechText:
        'Rule number one! Sparky does not keep your video. When you finish speaking, the camera turns off. The video goes bye-bye and is never saved!',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-300',
      textColor: 'text-amber-950',
    },
    {
      id: 'secrets',
      icon: <Lock className="w-10 h-10 text-sky-500" />,
      title: '2. Sparky Never Tells Your Secrets! 🤫',
      simpleText: 'Whatever you talk about stays safe. We never sell your words or tell strangers what you said.',
      speechText:
        'Rule number two! Sparky never tells your secrets. Whatever you talk about stays safe. We never sell your words or tell strangers what you said.',
      bgColor: 'bg-sky-50',
      borderColor: 'border-sky-300',
      textColor: 'text-sky-950',
    },
    {
      id: 'grownup',
      icon: <UserCheck className="w-10 h-10 text-emerald-500" />,
      title: '3. Your Grown-Up Is The Boss! 👑',
      simpleText: 'Your mom, dad, or grown-up is in charge. They can see your star trophies and decide everything.',
      speechText:
        'Rule number three! Your grown-up is the boss of your info. Your mom, dad, or grown-up is in charge. They can see your star trophies and decide everything.',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-300',
      textColor: 'text-emerald-950',
    },
    {
      id: 'strangers',
      icon: <ShieldCheck className="w-10 h-10 text-purple-500" />,
      title: '4. No Strangers Allowed! 🚫',
      simpleText: 'There are no chats, no public messages, and no friend requests. This is your safe speaking nest!',
      speechText:
        'Rule number four! No strangers allowed. There are no chats, no public messages, and no friend requests. This is your safe speaking nest!',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-300',
      textColor: 'text-purple-950',
    },
    {
      id: 'brave',
      icon: <Star className="w-10 h-10 text-coral-500 fill-coral-400" />,
      title: '5. Only Fun & Brave Stars! ⭐',
      simpleText: 'We only look at how brave and steady your voice is. Every time you try, you shine like a superstar!',
      speechText:
        'Rule number five! Only fun and brave stars. We only look at how brave and steady your voice is. Every time you try, you shine like a superstar!',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-300',
      textColor: 'text-rose-950',
    },
  ];

  // Read all rules aloud
  const handleReadFullPage = () => {
    if (isReading) {
      speechHelper.stop();
      setIsReading(false);
      setActiveCardId(null);
      return;
    }

    setIsReading(true);
    soundEffects.playCelebration();

    const fullStory = `Hi superstar! Sparky here to tell you about your privacy.
    Rule 1: Sparky does not keep your video. The video goes bye-bye right away!
    Rule 2: Sparky never tells your secrets. Whatever you say stays safe.
    Rule 3: Your grown-up is the boss of your info.
    Rule 4: No strangers allowed. There are no chats or friend requests.
    Rule 5: Only fun and brave stars! You are safe to speak up and shine!`;

    speechHelper.speak(fullStory, () => {
      setIsReading(false);
      setActiveCardId(null);
    });
  };

  // Read a single card
  const handleReadCard = (card: PrivacyCard) => {
    soundEffects.playTick();
    setActiveCardId(card.id);
    setIsReading(true);

    speechHelper.speak(card.speechText, () => {
      setIsReading(false);
      setActiveCardId(null);
    });
  };

  const handleTapBadge = () => {
    soundEffects.playCelebration();
    setHasTappedBadge(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 select-none">
      {/* Sparky Hero Welcome */}
      <div className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-amber-300 via-orange-300 to-amber-400 p-6 sm:p-10 border-4 border-amber-400 shadow-xl">
        {/* Playful Floating Bubbles */}
        <div className="absolute -right-6 -top-6 w-36 h-36 rounded-full bg-white/30 blur-lg pointer-events-none" />
        <div className="absolute left-10 -bottom-8 w-28 h-28 rounded-full bg-orange-400/20 blur-md pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-left max-w-lg">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 text-amber-950 text-xs font-heading font-black shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-600 animate-spin" />
              <span>Sparky&apos;s Super Safe Zone</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black text-amber-950 tracking-tight leading-tight">
              Sparky’s Privacy Promise! 🦖🛡️
            </h1>

            <p className="text-sm sm:text-base text-amber-900 font-bold leading-relaxed">
              Hey there, superstar! I’m Sparky. Here is how I protect your voice, words, and big smiles!
            </p>

            {/* Read Aloud Button (min 56px touch target) */}
            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
              <button
                onClick={handleReadFullPage}
                className={`
                  min-h-[56px] px-6 py-3 rounded-full font-heading font-black text-sm sm:text-base
                  flex items-center gap-2 shadow-lg transition-all transform hover:scale-105 active:scale-95 cursor-pointer
                  ${
                    isReading
                      ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse'
                      : 'bg-white hover:bg-slate-50 text-amber-950 border-3 border-amber-400'
                  }
                `}
              >
                {isReading ? (
                  <>
                    <VolumeX className="w-6 h-6" />
                    <span>Stop Reading ⏹️</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-6 h-6 text-amber-600" />
                    <span>Hear Sparky Read Aloud! 🔊</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Interactive Mascot Visual */}
          <div className="flex flex-col items-center">
            <div
              onClick={() => soundEffects.playCelebration()}
              className="cursor-pointer transform hover:scale-105 transition-transform"
              title="Tap Sparky for a cheer!"
            >
              <SparkyMascot theme="sunny" size="lg" isWaving />
            </div>
            <span className="mt-2 text-xs font-heading font-black text-amber-950 bg-white/70 px-3 py-1 rounded-full">
              👆 Tap me to say hi!
            </span>
          </div>
        </div>
      </div>

      {/* 5 Big Friendly Cards */}
      <div className="space-y-4">
        {privacyCards.map((card) => {
          const isCardPlaying = activeCardId === card.id && isReading;

          return (
            <div
              key={card.id}
              className={`
                relative overflow-hidden rounded-3xl p-5 sm:p-6 border-3 transition-all duration-300 shadow-md
                ${card.bgColor} ${card.borderColor}
                ${isCardPlaying ? 'ring-4 ring-amber-400 scale-[1.02]' : 'hover:scale-[1.01]'}
              `}
            >
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
                {/* Visual Icon Badge */}
                <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center shadow-md border-2 border-inherit shrink-0">
                  {card.icon}
                </div>

                {/* Card Text */}
                <div className="flex-1 space-y-2">
                  <h2 className={`text-xl sm:text-2xl font-heading font-black ${card.textColor}`}>
                    {card.title}
                  </h2>
                  <p className="text-base sm:text-lg font-bold text-slate-800 leading-snug">
                    {card.simpleText}
                  </p>
                </div>

                {/* Individual Card Read-Aloud Button */}
                <div className="shrink-0 pt-2 sm:pt-0">
                  <button
                    onClick={() => handleReadCard(card)}
                    className="min-h-[48px] px-4 py-2 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-heading font-bold text-xs sm:text-sm shadow-xs border border-slate-200 flex items-center gap-1.5 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4 text-sky-600" />
                    <span>Read This</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Fun Sparky Privacy Champion Badge Reward */}
      <div className="rounded-3xl border-3 border-emerald-300 bg-gradient-to-r from-emerald-100 via-teal-100 to-sky-100 p-6 text-center space-y-4 shadow-md">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 text-emerald-950 font-heading font-black text-xs">
          <Award className="w-4 h-4 text-emerald-600" />
          <span>Interactive Privacy Badge</span>
        </div>

        <h3 className="text-2xl font-heading font-black text-emerald-950">
          You Are a Privacy Champion! 🏆
        </h3>
        <p className="text-emerald-900 font-medium max-w-md mx-auto text-sm sm:text-base">
          Now you know the rules! You and your grown-up are always in safe hands with Sparky.
        </p>

        <div>
          <button
            onClick={handleTapBadge}
            className={`
              min-h-[56px] px-8 py-3 rounded-full font-heading font-black text-base transition-all transform
              shadow-lg active:scale-95 cursor-pointer
              ${
                hasTappedBadge
                  ? 'bg-emerald-600 text-white animate-bounce'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white hover:scale-105'
              }
            `}
          >
            {hasTappedBadge ? '⭐ You Claimed Your Privacy Star!' : '⭐ Tap To Claim Your Privacy Star!'}
          </button>
        </div>
      </div>

      {/* Grown-up Link */}
      <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-slate-600">
        <span>Are you a grown-up? Read our full legal document in plain language:</span>
        <Button variant="outline" size="sm" onClick={() => navigate('/privacy')}>
          Parent Privacy Policy 📋
        </Button>
      </div>
    </div>
  );
};
