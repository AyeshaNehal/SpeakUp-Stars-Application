/**
 * SPEAKUP STARS: FEELINGS CATCH MINI-GAME
 * Express joyful, brave, calm, silly, and dramatic emotions!
 * Catch floating feeling stars by speaking or selecting matching vocal tones.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GameHeader } from '../../components/games/GameHeader';
import { GameResultsModal } from '../../components/games/GameResultsModal';
import { MascotCompanion, ALL_MASCOTS, MascotId } from '../../components/mascot/MascotCompanion';
import { gameRewardService } from '../../services/games/gameRewardService';
import { GameResults, GameStatus } from '../../services/games/types';
import { Play, Sparkles, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';

const FEELINGS_LIST = [
  { emotion: 'Super Excited!', emoji: '🤩', prompt: 'Tell me your favorite thing with big joyful energy!', color: 'from-amber-400 to-orange-500' },
  { emotion: 'Whisper Spy', emoji: '🤫', prompt: 'Can you whisper a super secret code like a secret agent?', color: 'from-sky-400 to-indigo-500' },
  { emotion: 'Heroic Lion', emoji: '🦁', prompt: 'Roar with a mighty, brave speaking voice!', color: 'from-rose-500 to-red-600' },
  { emotion: 'Peaceful Calm', emoji: '🌿', prompt: 'Speak slow, smooth, and gentle like a warm summer breeze.', color: 'from-emerald-400 to-teal-500' },
  { emotion: 'Silly & Giggly', emoji: '🤪', prompt: 'Make up a funny funny word with your goofiest voice!', color: 'from-purple-400 to-pink-500' },
];

export const FeelingsCatchGamePage: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<GameStatus>('ready');
  const [lowGraphics, setLowGraphics] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(60);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [feelingsCaught, setFeelingsCaught] = useState<number>(0);
  const [starPointsEarned, setStarPointsEarned] = useState<number>(15);
  const [gameResults, setGameResults] = useState<GameResults | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentMascot = (localStorage.getItem('speakup_selected_mascot') as MascotId) || 'luna';
  const mascotObj = ALL_MASCOTS.find((m) => m.id === currentMascot) || ALL_MASCOTS[2];

  const currentFeeling = FEELINGS_LIST[currentIndex % FEELINGS_LIST.length];

  const handleStartGame = () => {
    setStatus('playing');
    setTimeRemaining(60);
    setFeelingsCaught(0);
    setCurrentIndex(0);

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCatchFeeling = () => {
    setFeelingsCaught((prev) => prev + 1);
    setStarPointsEarned((prev) => Math.min(50, prev + 5));

    try {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#EC4899', '#F43F5E', '#A855F7', '#FBBF24'],
      });
    } catch {
      // Ignore
    }

    setCurrentIndex((prev) => prev + 1);
  };

  const endGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus('completed');

    const totalDuration = 60;
    const elapsedSeconds = totalDuration - timeRemaining;
    const results = gameRewardService.finalizeGameSession({
      childId: 'active_child',
      gameId: 'feelings_catch',
      gameTitle: 'Feelings Catch',
      metrics: {
        durationSeconds: elapsedSeconds,
        averageVolume: 0.7,
        peakVolume: 0.9,
        steadyVoiceTimeSeconds: feelingsCaught * 6,
        steadyVoiceRatio: Math.min(1, (feelingsCaught * 6) / 30),
        eruptionCount: feelingsCaught,
      },
    });
    setGameResults(results);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-5rem)] bg-gradient-to-b from-slate-900 via-rose-950/40 to-slate-900 text-white select-none overflow-hidden pb-12">
      <GameHeader
        title="Feelings Catch 🎭"
        timeRemaining={timeRemaining}
        totalDuration={60}
        starPointsEarned={starPointsEarned}
        isPaused={status === 'paused'}
        lowGraphics={lowGraphics}
        onTogglePause={() => setStatus((s) => (s === 'playing' ? 'paused' : 'playing'))}
        onToggleGraphics={() => setLowGraphics((g) => !g)}
        onExitGame={() => navigate('/games')}
      />

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-pink-950/60 via-slate-900 to-slate-900 border-3 border-pink-500/40 shadow-2xl flex flex-col items-center text-center space-y-6">
          {/* Feelings Caught Counter */}
          <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-2xl border border-pink-400/30">
            <Heart className="w-5 h-5 text-pink-400 fill-pink-400 animate-pulse" />
            <span className="font-heading font-black text-sm text-pink-200">
              Feelings Caught: {feelingsCaught}
            </span>
          </div>

          <MascotCompanion
            mascotId={mascotObj.id}
            size="md"
            showDialogue={true}
            dialogueText={currentFeeling.prompt}
          />

          {status === 'playing' ? (
            <div className="space-y-4 max-w-lg w-full">
              <motion.div
                key={currentFeeling.emotion}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`p-6 rounded-3xl bg-gradient-to-r ${currentFeeling.color} shadow-xl border-2 border-white/20 text-white`}
              >
                <div className="text-5xl mb-2">{currentFeeling.emoji}</div>
                <h3 className="text-2xl font-heading font-black">{currentFeeling.emotion}</h3>
                <p className="text-sm font-medium mt-1 text-white/90">{currentFeeling.prompt}</p>
              </motion.div>

              <div className="flex justify-center gap-4 pt-2">
                <button
                  onClick={handleCatchFeeling}
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-300 hover:to-rose-400 text-white font-heading font-black text-base shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>Expressed It! Catch Star 🌟</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-2xl font-heading font-black text-pink-300">
                Catch Every Feeling!
              </h2>
              <p className="text-sm text-pink-200 max-w-md">
                Practice speaking with your feelings—joyful, whispery, brave, and calm. Every tone makes your speech more engaging!
              </p>
              <button
                onClick={handleStartGame}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-300 hover:to-rose-400 text-white font-heading font-black text-base shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2 mx-auto"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>Play Feelings Catch! 🎭</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {gameResults && (
        <GameResultsModal
          isOpen={status === 'completed'}
          results={gameResults}
          onPlayAgain={() => {
            setStatus('ready');
            setGameResults(null);
          }}
          onBackToGames={() => navigate('/games')}
        />
      )}
    </div>
  );
};
