/**
 * CHILD PRIVACY NOTE (Rule 1, Rule 2, Rule 3, Rule 5):
 * - Live Camera & Microphone Recording Stage
 * - Zero external media transmission by default. Recordings exist strictly in temporary browser memory.
 * - Hardware stream tracks (camera & mic) are strictly released when leaving the screen,
 *   backgrounding the browser tab, on errors, or when playback begins.
 * - Object URLs are explicitly revoked via URL.revokeObjectURL to prevent memory leaks.
 * - Optional cloud persistence is strictly gated behind verified parental consent.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  VideoOff,
  RotateCcw,
  Play,
  Pause,
  CheckCircle2,
  Camera,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Lightbulb,
  Lock,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { SparkyMascot, SparkyTheme } from '../components/mascot/SparkyMascot';
import { soundEffects } from '../services/sound/soundEffects';
import { recordingStorageService } from '../services/storage/recordingStorageService';
import { faceAnalysisService } from '../services/vision/faceAnalysisService';
import { CleanVisualMetrics } from '../services/security/biometricGuards';
import { useParentAuth } from '../context/ParentAuthContext';
import { getRandomTopic, Topic } from '../services/topics/topicService';
import { AgeGroup } from '../types';

type RecordingState =
  | 'permission_prompt'
  | 'permission_denied'
  | 'ready'
  | 'countdown'
  | 'recording'
  | 'paused'
  | 'preview';

type CameraFacing = 'user' | 'environment';

export const RecordPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeChild, parent, activeConsent } = useParentAuth();
  const outletContext = useOutletContext<{ ageGroup?: AgeGroup }>();

  // Determine age band and topic
  const ageBand: AgeGroup =
    activeChild?.ageBand ||
    (location.state as { ageBand?: AgeGroup })?.ageBand ||
    outletContext?.ageGroup ||
    '6-8';

  const [topic] = useState<Topic>(
    () => (location.state as { topic?: Topic; targetDuration?: number })?.topic || getRandomTopic(ageBand)
  );

  const targetDuration: number =
    (location.state as { topic?: Topic; targetDuration?: number })?.targetDuration ||
    (ageBand === '3-5' ? 30 : ageBand === '9-12' ? 90 : 60);

  // Recording Lifecycle States
  const [stage, setStage] = useState<RecordingState>('permission_prompt');
  const [facingMode, setFacingMode] = useState<CameraFacing>('user');
  const [isAudioOnly, setIsAudioOnly] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [cameraErrorDetail, setCameraErrorDetail] = useState<{
    type: 'not_allowed' | 'in_use' | 'not_found' | 'unsupported' | 'general';
    title: string;
    message: string;
    instruction: string;
    rawError?: string;
  } | null>(null);
  const [isRetryingCamera, setIsRetryingCamera] = useState(false);

  // Timers and Countdown
  const [countdown, setCountdown] = useState(3);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Active Idea Bubble Focus (for child prompts)
  const [activeIdeaIndex, setActiveIdeaIndex] = useState<number | null>(null);

  // Mascot Cheer Message
  const [mascotMessage, setMascotMessage] = useState(
    "You're going to do great! Speak clearly and have fun!"
  );

  // Recorded Media
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [visualMetrics, setVisualMetrics] = useState<CleanVisualMetrics | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Hardware Refs
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const videoPlaybackRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sparky Theme
  const sparkyTheme: SparkyTheme =
    activeChild?.avatarId && ['sunny', 'sky', 'coral', 'mint', 'purple'].includes(activeChild.avatarId)
      ? (activeChild.avatarId as SparkyTheme)
      : 'sunny';

  // --------------------------------------------------------------------------
  // HARDWARE CLEANUP HELPER (Strict Privacy Rule 2)
  // Stops all camera and microphone tracks immediately.
  // --------------------------------------------------------------------------
  const stopHardwareStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }
  }, []);

  // --------------------------------------------------------------------------
  // MEMORY CLEANUP HELPER
  // Revokes ephemeral Blob ObjectURLs to free device RAM.
  // --------------------------------------------------------------------------
  const cleanupRecordingMemory = useCallback(() => {
    if (previewUrl) {
      recordingStorageService.revokeLocalRecording(previewUrl);
      setPreviewUrl(null);
    }
    setRecordedBlob(null);
    recordedChunksRef.current = [];
  }, [previewUrl]);

  // Clean up on component unmount and when app is backgrounded
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // App backgrounded: release camera and microphone for privacy
        stopHardwareStream();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopHardwareStream();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (previewUrl) recordingStorageService.revokeLocalRecording(previewUrl);
    };
  }, [stopHardwareStream, previewUrl]);

  // Callback Ref that immediately connects stream to video element when mounted
  const setVideoPreviewRef = useCallback((node: HTMLVideoElement | null) => {
    videoPreviewRef.current = node;
    if (node && streamRef.current) {
      if (node.srcObject !== streamRef.current) {
        node.srcObject = streamRef.current;
      }
      node.play().catch(() => {});
    }
  }, []);

  // Synchronize stream with video element whenever stage or stream changes
  useEffect(() => {
    if (
      stage !== 'permission_prompt' &&
      stage !== 'permission_denied' &&
      stage !== 'preview' &&
      videoPreviewRef.current &&
      streamRef.current &&
      !isAudioOnly
    ) {
      if (videoPreviewRef.current.srcObject !== streamRef.current) {
        videoPreviewRef.current.srcObject = streamRef.current;
      }
      videoPreviewRef.current.play().catch(() => {});
    }
  }, [stage, isAudioOnly]);

  // Check if camera permission was already granted previously; if so, activate camera automatically
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'permissions' in navigator && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'camera' as PermissionName })
        .then((permissionStatus) => {
          if (permissionStatus.state === 'granted') {
            requestMediaAccess(facingMode, false);
          }
        })
        .catch(() => {});
    }
  }, []);

  // --------------------------------------------------------------------------
  // HARDWARE INITIALIZATION (getUserMedia)
  // --------------------------------------------------------------------------
  const requestMediaAccess = async (requestFacing: CameraFacing = facingMode, audioOnly = false) => {
    stopHardwareStream();
    setPermissionError(null);

    try {
      let stream: MediaStream | null = null;
      if (audioOnly) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setIsAudioOnly(true);
        setCameraErrorDetail(null);
      } else {
        // Enumerate devices to detect and bypass non-RGB IR (infrared) cameras
        let videoDevices: MediaDeviceInfo[] = [];
        try {
          const allDevices = await navigator.mediaDevices.enumerateDevices();
          videoDevices = allDevices.filter((d) => d.kind === 'videoinput');
        } catch {
          // ignore enumeration error
        }

        // Filter out Windows Hello IR (infrared) cameras which do not provide RGB video
        const rgbDevices = videoDevices.filter(
          (d) =>
            !d.label.toLowerCase().includes('ir') &&
            !d.label.toLowerCase().includes('infrared')
        );
        const candidateDevices = rgbDevices.length > 0 ? rgbDevices : videoDevices;

        let lastVideoError: unknown = null;

        // Strategy 1: Attempt explicit candidate RGB camera device with audio
        if (candidateDevices.length > 0) {
          for (const dev of candidateDevices) {
            try {
              stream = await navigator.mediaDevices.getUserMedia({
                video: dev.deviceId
                  ? { deviceId: { exact: dev.deviceId } }
                  : { facingMode: requestFacing, width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: true,
              });
              break;
            } catch (err) {
              lastVideoError = err;
            }
          }
        }

        // Strategy 2: If combined failed, attempt preferred facingMode and resolution
        if (!stream) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: requestFacing, width: { ideal: 1280 }, height: { ideal: 720 } },
              audio: true,
            });
          } catch (err) {
            lastVideoError = err;
          }
        }

        // Strategy 3: Attempt separate video + audio acquisition (bypasses Windows driver multiplex bugs)
        if (!stream) {
          for (const dev of candidateDevices.length > 0 ? candidateDevices : [{ deviceId: '' }]) {
            try {
              const vConstraints = dev.deviceId
                ? { deviceId: { exact: dev.deviceId } }
                : true;
              const vStream = await navigator.mediaDevices.getUserMedia({ video: vConstraints });
              let aStream: MediaStream | null = null;
              try {
                aStream = await navigator.mediaDevices.getUserMedia({ audio: true });
              } catch {
                // If audio fails independently, video can still be used
              }
              const tracks = [
                ...vStream.getVideoTracks(),
                ...(aStream ? aStream.getAudioTracks() : []),
              ];
              stream = new MediaStream(tracks);
              break;
            } catch (err) {
              lastVideoError = err;
            }
          }
        }

        // Strategy 4: Unconstrained video + audio fallback
        if (!stream) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: true,
            });
          } catch (err) {
            lastVideoError = err;
          }
        }

        if (stream && stream.getVideoTracks().length > 0) {
          setIsAudioOnly(false);
          setCameraErrorDetail(null);
        } else {
          // All video attempts failed; inspect error to provide clear actionable help
          const err = lastVideoError instanceof Error ? lastVideoError : null;
          const errName = err?.name || '';
          const rawMsg = err ? `${err.name}: ${err.message}` : 'Error connecting to video device';

          if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
            setCameraErrorDetail({
              type: 'not_allowed',
              title: 'Camera Access Blocked (Browser, Teams, or Privacy Switch)',
              message: 'Your browser or device blocked access to the camera.',
              instruction: '1) Close Microsoft Teams (running in background). 2) Check the physical privacy slider above your camera lens (slide it open so the red/orange dot is gone). 3) Press F8 or Fn+F8 on your keyboard. 4) Ensure browser camera permission is Allowed.',
              rawError: rawMsg,
            });
          } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
            setCameraErrorDetail({
              type: 'in_use',
              title: 'Camera In Use by Microsoft Teams or Another App',
              message: 'Your webcam is being used by Microsoft Teams or another background application.',
              instruction: 'Close Microsoft Teams (right click Teams in the taskbar/tray and select Quit), then click "Turn On Camera".',
              rawError: rawMsg,
            });
          } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
            setCameraErrorDetail({
              type: 'not_found',
              title: 'No Camera Detected',
              message: 'No video camera or webcam was found on this device.',
              instruction: 'Plug in an external webcam or continue having fun speaking in the Audio Recording Booth!',
              rawError: rawMsg,
            });
          } else if (errName === 'OverconstrainedError') {
            setCameraErrorDetail({
              type: 'unsupported',
              title: 'Camera Resolution Unsupported',
              message: 'The requested video format was rejected by your camera driver.',
              instruction: 'Click "Turn On Camera" to retry with basic video settings.',
              rawError: rawMsg,
            });
          } else {
            setCameraErrorDetail({
              type: 'general',
              title: 'Camera Could Not Start',
              message: err?.message || 'Could not start the video camera.',
              instruction: 'Close any background video apps like Microsoft Teams, then click "Turn On Camera" below.',
              rawError: rawMsg,
            });
          }

          // Fallback to audio only so practice is not blocked
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setIsAudioOnly(true);
        }
      }

      streamRef.current = stream;
      setStage('ready');

      if (videoPreviewRef.current && !audioOnly) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play().catch(() => {});
      }

      soundEffects.playCelebration();
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.name : 'NotAllowedError';

      if (errorMsg === 'NotAllowedError' || errorMsg === 'PermissionDeniedError') {
        setPermissionError('denied');
      } else if (errorMsg === 'NotFoundError' || errorMsg === 'DevicesNotFoundError') {
        setPermissionError('not_found');
      } else {
        setPermissionError('generic');
      }
      setStage('permission_denied');
    }
  };

  // Turn On / Retry Camera Button Handler
  const retryCameraAccess = async () => {
    setIsRetryingCamera(true);
    try {
      await requestMediaAccess(facingMode, false);
    } finally {
      setIsRetryingCamera(false);
    }
  };

  // Flip Camera Front / Back
  const toggleCameraFacing = async () => {
    if (isAudioOnly) return;
    const nextFacing: CameraFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    await requestMediaAccess(nextFacing, false);
  };

  // --------------------------------------------------------------------------
  // COUNTDOWN & RECORDING LIFECYCLE
  // --------------------------------------------------------------------------
  const startCountdown = () => {
    setStage('countdown');
    setCountdown(3);
    soundEffects.playTick();

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
        soundEffects.playTick();
      } else {
        clearInterval(interval);
        startActualRecording();
      }
    }, 1000);
  };

  const startActualRecording = () => {
    if (!streamRef.current) return;

    recordedChunksRef.current = [];
    cleanupRecordingMemory();

    try {
      // Find supported mime type
      const mimeTypes = ['video/webm;codecs=vp9,opus', 'video/webm', 'video/mp4', 'audio/webm'];
      const selectedMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || '';

      const recorder = new MediaRecorder(
        streamRef.current,
        selectedMime ? { mimeType: selectedMime } : undefined
      );

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const visual = faceAnalysisService.stopSession();
        setVisualMetrics(visual);
        const finalBlob = new Blob(recordedChunksRef.current, {
          type: selectedMime || 'video/webm',
        });
        const url = URL.createObjectURL(finalBlob);
        setRecordedBlob(finalBlob);
        setPreviewUrl(url);
        setStage('preview');
        stopHardwareStream(); // Stop camera instantly to turn off sensor light!
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000); // chunk every 1s
      if (!isAudioOnly && videoPreviewRef.current) {
        faceAnalysisService.startSession(videoPreviewRef.current);
      }
      setStage('recording');
      setElapsedSeconds(0);
      soundEffects.playCelebration();

      // Cheering prompts during recording
      setMascotMessage("Sparky is listening! You sound fantastic! ⭐");

      // Start elapsed timer
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          if (next >= targetDuration) {
            finishRecording();
          }
          return next;
        });
      }, 1000);
    } catch {
      setPermissionError('recording_failed');
      setStage('permission_denied');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setStage('paused');
      soundEffects.playTick();
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setStage('recording');
      soundEffects.playTick();

      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          if (next >= targetDuration) {
            finishRecording();
          }
          return next;
        });
      }, 1000);
    }
  };

  const restartRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    cleanupRecordingMemory();
    setElapsedSeconds(0);
    requestMediaAccess(facingMode, isAudioOnly);
  };

  const finishRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  // --------------------------------------------------------------------------
  // PREVIEW ACTIONS: "Looks Good!" vs "Try Again"
  // --------------------------------------------------------------------------
  const handleTryAgain = () => {
    cleanupRecordingMemory();
    setElapsedSeconds(0);
    requestMediaAccess(facingMode, isAudioOnly);
  };

  const handleLooksGood = async () => {
    if (!recordedBlob) return;

    setIsSaving(true);
    const sessionId = `sess_${Date.now()}`;

    // RULE 2: Store ONLY if parent explicitly opted in; otherwise stays 100% ephemeral
    let recordingStored = false;
    let signedUrl: string | undefined;

    if (recordingStorageService.canStoreRecording(activeConsent) && parent && activeChild) {
      const storageResult = await recordingStorageService.storeRecordingIfOptedIn({
        blob: recordedBlob,
        sessionId,
        parentId: parent.id,
        childId: activeChild.id,
        durationSeconds: elapsedSeconds,
        consent: activeConsent,
      });

      recordingStored = storageResult.stored;
      signedUrl = storageResult.metadata?.signedUrl;
    }

    setIsSaving(false);

    // Proceed to results screen
    navigate('/results', {
      state: {
        topic,
        durationSeconds: elapsedSeconds,
        targetDuration,
        recordingStored,
        signedUrl,
        visualMetrics,
      },
    });
  };

  // Format MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  // Progress percentage for soft circular timer ring (never scary red)
  const progressRatio = Math.min(elapsedSeconds / targetDuration, 1);
  const strokeDashoffset = 283 - 283 * progressRatio;

  // --------------------------------------------------------------------------
  // 1. STEP: PERMISSION EXPLANATION ("Sparky needs to see and hear you!")
  // --------------------------------------------------------------------------
  if (stage === 'permission_prompt') {
    return (
      <div className="max-w-2xl mx-auto py-4 sm:py-8 space-y-6">
        <Card variant="sunny" padding="lg" className="border-3 border-amber-300 text-center space-y-6">
          <div className="flex justify-center">
            <SparkyMascot theme={sparkyTheme} size="lg" braveryLevel={4} />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/90 text-amber-900 font-heading font-black text-xs uppercase tracking-wider border border-amber-200">
              <Sparkles className="w-4 h-4 text-amber-600 animate-spin" />
              <span>Permission Check</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-black text-amber-950">
              Sparky needs to see and hear you! 🎙️👀
            </h1>
            <p className="text-sm sm:text-base text-amber-900/90 font-medium max-w-lg mx-auto">
              To practice speaking with confidence, we'll turn on your camera and microphone so you can see your brave smile on screen!
            </p>
          </div>

          {/* Privacy Guarantee Card */}
          <div className="bg-white/80 p-4 rounded-3xl border border-amber-200 text-left flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-slate-700">
              <strong className="text-slate-900 block font-heading">Private & On-Device Guarantee:</strong>
              Your video and audio stay right on this device. They are never shared or uploaded without your parent's permission.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              variant="coral"
              size="xl"
              icon={<Camera className="w-6 h-6" />}
              onClick={() => requestMediaAccess(facingMode, false)}
              className="w-full sm:w-auto"
            >
              Turn On Camera & Mic! 🚀
            </Button>

            <Button
              variant="outline"
              size="lg"
              icon={<Mic className="w-5 h-5" />}
              onClick={() => requestMediaAccess(facingMode, true)}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              Audio Only (No Camera) 🎙️
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // 2. STEP: PERMISSION DENIED / ERROR WITH SIMPLE INSTRUCTIONS
  // --------------------------------------------------------------------------
  if (stage === 'permission_denied') {
    return (
      <div className="max-w-xl mx-auto py-8 space-y-6">
        <Card variant="white" padding="lg" className="border-3 border-coral-200 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-coral-100 text-coral-600 flex items-center justify-center mx-auto shadow-inner">
            <VideoOff className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-heading font-black text-slate-800">
              Camera or Mic is Sleeping! 😴
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              We couldn't connect to your camera or microphone. Don't worry, it's easy to fix!
            </p>
            {permissionError === 'not_found' && (
              <div className="pt-1">
                <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
                  Note: No camera device was detected. You can practice with Audio Only!
                </span>
              </div>
            )}
          </div>

          {/* Simple kid- and parent-friendly instructions */}
          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 text-left space-y-3">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-slate-700">
                <strong>Ask a grown-up:</strong> Tap the <strong>lock 🔒</strong> or <strong>camera 📷</strong> icon at the top of your browser address bar and choose <strong>"Allow"</strong>.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <RefreshCw className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-slate-700">
                Then tap <strong>"Try Again"</strong> below to start speaking!
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="coral"
              size="lg"
              icon={<RefreshCw className="w-5 h-5" />}
              onClick={() => requestMediaAccess(facingMode, false)}
              className="w-full sm:w-auto"
            >
              Try Again 🔄
            </Button>

            <Button
              variant="sky"
              size="lg"
              icon={<Mic className="w-5 h-5" />}
              onClick={() => requestMediaAccess(facingMode, true)}
              className="w-full sm:w-auto"
            >
              Use Audio Only 🎙️
            </Button>

            <Button
              variant="ghost"
              size="md"
              onClick={() => navigate('/prep', { state: { topic, targetDuration } })}
            >
              Back to Prep
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // 3. STEP: RECORDING & PREVIEW STAGES
  // Responsive layout:
  // - Phone: Camera fills the screen in portrait, controls at bottom.
  // - Laptop: Camera centered, helper panel on side.
  // --------------------------------------------------------------------------
  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-12 select-none">
      {/* Top Header Mini Bar */}
      <div className="flex items-center justify-between gap-3 px-1">
        <button
          onClick={() => {
            stopHardwareStream();
            navigate('/prep', { state: { topic, targetDuration } });
          }}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-heading font-bold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-2xl border border-slate-200 shadow-2xs"
        >
          <RotateCcw className="w-4 h-4 text-sky-500" />
          <span>Exit to Prep</span>
        </button>

        {/* ON-SCREEN LIVE CAMERA / MIC INDICATOR & RETRY TOGGLE */}
        {stage !== 'preview' && (
          <div className="flex items-center gap-2">
            {isAudioOnly && (
              <button
                type="button"
                onClick={retryCameraAccess}
                disabled={isRetryingCamera}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border-2 border-amber-500 text-amber-950 font-heading font-black text-xs shadow-xs cursor-pointer transition-all active:scale-95 disabled:opacity-60"
                title="Attempt to connect your webcam"
              >
                <Camera className="w-3.5 h-3.5 text-amber-600" />
                <span>{isRetryingCamera ? 'Connecting...' : 'Switch to Camera 📷'}</span>
              </button>
            )}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border-2 border-emerald-500 text-emerald-800 font-heading font-black text-xs shadow-xs animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span>{isAudioOnly ? '● MICROPHONE LIVE' : '● CAMERA LIVE'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Responsive Grid:
          Phone: Single column stacked.
          Laptop (lg: 1024px+): Center Stage (col-span-8), Helper Panel (col-span-4).
      */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CENTER STAGE: Camera Preview / Recording Booth / Playback */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative w-full rounded-4xl sm:rounded-5xl overflow-hidden bg-slate-950 border-4 border-slate-200 shadow-2xl aspect-[3/4] sm:aspect-[4/3] max-h-[68vh] flex items-center justify-center">
            {/* Live Video Preview (Mirror effect for selfie front camera) */}
            {stage !== 'preview' && !isAudioOnly && (
              <video
                ref={setVideoPreviewRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={(e) => (e.currentTarget as HTMLVideoElement).play().catch(() => {})}
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />
            )}

            {/* Audio-Only Visualizer Fallback */}
            {stage !== 'preview' && isAudioOnly && (
              <div className="flex flex-col items-center justify-center p-6 sm:p-8 text-center space-y-4 max-w-lg mx-auto z-10">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-sky-400 to-cyan-300 text-white flex items-center justify-center shadow-2xl animate-pulse">
                  <Mic className="w-12 h-12 sm:w-16 sm:h-16" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl font-heading font-black text-white">
                    Audio Recording Booth
                  </h3>
                  <p className="text-xs sm:text-sm text-sky-200">
                    Camera is off. Sparky is listening closely to your clear voice!
                  </p>
                </div>

                {/* Diagnostic alert if camera encountered an issue */}
                {cameraErrorDetail && (
                  <div className="w-full bg-slate-900/90 border-2 border-amber-400/80 rounded-2xl p-4 text-left space-y-2 backdrop-blur-md shadow-lg pointer-events-auto">
                    <div className="flex items-center gap-2 text-amber-300 font-heading font-bold text-xs sm:text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
                      <span>{cameraErrorDetail.title}</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      {cameraErrorDetail.message}
                    </p>
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/10 text-[11px] sm:text-xs text-amber-200 flex items-start gap-2">
                      <Lock className="w-3.5 h-3.5 flex-shrink-0 text-amber-400 mt-0.5" />
                      <span>{cameraErrorDetail.instruction}</span>
                    </div>
                    {cameraErrorDetail.rawError && (
                      <div className="pt-0.5 text-[10px] text-slate-400 font-mono truncate">
                        Code: {cameraErrorDetail.rawError}
                      </div>
                    )}
                    <div className="pt-1">
                      <a
                        href="/camera-test.html"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 underline font-bold"
                      >
                        Launch Direct Camera Hardware Diagnostic 🛠️
                      </a>
                    </div>
                  </div>
                )}

                {/* Primary Button to Turn On / Retry Camera */}
                <div className="pt-2 pointer-events-auto">
                  <button
                    type="button"
                    onClick={retryCameraAccess}
                    disabled={isRetryingCamera}
                    className="min-h-[48px] px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 font-heading font-black text-sm sm:text-base shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-95 border-2 border-white/40"
                  >
                    <Camera className="w-5 h-5 text-amber-950" />
                    <span>{isRetryingCamera ? 'Checking Camera...' : 'Turn On Camera 📹'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Recorded Playback Preview */}
            {stage === 'preview' && previewUrl && (
              <video
                ref={videoPlaybackRef}
                src={previewUrl}
                controls
                playsInline
                autoPlay
                className="w-full h-full object-contain bg-black"
              />
            )}

            {/* Overlay Top Bar: Topic Chip & Camera Switch */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-auto z-20">
              {/* Topic Mini Pill */}
              <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full text-white text-xs sm:text-sm font-heading font-bold shadow-md border border-white/20">
                <span className="text-lg">{topic.emoji}</span>
                <span className="truncate max-w-[160px] sm:max-w-xs">{topic.title}</span>
              </div>

              {/* Front / Back Camera Switch Button */}
              {stage !== 'preview' && !isAudioOnly && (
                <button
                  onClick={toggleCameraFacing}
                  className="min-h-[44px] px-3 rounded-full bg-slate-900/80 backdrop-blur-md text-white hover:text-amber-300 flex items-center gap-1.5 text-xs font-heading font-bold border border-white/20 shadow-md cursor-pointer transition-colors"
                  aria-label="Switch camera"
                >
                  <RefreshCw className="w-4 h-4 text-sky-400" />
                  <span className="hidden sm:inline">Flip Camera</span>
                </button>
              )}
            </div>

            {/* Floating Sparky Mascot Cheer in Corner */}
            {stage !== 'preview' && (
              <div className="absolute bottom-3 right-3 z-20 flex items-end gap-2 pointer-events-none">
                <div className="hidden sm:block bg-white/95 text-slate-800 text-[11px] font-heading font-bold px-3 py-1.5 rounded-2xl shadow-lg border border-amber-200 max-w-[150px] animate-bounce">
                  {mascotMessage}
                </div>
                <SparkyMascot theme={sparkyTheme} size="sm" braveryLevel={5} />
              </div>
            )}

            {/* 3-2-1 COUNTDOWN OVERLAY */}
            <AnimatePresence>
              {stage === 'countdown' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.5 }}
                  className="absolute inset-0 z-30 bg-slate-900/70 backdrop-blur-xs flex flex-col items-center justify-center text-center select-none"
                >
                  <motion.div
                    key={countdown}
                    initial={{ scale: 0.3, opacity: 0 }}
                    animate={{ scale: 1.2, opacity: 1 }}
                    exit={{ scale: 2, opacity: 0 }}
                    transition={{ type: 'spring', damping: 15 }}
                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-tr from-sunny to-amber-400 text-amber-950 font-heading font-black text-6xl sm:text-7xl flex items-center justify-center shadow-2xl border-4 border-white"
                  >
                    {countdown}
                  </motion.div>
                  <p className="mt-4 text-white font-heading font-black text-xl sm:text-2xl tracking-wider uppercase">
                    Take a deep breath! 🌬️
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RECORDING CONTROLS CONTAINER */}
          <div className="bg-white rounded-4xl sm:rounded-5xl p-4 sm:p-6 border-3 border-slate-200 shadow-md">
            {/* STAGE A: READY TO RECORD */}
            {stage === 'ready' && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="text-lg sm:text-xl font-heading font-black text-slate-800">
                    Ready When You Are! 🌟
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    Target practice goal: <strong>{formatTime(targetDuration)}</strong>. You can finish anytime.
                  </p>
                </div>

                <Button
                  variant="coral"
                  size="xl"
                  icon={<Play className="w-7 h-7 fill-white" />}
                  onClick={startCountdown}
                  className="w-full sm:w-auto px-8 py-5 text-lg font-heading font-black shadow-lg"
                >
                  Start Speaking! 🚀
                </Button>
              </div>
            )}

            {/* STAGE B: RECORDING / PAUSED (Soft Circular Timer Ring & Actions) */}
            {(stage === 'recording' || stage === 'paused') && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Soft Circular Timer Ring (Calming Sky / Mint / Amber Palette - Never Scary Red) */}
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        {/* Background track (soft slate) */}
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          className="stroke-slate-100"
                          strokeWidth="8"
                          fill="transparent"
                        />
                        {/* Progress ring in soothing sky/mint */}
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          className={stage === 'paused' ? 'stroke-amber-400' : 'stroke-sky-400'}
                          strokeWidth="8"
                          strokeDasharray="283"
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          fill="transparent"
                          style={{ transition: 'stroke-dashoffset 1s linear' }}
                        />
                      </svg>

                      {/* Numeric Time in Center */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center font-heading font-black text-xs text-slate-800">
                        <span>{formatTime(elapsedSeconds)}</span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {formatTime(targetDuration)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <span
                          className={`w-3 h-3 rounded-full ${
                            stage === 'recording' ? 'bg-emerald-500 animate-ping' : 'bg-amber-400'
                          }`}
                        />
                        <h4 className="text-base sm:text-lg font-heading font-black text-slate-800">
                          {stage === 'recording' ? 'Speaking in Progress...' : 'Paused'}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        {stage === 'recording'
                          ? 'Speak with your natural, friendly voice! Sparky is cheering!'
                          : 'Take a sip of water or a quick breath.'}
                      </p>
                    </div>
                  </div>

                  {/* Action Controls: Pause/Resume, Start Over, Finish Early */}
                  <div className="flex flex-wrap items-center justify-center gap-2.5 w-full sm:w-auto">
                    {stage === 'recording' ? (
                      <Button
                        variant="outline"
                        size="md"
                        icon={<Pause className="w-5 h-5" />}
                        onClick={pauseRecording}
                        className="min-h-[52px]"
                      >
                        Pause
                      </Button>
                    ) : (
                      <Button
                        variant="sky"
                        size="md"
                        icon={<Play className="w-5 h-5 fill-white" />}
                        onClick={resumeRecording}
                        className="min-h-[52px]"
                      >
                        Resume
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="md"
                      icon={<RotateCcw className="w-5 h-5" />}
                      onClick={restartRecording}
                      className="min-h-[52px]"
                    >
                      Start Over
                    </Button>

                    <Button
                      variant="mint"
                      size="md"
                      icon={<CheckCircle2 className="w-5 h-5" />}
                      onClick={finishRecording}
                      className="min-h-[52px]"
                    >
                      I'm Done! ⭐
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE C: PREVIEW & PLAYBACK ("Looks Good!" vs "Try Again") */}
            {stage === 'preview' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <h4 className="text-lg sm:text-xl font-heading font-black text-slate-800">
                      Great Job! Listen to Your Practice Take 🌟
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium">
                      Duration: <strong>{formatTime(elapsedSeconds)}</strong>. Happy with how it sounds?
                    </p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="lg"
                      icon={<RotateCcw className="w-5 h-5" />}
                      onClick={handleTryAgain}
                      disabled={isSaving}
                      className="flex-1 sm:flex-initial min-h-[56px]"
                    >
                      Try Again 🔄
                    </Button>

                    <Button
                      variant="coral"
                      size="lg"
                      icon={<CheckCircle2 className="w-6 h-6" />}
                      onClick={handleLooksGood}
                      disabled={isSaving}
                      className="flex-1 sm:flex-initial min-h-[56px] font-heading font-black shadow-md"
                    >
                      {isSaving ? 'Processing...' : 'Looks Good! 🚀'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SIDE HELPER PANEL (Laptop side panel, phone stacked below) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Topic & Idea Bubbles Chips Card */}
          <Card variant="white" padding="md" className="border-3 border-slate-200 space-y-4">
            <div className="space-y-1">
              <span className="text-[11px] font-heading font-black text-sky-600 uppercase tracking-wider">
                Current Topic
              </span>
              <div className="flex items-center gap-2">
                <span className="text-3xl">{topic.emoji}</span>
                <h3 className="text-base sm:text-lg font-heading font-black text-slate-800 leading-snug">
                  {topic.title}
                </h3>
              </div>
            </div>

            {/* 3 Idea Prompts as Small Glanceable Chips */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-heading font-bold text-slate-600 flex items-center gap-1.5 uppercase tracking-wider">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>3 Idea Sparks to Talk About:</span>
              </span>

              <div className="space-y-2">
                {topic.helperPrompts.map((prompt, idx) => {
                  const isFocused = activeIdeaIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveIdeaIndex(isFocused ? null : idx)}
                      className={`
                        w-full text-left p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-2.5
                        ${
                          isFocused
                            ? 'bg-sunny-50 border-amber-300 text-amber-950 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        }
                      `}
                    >
                      <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center text-[10px] font-heading font-black flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-medium leading-relaxed">{prompt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Gentle Privacy & Safety Reminder Card */}
          <div className="bg-emerald-50/80 rounded-3xl p-4 border-2 border-emerald-200 shadow-2xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-heading font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Friendly Safety Reminder</span>
            </div>
            <p className="text-xs text-emerald-950 font-medium leading-relaxed">
              Sparky says: Keep your speech fun and imaginative! Remember not to say your last name, address, or school name.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
