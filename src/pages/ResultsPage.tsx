/**
 * CHILD PRIVACY NOTE (Rule 1, Rule 2, Rule 5):
 * - Results Screen & Hardened AI Feedback
 * - Displays Brave Voice Speaking Skills Meter (0-100) with growth levels (Seedling, Sprout, Flower, Tree, Star).
 * - Mascot Feedback Card: "3 Things You Did Great!" and "1-2 Things to Try Next Time!".
 * - Read-aloud button for young children using on-device Speech Synthesis.
 * - Responsive Skill Breakdown: Radar Chart on laptop, simple progress bars on phone.
 * - Suggested "Next Challenge" card.
 * - Input Harm/Distress Filter: Intercepts distress, gives gentle reassurance, alerts parent quietly.
 * - Only scrubbed transcripts & numeric metrics are analyzed. Zero raw media or PII transmission.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  Clock,
  Award,
  Volume2,
  VolumeX,
  Target,
  CheckCircle2,
  Eye,
  Info,
  Sparkle,
  Home,
  Heart,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import { ProgressBar } from '../components/common/ProgressBar';
import { SparkyMascot, SparkyTheme } from '../components/mascot/SparkyMascot';
import { AnalysisLoadingScreen } from '../components/speech/AnalysisLoadingScreen';
import { BraveVoiceMeter } from '../components/results/BraveVoiceMeter';
import { SkillsRadarChart } from '../components/results/SkillsRadarChart';
import {
  speechAnalysisPipeline,
  SpeechAnalysisResult,
} from '../services/speech/speechAnalysisPipeline';
import {
  aiFeedbackService,
  AIFeedbackResult,
} from '../services/ai/aiFeedbackService';
import { CleanVisualMetrics } from '../services/security/biometricGuards';
import { parentSettingsService, PARENT_EXPLANATION } from '../services/settings/parentSettingsService';
import { soundEffects } from '../services/sound/soundEffects';
import { speechHelper } from '../services/speech/tts';
import { useParentAuth } from '../context/ParentAuthContext';
import { getRandomTopic, Topic } from '../services/topics/topicService';
import { rewardsService } from '../services/rewards/rewardsService';
import { parentDashboardService } from '../services/dashboard/parentDashboardService';
import { AgeGroup } from '../types';

export const ResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeChild } = useParentAuth();
  const outletContext = useOutletContext<{ ageGroup?: AgeGroup }>();

  const ageBand: AgeGroup =
    activeChild?.ageBand ||
    (location.state as { ageBand?: AgeGroup })?.ageBand ||
    outletContext?.ageGroup ||
    '6-8';

  const routeState = location.state as {
    topic?: Topic;
    durationSeconds?: number;
    targetDuration?: number;
    rawTranscript?: string;
    recordingStored?: boolean;
    signedUrl?: string;
    visualMetrics?: CleanVisualMetrics;
  } | null;

  const topic = routeState?.topic || getRandomTopic(ageBand);
  const durationSeconds = routeState?.durationSeconds || 35;
  const targetDuration = routeState?.targetDuration || (ageBand === '3-5' ? 30 : ageBand === '9-12' ? 90 : 60);
  const recordingStored = routeState?.recordingStored || false;

  const [isLoading, setIsLoading] = useState(true);
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [gentleMode, setGentleMode] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SpeechAnalysisResult | null>(null);
  const [feedbackResult, setFeedbackResult] = useState<AIFeedbackResult | null>(null);
  const [isReadingAloud, setIsReadingAloud] = useState(false);
  const [isExplanationModalOpen, setIsExplanationModalOpen] = useState(false);
  const [faceAnalysisSetting, setFaceAnalysisSetting] = useState(
    parentSettingsService.isFaceAnalysisEnabled()
  );

  // Sparky Theme
  const sparkyTheme: SparkyTheme =
    activeChild?.avatarId && ['sunny', 'sky', 'coral', 'mint', 'purple'].includes(activeChild.avatarId)
      ? (activeChild.avatarId as SparkyTheme)
      : 'sunny';

  // Run the speech analysis & hardened AI pipeline on mount or when gentleMode toggles
  useEffect(() => {
    let isMounted = true;

    async function runPipelines() {
      try {
        setPipelineError(null);
        setIsLoading(true);

        // Default sample speech if testing without a live recording
        const sampleSpeech =
          routeState?.rawTranscript ||
          `I really love ${topic.title.toLowerCase()} because it makes me super happy! My favorite part is exploring new ideas and sharing with my family.`;

        // 1. Client-Side Speech Analysis Pipeline
        const baseResult = await speechAnalysisPipeline.analyzeSpeech({
          rawTranscript: sampleSpeech,
          durationSeconds,
          targetDuration,
          ageBand,
          gentleMode,
          visualMetrics: routeState?.visualMetrics,
        });

        // 2. Hardened AI Feedback Pipeline (Zero PII, Harm Filter, Guardrailed)
        const aiResult = await aiFeedbackService.generateFeedback({
          rawTranscript: sampleSpeech,
          childId: activeChild?.id || 'guest_child',
          ageBand,
          topicTitle: topic.title,
          topicCategory: topic.category,
          durationSeconds,
          targetDuration,
          wpm: baseResult.wpm,
          pauseCount: baseResult.pauseCount,
          fillerCount: baseResult.fillerWordsCount,
          volumeSteadiness: baseResult.volumeSteadiness,
          eyeContactRatio: baseResult.faceAnalysis?.eyeContactRatio,
          smileRatio: baseResult.faceAnalysis?.smileRatio,
          headSteadiness: baseResult.faceAnalysis?.headSteadiness,
          usedMostOfTime: baseResult.usedMostOfTime,
          gentleMode,
        });

        if (isMounted) {
          setAnalysisResult(baseResult);
          setFeedbackResult(aiResult);

          // Award points, update streak & check badges if not in distress intervention
          if (!aiResult.isDistressIntervention) {
            const cid = activeChild?.id || 'guest_child';
            rewardsService.recordDailyPractice(cid);
            rewardsService.awardPoints(cid, 'finish_recording', 25);
            rewardsService.unlockBadge(cid, 'first_speech');
            if (durationSeconds >= 60) rewardsService.unlockBadge(cid, 'story_teller');
            if ((baseResult.faceAnalysis?.eyeContactRatio || 0) >= 0.8) rewardsService.unlockBadge(cid, 'eye_contact_hero');
            if (aiResult.skillScores.braveVoiceScore >= 70) rewardsService.unlockBadge(cid, 'brave_voice');

            // Record session for Parent Dashboard skill trends & transparency
            parentDashboardService.recordSession({
              sessionId: `sess_${Date.now()}`,
              parentId: activeChild?.parentId || 'demo_parent',
              childId: cid,
              topicTitle: topic.title,
              topicCategory: topic.category,
              durationSeconds,
              targetDurationSeconds: targetDuration,
              wpm: baseResult.wpm,
              pauseCount: baseResult.pauseCount,
              fillerWordsCount: baseResult.fillerWordsCount,
              eyeContactRatio: baseResult.faceAnalysis?.eyeContactRatio || 0,
              smileRatio: baseResult.faceAnalysis?.smileRatio || 0,
              volumeSteadiness: baseResult.volumeSteadiness,
              braveVoiceScore: aiResult.skillScores.braveVoiceScore,
              growthLevel: (aiResult.growthLevel?.level || 'Star') as 'Seedling' | 'Sprout' | 'Flower' | 'Tree' | 'Star',
              scrubbedTranscript: baseResult.scrubbedTranscript,
              recordingStored: false,
            });
          }

          // Snappy 750ms mascot celebration transition
          setTimeout(() => {
            if (isMounted) {
              setIsLoading(false);
              soundEffects.playCelebration();
            }
          }, 750);
        }
      } catch (err) {
        if (isMounted) {
          setIsLoading(false);
          setPipelineError('Sparky had a little hiccup loading this speech, but you did amazing practicing!');
        }
      }
    }

    runPipelines();

    return () => {
      isMounted = false;
      speechHelper.stop();
    };
  }, [topic, durationSeconds, targetDuration, ageBand, gentleMode, routeState, activeChild?.id]);

  // Read-Aloud Mascot Feedback Helper
  const toggleReadAloud = () => {
    if (isReadingAloud) {
      speechHelper.stop();
      setIsReadingAloud(false);
      return;
    }

    if (!feedbackResult) return;

    const speechText = [
      feedbackResult.sparkyCheer,
      'Here are three things you did great!',
      ...feedbackResult.praisePoints,
      'And something fun to try next time!',
      ...feedbackResult.nextSteps,
      feedbackResult.nextChallenge,
    ].join('. ');

    setIsReadingAloud(true);
    speechHelper.speak(speechText, () => {
      setIsReadingAloud(false);
    });
  };

  const handleToggleFaceAnalysis = (enabled: boolean) => {
    parentSettingsService.setFaceAnalysisEnabled(enabled);
    setFaceAnalysisSetting(enabled);
    soundEffects.playTick();
  };

  // Pipeline Error State (Graceful fallback)
  if (pipelineError) {
    return (
      <div className="max-w-xl mx-auto py-8 px-4 text-center space-y-6 select-none">
        <Card variant="white" padding="lg" className="border-3 border-amber-300 shadow-xl space-y-6">
          <div className="flex justify-center">
            <SparkyMascot theme={sparkyTheme} size="lg" braveryLevel={4} />
          </div>

          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-heading font-black border border-amber-300 uppercase">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Great Job Speaking Up!</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-heading font-black text-slate-800">
              You Spoke with Courage! 🌟
            </h1>
            <p className="text-base text-slate-600 font-medium max-w-md mx-auto leading-relaxed">
              {pipelineError}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              variant="coral"
              size="lg"
              icon={<RotateCcw className="w-5 h-5" />}
              onClick={() => {
                setPipelineError(null);
                setIsLoading(true);
              }}
            >
              Try Again
            </Button>
            <Button
              variant="sky"
              size="lg"
              icon={<Home className="w-5 h-5" />}
              onClick={() => navigate('/wheel')}
            >
              Pick Another Topic
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (isLoading || !analysisResult || !feedbackResult) {
    return <AnalysisLoadingScreen theme={sparkyTheme} />;
  }

  // --------------------------------------------------------------------------
  // HARM / DISTRESS INTERVENTION SCREEN (Child Safety Guideline)
  // Reassuring, calming, zero failure/scoring cues. Quiet flag sent to parent.
  // --------------------------------------------------------------------------
  if (feedbackResult.isDistressIntervention) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 text-center space-y-6 select-none">
        <Card variant="white" padding="lg" className="border-3 border-amber-300 shadow-xl space-y-6">
          <div className="flex justify-center">
            <SparkyMascot theme={sparkyTheme} size="lg" braveryLevel={5} />
          </div>

          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sunny-100 text-amber-900 text-xs font-heading font-black border border-amber-300 uppercase">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              <span>Sparky Is With You</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-heading font-black text-slate-800">
              Thank You for Sharing Your Brave Voice! 🌟
            </h1>
            <p className="text-base text-slate-600 font-medium max-w-md mx-auto leading-relaxed">
              {feedbackResult.reassuranceMessage}
            </p>
          </div>

          <div className="bg-sky-50 p-4 rounded-3xl border border-sky-200 text-sm text-sky-900 font-medium">
            Remember: Your thoughts matter, you are loved, and talking to a trusted parent or grown-up is always a great choice! 💛
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              variant="coral"
              size="lg"
              icon={<Home className="w-5 h-5" />}
              onClick={() => navigate('/')}
              className="w-full sm:w-auto"
            >
              Back to Home 🏠
            </Button>
            <Button
              variant="outline"
              size="lg"
              icon={<RotateCcw className="w-5 h-5" />}
              onClick={() => navigate('/wheel')}
              className="w-full sm:w-auto"
            >
              Try Another Fun Topic 🎡
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Calculate stars earned (celebratory base 25, +10 for finishing duration)
  const starsEarned = Math.round(25 + (feedbackResult.skillScores.braveVoiceScore - 50) * 0.4);
  const faceMetrics = analysisResult.faceAnalysis;

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 pb-12 select-none">
      {/* Celebration Header */}
      <div className="text-center space-y-3">
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 12, stiffness: 200 }}
          className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-sunny to-amber-300 text-4xl sm:text-5xl shadow-xl border-4 border-white mx-auto"
        >
          🌟
        </motion.div>

        <h1 className="text-fluid-hero font-heading font-black text-slate-800">
          Superstar Speech!
        </h1>
        <p className="text-fluid-subtitle text-slate-600 font-semibold max-w-md mx-auto">
          You earned{' '}
          <strong className="text-amber-600 bg-sunny-100 px-2.5 py-0.5 rounded-full border border-amber-200">
            +{starsEarned} Stars ⭐
          </strong>{' '}
          for practicing your speaking skills today!
        </p>

        {/* Action Toggle Pills Row */}
        <div className="pt-1 flex flex-wrap items-center justify-center gap-2">
          {/* Gentle Mode Toggle */}
          <button
            onClick={() => {
              setGentleMode(!gentleMode);
              soundEffects.playTick();
            }}
            className={`
              min-h-[44px] px-4 py-1.5 rounded-full font-heading font-bold text-xs sm:text-sm border-2 transition-all cursor-pointer flex items-center gap-2 shadow-2xs
              ${
                gentleMode
                  ? 'bg-purple-100 text-purple-900 border-purple-300 ring-2 ring-purple-200'
                  : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200'
              }
            `}
          >
            <Sparkles className={`w-4 h-4 ${gentleMode ? 'text-purple-600' : 'text-slate-400'}`} />
            <span>Gentle Mode: {gentleMode ? 'ON (Zero Pressure ✨)' : 'OFF'}</span>
          </button>

          {/* Visual Privacy Info Pill */}
          <button
            onClick={() => setIsExplanationModalOpen(true)}
            className="min-h-[44px] px-4 py-1.5 rounded-full font-heading font-bold text-xs sm:text-sm border-2 border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-all cursor-pointer flex items-center gap-2 shadow-2xs"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Privacy Safeguards</span>
            <Info className="w-3.5 h-3.5 text-emerald-600 ml-0.5" />
          </button>
        </div>
      </div>

      {/* 1. ANIMATED BRAVE VOICE SPEAKING SKILLS METER */}
      <BraveVoiceMeter
        score={feedbackResult.skillScores.braveVoiceScore}
        growthLevel={feedbackResult.growthLevel}
      />

      {/* Main Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Mascot Feedback & 5-Dimension Skills Breakdown */}
        <div className="lg:col-span-7 space-y-6">
          {/* 2. MASCOT FEEDBACK CARD (3 Great Things & 1-2 Next Steps) */}
          <Card variant="white" padding="lg" className="border-3 border-amber-300/80 shadow-md space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <SparkyMascot theme={sparkyTheme} size="sm" braveryLevel={5} />
                <div>
                  <span className="text-[10px] font-heading font-black text-amber-900 uppercase tracking-wider bg-sunny-100 px-2 py-0.5 rounded-full border border-amber-200">
                    Sparky's Coaching
                  </span>
                  <h3 className="font-heading font-black text-base sm:text-lg text-slate-800">
                    What Sparky Loved About Your Speech!
                  </h3>
                </div>
              </div>

              {/* READ-ALOUD BUTTON */}
              <button
                type="button"
                onClick={toggleReadAloud}
                className={`
                  min-h-[44px] px-3.5 py-1.5 rounded-2xl font-heading font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-xs cursor-pointer border
                  ${
                    isReadingAloud
                      ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                      : 'bg-sunny-100 text-amber-950 border-amber-300 hover:bg-sunny-200'
                  }
                `}
                aria-label={isReadingAloud ? 'Stop Read Aloud' : 'Read feedback aloud'}
              >
                {isReadingAloud ? (
                  <>
                    <VolumeX className="w-4 h-4 text-white" />
                    <span>Stop ⏹️</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-amber-800" />
                    <span>Read Aloud 🔊</span>
                  </>
                )}
              </button>
            </div>

            {/* Sparky Cheer Speech Bubble */}
            <div className="p-3.5 bg-sunny-50/80 rounded-2xl border border-amber-200 text-xs sm:text-sm text-amber-950 font-bold leading-relaxed shadow-2xs">
              "{feedbackResult.sparkyCheer}"
            </div>

            {/* 3 Things You Did Great */}
            <div className="space-y-2.5">
              <h4 className="font-heading font-black text-xs sm:text-sm text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>3 Things You Did Great! 🌟</span>
              </h4>
              <div className="space-y-2">
                {feedbackResult.praisePoints.map((praise, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-xs sm:text-sm text-slate-800 flex items-start gap-2.5 shadow-2xs"
                  >
                    <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-900 text-xs font-heading font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="font-medium">{praise}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 1-2 Things to Try Next Time */}
            <div className="space-y-2.5 pt-1">
              <h4 className="font-heading font-black text-xs sm:text-sm text-sky-800 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-4 h-4 text-sky-600 flex-shrink-0" />
                <span>Things to Try Next Time! 🚀</span>
              </h4>
              <div className="space-y-2">
                {feedbackResult.nextSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-sky-50/60 rounded-2xl border border-sky-200 text-xs sm:text-sm text-slate-800 flex items-start gap-2.5 shadow-2xs"
                  >
                    <span className="w-5 h-5 rounded-full bg-sky-200 text-sky-900 text-xs font-heading font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                      💡
                    </span>
                    <span className="font-medium">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* 3. SKILL BREAKDOWN: RADAR CHART (LAPTOP) & BARS (PHONE) */}
          <Card variant="white" padding="lg" className="border-3 border-slate-200 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-black text-base sm:text-lg text-slate-800 flex items-center gap-2">
                <Sparkle className="w-5 h-5 text-sunny-500 fill-sunny-400" />
                <span>Speaking Skill Breakdown</span>
              </h3>
              <span className="text-[11px] font-heading font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                Ages {ageBand} Tier
              </span>
            </div>

            {/* Desktop / Laptop: Radar Chart (lg: 1024px+) */}
            <div className="hidden lg:flex flex-col items-center justify-center pt-2">
              <SkillsRadarChart scores={feedbackResult.skillScores} />
              <p className="text-[11px] text-slate-400 font-medium text-center pt-2">
                All 5 dimensions contribute to your overall Brave Voice Speaking Skills!
              </p>
            </div>

            {/* Phone / Tablet: Simple Bars (hidden on lg) */}
            <div className="block lg:hidden space-y-3.5 pt-1">
              <ProgressBar
                value={feedbackResult.skillScores.voice}
                variant="sky"
                size="md"
                label="🎙️ Voice Flow & Steadiness"
                showPercentage
              />
              <ProgressBar
                value={feedbackResult.skillScores.eyeContact}
                variant="mint"
                size="md"
                label="👀 Eye Contact (Audience Focus)"
                showPercentage
              />
              <ProgressBar
                value={feedbackResult.skillScores.clarity}
                variant="coral"
                size="md"
                label="✨ Clarity & Smoothness"
                showPercentage
              />
              <ProgressBar
                value={feedbackResult.skillScores.story}
                variant="purple"
                size="md"
                label="📚 Story & Time Practice"
                showPercentage
              />
              <ProgressBar
                value={feedbackResult.skillScores.energy}
                variant="sunny"
                size="md"
                label="☀️ Warm Energy & Smiles"
                showPercentage
              />
            </div>

            {/* On-Device Visual Gaze & Expression Signals Note */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-sky-500 flex-shrink-0" />
                <span>
                  {faceMetrics?.faceAnalysisEnabled
                    ? `Camera Gaze: ${Math.round((faceMetrics.eyeContactRatio || 0.85) * 100)}% • Smile Energy: ${Math.round((faceMetrics.smileRatio || 0.7) * 100)}%`
                    : 'Voice-Only Mode: Camera analysis disabled by parent.'}
                </span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                Positive-Only
              </span>
            </div>
          </Card>
        </div>

        {/* Right Column (5 cols): Next Challenge, Reward Badge, Transcript, and Actions */}
        <div className="lg:col-span-5 space-y-6">
          {/* 4. SUGGESTED NEXT CHALLENGE CARD */}
          <Card
            variant="purple"
            padding="lg"
            className="border-3 border-purple-300 text-left space-y-3 shadow-md relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-heading font-black text-purple-900 uppercase tracking-wider bg-white/90 px-2.5 py-0.5 rounded-full border border-purple-200 inline-block">
                Suggested Next Mission
              </span>
              <span className="text-xl">🎯</span>
            </div>

            <h4 className="font-heading font-black text-base sm:text-lg text-purple-950">
              {feedbackResult.nextChallenge}
            </h4>

            <p className="text-xs text-purple-900/90 font-medium">
              Take on this mini-challenge in your next round to help your Brave Voice grow into the next level!
            </p>
          </Card>

          {/* Reward Badge Card */}
          <Card variant="sunny" padding="md" className="space-y-3 text-center border-3 border-amber-300 shadow-sm">
            <span className="text-xs font-heading font-black text-amber-900 bg-white/90 px-3 py-1 rounded-full uppercase border border-amber-200 inline-block">
              Badge Awarded! 🏆
            </span>

            <div className="w-20 h-20 mx-auto rounded-3xl bg-white shadow-md flex items-center justify-center text-4xl border-2 border-amber-300">
              {analysisResult.unlockedBadgeKey === 'badge_sunny_smile' ? '🌟' : '🦁'}
            </div>

            <div>
              <h4 className="font-heading font-black text-base text-amber-950">
                {analysisResult.unlockedBadgeKey === 'badge_sunny_smile'
                  ? 'Sunny Smile Superstar'
                  : 'Brave Lion Speaker'}
              </h4>
              <p className="text-xs text-amber-900/90 font-medium">
                {analysisResult.unlockedBadgeKey === 'badge_sunny_smile'
                  ? 'Brought bright, warm smiling presence to the camera!'
                  : 'Spoke with genuine courage and enthusiastic energy!'}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              fullWidth
              icon={<Award className="w-4 h-4" />}
              onClick={() => navigate('/rewards')}
            >
              View Star Badges
            </Button>
          </Card>

          {/* Privacy-Sanitized Speech Transcript */}
          <Card variant="white" padding="md" className="border-2 border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-heading font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>PII-Scrubbed Transcript</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Protected
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed font-mono max-h-32 overflow-y-auto">
              "{analysisResult.scrubbedTranscript}"
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
              <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span>
                {recordingStored
                  ? 'Recording saved to private family vault.'
                  : 'Recording stored in temporary browser memory only.'}
              </span>
            </div>
          </Card>

          {/* Action CTAs */}
          <div className="space-y-3 pt-2">
            <Button
              variant="coral"
              size="xl"
              fullWidth
              icon={<RotateCcw className="w-6 h-6" />}
              onClick={() => navigate('/wheel')}
              className="py-4 font-heading font-black text-base sm:text-lg shadow-md"
            >
              Spin for Another Topic 🎡
            </Button>

            <Button
              variant="outline"
              size="lg"
              fullWidth
              iconRight={<ArrowRight className="w-5 h-5" />}
              onClick={() => navigate('/')}
              className="min-h-[50px]"
            >
              Back to Child Hub 🏠
            </Button>
          </div>
        </div>
      </div>

      {/* Parent-Facing Visual Analysis Explanation Modal */}
      <Modal
        isOpen={isExplanationModalOpen}
        onClose={() => setIsExplanationModalOpen(false)}
        title={PARENT_EXPLANATION.title}
        icon={<ShieldCheck className="w-6 h-6 text-emerald-600" />}
        maxWidth="md"
        footer={
          <div className="w-full flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500 font-medium">
              Privacy guaranteed under PRIVACY_RULES.md
            </span>
            <Button
              variant="mint"
              size="sm"
              onClick={() => setIsExplanationModalOpen(false)}
            >
              Got It! 👍
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-slate-600 font-medium bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            {PARENT_EXPLANATION.shortSummary}
          </p>

          <div className="space-y-3">
            {PARENT_EXPLANATION.bulletPoints.map((pt, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-heading font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                  ✓
                </span>
                <div className="text-xs sm:text-sm">
                  <strong className="text-slate-800 block font-heading">{pt.title}</strong>
                  <span className="text-slate-600">{pt.text}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Instant Parent Setting Toggle */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-purple-50 border border-purple-200">
              <div>
                <span className="font-heading font-bold text-xs sm:text-sm text-purple-950 block">
                  Parent Control: Face Analysis
                </span>
                <span className="text-[11px] text-purple-800/80">
                  Turn off to use Voice-Only Mode (camera never analyzed).
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleToggleFaceAnalysis(!faceAnalysisSetting)}
                className={`
                  relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
                  ${faceAnalysisSetting ? 'bg-purple-600' : 'bg-slate-300'}
                `}
              >
                <span
                  className={`
                    pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out
                    ${faceAnalysisSetting ? 'translate-x-5' : 'translate-x-0'}
                  `}
                />
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
