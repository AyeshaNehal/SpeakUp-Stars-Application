/**
 * SPEAKUP STARS: REVAMPED VOLUME VOLCANO GAME
 * Features:
 * 1. Two Play Modes:
 *    - "Typing Lava Blast": Type brave speech words to build pressure and blast lava geysers!
 *    - "Voice Energy Roar": Use microphone loudness to power the volcanic eruption.
 * 2. Visual Lava Eruptions, falling gemstone confetti, and combo counters.
 * 3. Works 100% locally with zero external audio or key recording.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { VolcanoScene3D } from '../../components/games/volcano/VolcanoScene3D';
import { GameHeader } from '../../components/games/GameHeader';
import { GameResultsModal } from '../../components/games/GameResultsModal';
import { MascotCompanion, ALL_MASCOTS, MascotId } from '../../components/mascot/MascotCompanion';
import { AudioVolumeTracker, VolumeSample } from '../../services/games/audioVolumeTracker';
import { gameRewardService } from '../../services/games/gameRewardService';
import { GameResults, GameStatus } from '../../services/games/types';
import { Play, Keyboard, Mic } from 'lucide-react';
import confetti from 'canvas-confetti';

const BRAVE_WORDS = [
  'BRAVE',
  'SHINE',
  'ROAR',
  'VOICE',
  'HERO',
  'STAR',
  'COURAGE',
  'POWER',
  'VOLCANO',
  'EXPLODE',
  'LEADER',
  'CONFIDENT',
  'SUPER',
  'STRONG',
];

export const VolumeVolcanoGamePage: React.FC = () => {
  const navigate = useNavigate();

  // Mode: 'typing' (default) or 'voice'
  const [gameMode, setGameMode] = useState<'typing' | 'voice'>('typing');

  // Game Lifecycle States
  const [status, setStatus] = useState<GameStatus>('ready');
  const [timeRemaining, setTimeRemaining] = useState<number>(60);
  const totalDuration = 60;

  // Typing Challenge State
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [typedInput, setTypedInput] = useState<string>('');
  const [wordsCompleted, setWordsCompleted] = useState<number>(0);
  const [comboStreak, setComboStreak] = useState<number>(0);
  const [magmaPressure, setMagmaPressure] = useState<number>(0); // 0 to 100

  // Voice Mode State
  const [currentVolume, setCurrentVolume] = useState<number>(0);
  const [isErupting, setIsErupting] = useState<boolean>(false);
  const [isSteady, setIsSteady] = useState<boolean>(false);
  const [lowGraphics, setLowGraphics] = useState<boolean>(false);

  // Accumulated Session Metrics
  const [eruptionCount, setEruptionCount] = useState<number>(0);
  const [steadySeconds, setSteadySeconds] = useState<number>(0);
  const [starPointsEarned, setStarPointsEarned] = useState<number>(15);

  // Results State
  const [gameResults, setGameResults] = useState<GameResults | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  // References
  const trackerRef = useRef<AudioVolumeTracker | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const textInputRef = useRef<HTMLInputElement | null>(null);

  const currentMascot = (localStorage.getItem('speakup_selected_mascot') as MascotId) || 'sparky';
  const mascotObj = ALL_MASCOTS.find((m) => m.id === currentMascot) || ALL_MASCOTS[0];

  const targetWord = BRAVE_WORDS[currentWordIndex % BRAVE_WORDS.length];

  // --------------------------------------------------------------------------
  // AUDIO TRACKER CALLBACK (For Voice Mode)
  // --------------------------------------------------------------------------
  const handleAudioSample = useCallback((sample: VolumeSample) => {
    setCurrentVolume(sample.smoothedVolume);
    const steady = sample.state === 'steady' || sample.state === 'erupting';
    const erupting = sample.state === 'erupting';

    setIsSteady(steady);
    if (steady) {
      setSteadySeconds((prev) => prev + 0.1);
    }
    setIsErupting(erupting);
    setMagmaPressure(Math.round(sample.smoothedVolume * 100));

    if (erupting) {
      triggerEruptionBurst();
    }
  }, []);

  // --------------------------------------------------------------------------
  // LAVA ERUPTION EFFECT
  // --------------------------------------------------------------------------
  const triggerEruptionBurst = () => {
    setEruptionCount((prev) => prev + 1);
    setStarPointsEarned((prev) => Math.min(50, prev + 3));

    try {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.5 },
        colors: ['#FF3B00', '#FF7700', '#FFD000', '#FF5722', '#FBBF24'],
      });
    } catch {
      // Ignore
    }
  };

  // --------------------------------------------------------------------------
  // START GAME
  // --------------------------------------------------------------------------
  const handleStartGame = async () => {
    setMicError(null);
    setStatus('playing');
    setTimeRemaining(totalDuration);
    setEruptionCount(0);
    setWordsCompleted(0);
    setComboStreak(0);
    setMagmaPressure(15);
    setTypedInput('');

    if (gameMode === 'voice') {
      if (!trackerRef.current) {
        trackerRef.current = new AudioVolumeTracker();
      }
      const success = await trackerRef.current.start(handleAudioSample);
      if (!success) {
        setMicError('Microphone not accessible. You can play Typing Mode instead!');
        setGameMode('typing');
      }
    } else {
      setTimeout(() => textInputRef.current?.focus(), 100);
    }

    // 60-second game loop
    timerIntervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // --------------------------------------------------------------------------
  // TYPING INPUT HANDLER
  // --------------------------------------------------------------------------
  const handleTypingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setTypedInput(value);

    // Calculate partial matching progress
    if (targetWord.startsWith(value)) {
      const matchPercent = Math.round((value.length / targetWord.length) * 100);
      setMagmaPressure(Math.max(20, matchPercent));

      // Word Completed!
      if (value === targetWord) {
        triggerEruptionBurst();
        setWordsCompleted((prev) => prev + 1);
        setComboStreak((prev) => prev + 1);
        setTypedInput('');
        setCurrentWordIndex((prev) => prev + 1);
        setMagmaPressure(100);
        setTimeout(() => setMagmaPressure(15), 400);
      }
    } else {
      // Mistake resets combo
      setComboStreak(0);
    }
  };

  // --------------------------------------------------------------------------
  // END GAME & FINALIZE REWARDS
  // --------------------------------------------------------------------------
  const endGame = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (trackerRef.current) trackerRef.current.stop();
    setStatus('completed');

    const totalSeconds = totalDuration - timeRemaining;
    const finalResults = gameRewardService.finalizeGameSession({
      childId: 'active_child',
      gameId: 'volume_volcano',
      gameTitle: 'Volume Volcano',
      metrics: {
        durationSeconds: totalSeconds,
        averageVolume: Math.min(1, magmaPressure / 100),
        peakVolume: 0.9,
        steadyVoiceTimeSeconds: gameMode === 'typing' ? wordsCompleted * 3 : steadySeconds,
        steadyVoiceRatio: Math.min(1, (gameMode === 'typing' ? wordsCompleted * 3 : steadySeconds) / Math.max(1, totalSeconds)),
        eruptionCount: Math.max(1, eruptionCount),
      },
    });

    setGameResults(finalResults);
  };

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (trackerRef.current) trackerRef.current.stop();
    };
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-5rem)] bg-gradient-to-b from-slate-900 via-amber-950/40 to-slate-900 text-white select-none overflow-hidden pb-12">
      {/* Game HUD Header */}
      <GameHeader
        title="Volume Volcano 🌋"
        timeRemaining={timeRemaining}
        totalDuration={totalDuration}
        starPointsEarned={starPointsEarned}
        isPaused={status === 'paused'}
        lowGraphics={lowGraphics}
        onTogglePause={() => setStatus((s) => (s === 'playing' ? 'paused' : 'playing'))}
        onToggleGraphics={() => setLowGraphics((g) => !g)}
        onExitGame={() => navigate('/games')}
      />

      <div className="max-w-5xl mx-auto px-4 py-4 space-y-4">
        {/* Mode Toggle Pills */}
        <div className="flex items-center justify-between flex-wrap gap-2 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setGameMode('typing');
                if (trackerRef.current) trackerRef.current.stop();
              }}
              className={`px-4 py-2 rounded-xl font-heading font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer ${
                gameMode === 'typing'
                  ? 'bg-amber-400 text-amber-950 shadow-md'
                  : 'text-white/80 hover:bg-white/10'
              }`}
            >
              <Keyboard className="w-4 h-4" />
              <span>Typing Blast Mode ⌨️</span>
            </button>

            <button
              onClick={() => setGameMode('voice')}
              className={`px-4 py-2 rounded-xl font-heading font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer ${
                gameMode === 'voice'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-white/80 hover:bg-white/10'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>Voice Power Mode 🎙️</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold text-amber-200">
            <span>🔥 Pressure: {magmaPressure}%</span>
            <span>🌋 Eruptions: {eruptionCount}</span>
          </div>
        </div>

        {/* 3D Visual Volcano Crater Scene */}
        <div className="relative w-full h-72 sm:h-84 md:h-96 rounded-3xl overflow-hidden border-3 border-orange-500/40 shadow-2xl bg-gradient-to-b from-sky-950/80 to-slate-900">
          <VolcanoScene3D
            volume={magmaPressure / 100}
            isErupting={magmaPressure >= 80 || isErupting}
          />

          {/* Dynamic Lava Fountain Particles Overlay */}
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
            <div className="flex justify-between items-start">
              <span className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-amber-300 border border-amber-500/30">
                🌋 Magma Core Active
              </span>
              {comboStreak > 1 && (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  className="bg-gradient-to-r from-orange-500 to-amber-400 text-white font-heading font-black text-xs sm:text-sm px-3 py-1 rounded-full shadow-lg"
                >
                  🔥 {comboStreak}X COMBO!
                </motion.div>
              )}
            </div>

            {/* Magma Pressure Progress Bar */}
            <div className="w-full bg-black/60 backdrop-blur-md p-2 rounded-2xl border border-white/20">
              <div className="flex justify-between text-[11px] font-bold text-amber-200 mb-1">
                <span>Magma Eruption Charge</span>
                <span>{magmaPressure}%</span>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 rounded-full"
                  animate={{ width: `${magmaPressure}%` }}
                  transition={{ ease: 'easeOut', duration: 0.2 }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ACTIVE GAME INTERACTIVE CONTROLS */}
        {status === 'playing' && (
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border-2 border-amber-400/40 shadow-xl space-y-4">
            {gameMode === 'typing' ? (
              <div className="text-center space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Type the speech word to trigger eruption!
                </p>

                {/* Target Word Display */}
                <div className="inline-flex items-center gap-1 text-3xl sm:text-5xl font-heading font-black tracking-widest bg-black/40 px-6 py-3 rounded-2xl border-2 border-amber-300 shadow-inner">
                  {targetWord.split('').map((char, idx) => {
                    const isTyped = typedInput[idx] === char;
                    return (
                      <span
                        key={idx}
                        className={isTyped ? 'text-emerald-400 underline decoration-amber-400' : 'text-white/60'}
                      >
                        {char}
                      </span>
                    );
                  })}
                </div>

                {/* Active Typing Input */}
                <div className="max-w-md mx-auto pt-2">
                  <input
                    ref={textInputRef}
                    type="text"
                    value={typedInput}
                    onChange={handleTypingChange}
                    placeholder="TYPE HERE..."
                    autoFocus
                    className="w-full text-center text-2xl font-heading font-black py-3 px-4 rounded-2xl bg-white text-slate-900 border-4 border-amber-400 focus:outline-none focus:ring-4 focus:ring-orange-400 tracking-widest uppercase shadow-lg"
                  />
                </div>
                <p className="text-xs text-amber-200/80">
                  Words blasted: <strong>{wordsCompleted}</strong> • Keep the pressure high!
                </p>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <p className="text-sm font-bold text-amber-300">
                  Speak, roar, or say brave tongue-twisters into your mic to power the volcano!
                </p>
                {micError && (
                  <p className="text-sm text-rose-300 bg-rose-950/60 p-2 rounded-xl border border-rose-500/40">
                    {micError}
                  </p>
                )}
                {isSteady && (
                  <p className="text-sm text-emerald-300 font-bold animate-pulse">
                    ✨ Super Steady Voice Power! ✨
                  </p>
                )}
                <div className="text-4xl animate-bounce">🎙️</div>
                <div className="text-xs text-white/70">
                  Voice Level: {Math.round(currentVolume * 100)}%
                </div>
              </div>
            )}
          </div>
        )}

        {/* READY / START SCREEN */}
        {status === 'ready' && (
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 sm:p-8 border-2 border-orange-400/40 text-center space-y-5">
            <div className="flex flex-col items-center justify-center gap-2">
              <MascotCompanion mascotId={mascotObj.id} size="md" />
              <h2 className="text-2xl sm:text-3xl font-heading font-black text-amber-300">
                Ready to Erupt the Volcano?
              </h2>
              <p className="text-sm text-amber-100 max-w-md font-medium">
                {gameMode === 'typing'
                  ? 'Type powerful speaking words to shoot fiery magma fountains high into the sky!'
                  : 'Use your real voice energy to raise the glowing magma pool until it explodes with star gems!'}
              </p>
            </div>

            <div className="flex justify-center gap-4 pt-2">
              <button
                onClick={handleStartGame}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-heading font-black text-lg shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
              >
                <Play className="w-6 h-6 fill-slate-950" />
                <span>Start Volcano Challenge! 🌋</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Game Results Modal */}
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
