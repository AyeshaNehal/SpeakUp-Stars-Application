/**
 * CHILD PRIVACY NOTE (Rule 1, Rule 2, Rule 5):
 * - PIN-Protected Parent Dashboard (Grown-Up Zone)
 * - Accessible only by authenticated parents via verified PIN.
 * - Responsive:
 *   - Charts on laptop, simplified cards on phone.
 *   - Table layout for sessions on laptop, compact cards on mobile.
 * - Progress section:
 *   - Skill trends (Brave Voice, Eye Contact, Pacing WPM, Clarity).
 *   - Time spent & topics tried breakdown.
 *   - Daily time limit settings (Unlimited, 5, 10, 15, 20, 30 mins).
 *   - Category controls (toggle categories on/off).
 *   - Gentle mode toggle (ignores pace & filler words).
 *   - Quiet safety flags from AI input distress filter (never alarms the child).
 * - Privacy & Data section:
 *   - "See all data we have" (profile, sessions, metrics, scrubbed transcripts, badges).
 *   - "Download my child's data" (JSON + CSV).
 *   - Deletion controls ("Delete one session", "Delete all of this child's data", "Delete whole account") with PIN verification and confirmation receipts.
 *   - Consent toggles (recording storage, weekly emails, face analysis).
 *   - Visible log of last export and last data deletion.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Clock,
  BarChart3,
  Mic,
  Award,
  ArrowLeft,
  CheckCircle2,
  Download,
  Trash2,
  Sliders,
  FileText,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Heart,
  RefreshCw,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useParentAuth } from '../context/ParentAuthContext';
import { PinGateModal } from '../components/auth/PinGateModal';
import { ParentOnboardingModal } from '../components/auth/ParentOnboardingModal';
import { PinConfirmDeletionModal } from '../components/dashboard/PinConfirmDeletionModal';
import { SeeAllDataModal } from '../components/dashboard/SeeAllDataModal';
import { SkillTrendsChart } from '../components/dashboard/SkillTrendsChart';
import {
  parentDashboardService,
  SpeakingSessionRecord,
  SkillTrends,
  TimeSpentStats,
  TopicsExploredStats,
} from '../services/dashboard/parentDashboardService';
import {
  parentSettingsService,
  ParentSettings,
} from '../services/settings/parentSettingsService';
import {
  parentSafetyAlertService,
  ParentSafetyAlert,
} from '../services/security/parentSafetyAlertService';
import { ALL_CATEGORIES, TopicCategory } from '../services/topics/topicService';
import { AgeGroup } from '../types';

export const ParentDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    parent,
    childrenList,
    activeChild,
    isParentMode,
    exitParentMode,
    selectActiveChild,
  } = useParentAuth();

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<'progress' | 'privacy'>('progress');
  const [isPinGateOpen, setIsPinGateOpen] = useState(!isParentMode);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [isSeeAllDataOpen, setIsSeeAllDataOpen] = useState(false);

  // Deletion Modal States
  const [deletionConfig, setDeletionConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    itemDetails?: string;
    scope: 'session' | 'child' | 'account';
    targetId: string;
  }>({
    isOpen: false,
    title: '',
    description: '',
    scope: 'session',
    targetId: '',
  });

  // Settings & Data States
  const [settings, setSettings] = useState<ParentSettings>(() => parentSettingsService.getSettings());
  const [sessions, setSessions] = useState<SpeakingSessionRecord[]>([]);
  const [alerts, setAlerts] = useState<ParentSafetyAlert[]>([]);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  const currentChildId = activeChild?.id || 'default_child';
  const parentEmail = parent?.email || 'parent@speakupstars.local';
  const parentId = parent?.id || 'active_parent';

  // Load dashboard data
  const refreshData = () => {
    setSettings(parentSettingsService.getSettings());
    const sess = parentDashboardService.getSessions(currentChildId, parentId);
    setSessions(sess);
    const al = parentSafetyAlertService.getAlerts(currentChildId);
    setAlerts(al);
  };

  useEffect(() => {
    refreshData();
  }, [currentChildId, parentId]);

  // Derived Analytics
  const skillTrends: SkillTrends = useMemo(
    () => parentDashboardService.getSkillTrends(currentChildId),
    [currentChildId, sessions]
  );

  const timeSpent: TimeSpentStats = useMemo(
    () => parentDashboardService.getTimeSpent(currentChildId),
    [currentChildId, sessions]
  );

  const topicsExplored: TopicsExploredStats = useMemo(
    () => parentDashboardService.getTopicsExplored(currentChildId),
    [currentChildId, sessions]
  );

  // Notification Toast Helper
  const showToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 4500);
  };

  // --------------------------------------------------------------------------
  // SETTINGS CONTROLS
  // --------------------------------------------------------------------------
  const handleTimeLimitChange = (minutes: number) => {
    const updated = parentSettingsService.updateSettings({ dailyTimeLimitMinutes: minutes });
    setSettings(updated);
    showToast(minutes === 0 ? 'Daily speaking limit set to Unlimited.' : `Daily speaking limit set to ${minutes} minutes.`);
  };

  const handleToggleCategory = (category: TopicCategory) => {
    const current = settings.disabledCategories || [];
    const exists = current.includes(category);
    const updated = exists ? current.filter((c) => c !== category) : [...current, category];

    const saved = parentSettingsService.updateSettings({ disabledCategories: updated });
    setSettings(saved);
    showToast(`${category} ${exists ? 'enabled for topic wheel.' : 'disabled from topic wheel.'}`);
  };

  const handleToggleGentleMode = () => {
    const nextVal = !settings.gentleModeDefault;
    const updated = parentSettingsService.updateSettings({ gentleModeDefault: nextVal });
    setSettings(updated);
    showToast(nextVal ? 'Gentle Mode turned ON: Pace & filler words are ignored.' : 'Gentle Mode turned OFF: Standard feedback active.');
  };

  const handleToggleRecordingStorage = () => {
    const nextVal = !settings.storeRecordingsOptIn;
    const updated = parentSettingsService.updateSettings({ storeRecordingsOptIn: nextVal });
    setSettings(updated);
    showToast(nextVal ? 'Audio Recording Storage enabled (auto-deleted after 30 days).' : 'Audio Recording Storage disabled (kept only in browser memory).');
  };

  const handleToggleFaceAnalysis = () => {
    const nextVal = !settings.faceAnalysisEnabled;
    const updated = parentSettingsService.updateSettings({ faceAnalysisEnabled: nextVal });
    setSettings(updated);
    showToast(nextVal ? 'Face & Smile Analysis active.' : 'Voice-Only Mode enabled: Camera visual analysis turned off.');
  };

  const handleToggleEmailSummaries = () => {
    const nextVal = !settings.emailSummariesOptIn;
    const updated = parentSettingsService.updateSettings({ emailSummariesOptIn: nextVal });
    setSettings(updated);
    showToast(nextVal ? 'Weekly progress email summaries enabled.' : 'Weekly progress emails disabled.');
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    parentSafetyAlertService.markAsReviewed(alertId);
    setAlerts(parentSafetyAlertService.getAlerts(currentChildId));
    showToast('Safety alert marked as reviewed.');
  };

  // --------------------------------------------------------------------------
  // EXPORTS & DOWNLOADS
  // --------------------------------------------------------------------------
  const triggerFileDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDownloadJSON = () => {
    const jsonStr = parentDashboardService.exportChildDataJSON(parentId, currentChildId);
    const childName = activeChild?.nickname || 'Leo';
    const dateStr = new Date().toISOString().split('T')[0];
    triggerFileDownload(jsonStr, `speakup-stars-${childName}-data-${dateStr}.json`, 'application/json');
    refreshData();
    showToast('Data downloaded as JSON. Export logged.');
  };

  const handleDownloadCSV = () => {
    const csvStr = parentDashboardService.exportChildDataCSV(parentId, currentChildId);
    const childName = activeChild?.nickname || 'Leo';
    const dateStr = new Date().toISOString().split('T')[0];
    triggerFileDownload(csvStr, `speakup-stars-${childName}-sessions-${dateStr}.csv`, 'text/csv;charset=utf-8;');
    refreshData();
    showToast('Data downloaded as CSV. Export logged.');
  };

  const handleClearDashboard = () => {
    if (window.confirm('Clear all dashboard sessions and start with a fresh empty board?')) {
      parentDashboardService.clearAllDashboardData(currentChildId, parentId);
      refreshData();
      showToast('Dashboard successfully cleared to a fresh empty state.');
    }
  };

  // --------------------------------------------------------------------------
  // DELETIONS DISPATCH WITH PIN
  // --------------------------------------------------------------------------
  const handleOpenDeleteSession = (session: SpeakingSessionRecord) => {
    setDeletionConfig({
      isOpen: true,
      title: 'Delete Single Practice Session',
      description: `Permanently erase all recordings, scrubbed transcripts, and metrics for this session.`,
      itemDetails: `Topic: "${session.topicTitle}" • Recorded on ${new Date(session.createdAt).toLocaleDateString()}`,
      scope: 'session',
      targetId: session.id,
    });
  };

  const handleOpenDeleteChild = () => {
    const childName = activeChild?.nickname || 'this child';
    setDeletionConfig({
      isOpen: true,
      title: `Delete All Data for ${childName}`,
      description: `Irreversibly delete all speaking sessions, transcripts, star points, streak days, badges, and audio recordings for ${childName}.`,
      itemDetails: `Child Profile ID: ${currentChildId} • Nickname: ${childName}`,
      scope: 'child',
      targetId: currentChildId,
    });
  };

  const handleOpenDeleteAccount = () => {
    setDeletionConfig({
      isOpen: true,
      title: 'Delete Entire Parent & Family Account',
      description: `Permanently erase your parent account, all child profiles, consent records, sessions, recordings, and settings. This cannot be undone.`,
      itemDetails: `Account: ${parentEmail} • Under COPPA & GDPR-K, all data will be purged immediately.`,
      scope: 'account',
      targetId: parentId,
    });
  };

  const handleExecuteConfirmedDeletion = async () => {
    if (deletionConfig.scope === 'session') {
      const receipt = await parentDashboardService.deleteSession(deletionConfig.targetId, parentId, parentEmail);
      refreshData();
      showToast(receipt.message);
    } else if (deletionConfig.scope === 'child') {
      const receipt = await parentDashboardService.deleteChildData(deletionConfig.targetId, parentId, parentEmail);
      refreshData();
      showToast(receipt.message);
    } else if (deletionConfig.scope === 'account') {
      const receipt = await parentDashboardService.deleteWholeAccount(parentId, parentEmail);
      exitParentMode();
      navigate('/');
      alert(receipt.message);
    }
  };

  const handleReturnToChildMode = () => {
    exitParentMode();
    navigate('/');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Top Banner */}
      <div className="rounded-3xl sm:rounded-4xl bg-gradient-to-r from-purple-700 via-indigo-700 to-sky-700 p-5 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-heading font-bold shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Grown-Up Zone • Sole Legal Account Holder</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-black">
              Parent & Guardian Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-purple-100 font-medium max-w-xl">
              Account: <strong>{parentEmail}</strong>. Monitor skill progression, enforce daily limits, and manage irreversible COPPA/GDPR data rights.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 text-white border-white/30 hover:bg-white/20 text-xs flex-1 sm:flex-initial"
              icon={<ArrowLeft className="w-4 h-4" />}
              onClick={handleReturnToChildMode}
            >
              Back to Child Mode
            </Button>
            {!parent && (
              <Button
                variant="sunny"
                size="sm"
                className="text-xs flex-1 sm:flex-initial"
                onClick={() => setIsOnboardingModalOpen(true)}
              >
                Set Up Parent Account
              </Button>
            )}
          </div>
        </div>

        {/* Child Selector Tabs */}
        <div className="mt-6 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-purple-200 font-heading font-bold">Child Profile:</span>
            <div className="flex flex-wrap gap-1.5">
              {(childrenList.length > 0
                ? childrenList
                : [{ id: 'default_leo', nickname: 'Leo', ageBand: '6-8' as AgeGroup, avatarId: '🦁', parentId: 'demo_parent', createdAt: '' }]
              ).map((child) => {
                const isSelected = child.id === currentChildId;
                return (
                  <button
                    key={child.id}
                    onClick={() => selectActiveChild(child)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-heading font-bold text-xs transition-all ${
                      isSelected
                        ? 'bg-white text-purple-900 shadow-md scale-105'
                        : 'bg-white/15 text-white hover:bg-white/25'
                    }`}
                  >
                    <span>{child.avatarId === 'lion' ? '🦁' : child.avatarId || '⭐'}</span>
                    <span>{child.nickname}</span>
                    <span className="text-[10px] opacity-80">({child.ageBand})</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-purple-200">Mode:</span>
            <span className="text-xs font-bold bg-emerald-500/30 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-400/40">
              PIN-Authenticated
            </span>
          </div>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('progress')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-heading font-black text-xs sm:text-sm transition-all ${
              activeTab === 'progress'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Growth & Progress</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-heading font-black text-xs sm:text-sm transition-all ${
              activeTab === 'privacy'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Privacy & Data Rights</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 hidden sm:block">
          COPPA & GDPR-K Verified Controls
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {statusToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3.5 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-center justify-between text-xs sm:text-sm text-emerald-950 font-semibold shadow-xs"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{statusToast}</span>
            </div>
            <button onClick={() => setStatusToast(null)} className="text-emerald-700 hover:text-emerald-900 font-bold ml-2">
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================================================================== */}
      {/* TAB 1: GROWTH & PROGRESS SECTION                                     */}
      {/* ==================================================================== */}
      {activeTab === 'progress' && (
        <div className="space-y-6">
          {/* Quiet Safety Alerts Banner if detected */}
          {alerts.length > 0 && (
            <Card variant="white" padding="md" className="border-2 border-amber-300 bg-amber-50/70 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-200 text-amber-800 flex items-center justify-center shrink-0">
                    <Heart className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-sm text-amber-950">
                      Confidential Parent Safety Alert (AI Input Filter)
                    </h3>
                    <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">
                      Sparky detected words indicating possible distress or harm. Sparky immediately provided a gentle, reassuring message to your child without alarming them. No scary notices were displayed in child mode.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-amber-200">
                {alerts.map((al) => (
                  <div
                    key={al.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white rounded-xl border border-amber-200 text-xs"
                  >
                    <div>
                      <span className="font-mono text-[11px] text-slate-500">
                        {new Date(al.timestamp).toLocaleString()}
                      </span>
                      <p className="font-bold text-slate-800 mt-0.5">
                        Matched terms: <code className="text-amber-800">{al.matchedKeywords.join(', ')}</code>
                      </p>
                    </div>
                    {al.reviewedByParent ? (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-md self-start sm:self-auto">
                        ✓ Reviewed by Parent
                      </span>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs border-amber-300 hover:bg-amber-100 self-start sm:self-auto"
                        onClick={() => handleAcknowledgeAlert(al.id)}
                      >
                        Acknowledge & Mark Reviewed
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Skill Trends: Charts on Laptop, Cards on Phone */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading font-black text-lg text-slate-800">
                  Skill Progression Trends
                </h2>
                <p className="text-xs text-slate-500">
                  Adaptive metrics evaluated across speaking practice sessions
                </p>
              </div>
            </div>
            <SkillTrendsChart trends={skillTrends} />
          </div>

          {/* Time Spent & Practice Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card variant="white" padding="md" className="space-y-2 border border-slate-200">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-heading font-bold uppercase">Weekly Speaking Time</span>
                <Clock className="w-4 h-4 text-sky-500" />
              </div>
              <div className="text-3xl font-heading font-black text-slate-900">
                {timeSpent.weeklyMinutes} mins
              </div>
              <p className="text-xs text-slate-500 font-semibold">
                Across {timeSpent.totalSessions} total sessions
              </p>
            </Card>

            <Card variant="white" padding="md" className="space-y-2 border border-slate-200">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-heading font-bold uppercase">Total Time Invested</span>
                <Mic className="w-4 h-4 text-coral-500" />
              </div>
              <div className="text-3xl font-heading font-black text-slate-900">
                {timeSpent.totalMinutes} mins
              </div>
              <p className="text-xs text-emerald-600 font-bold">
                Average {timeSpent.averageSessionSeconds}s per speech
              </p>
            </Card>

            <Card variant="white" padding="md" className="space-y-2 border border-slate-200">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-heading font-bold uppercase">Topics Explored</span>
                <Award className="w-4 h-4 text-sunny-600" />
              </div>
              <div className="text-3xl font-heading font-black text-slate-900">
                {topicsExplored.uniqueTopicsCount} Topics
              </div>
              <p className="text-xs text-purple-600 font-bold">
                Across {topicsExplored.categories.length} categories
              </p>
            </Card>
          </div>

          {/* Two-Column Controls: Time Limits, Category Controls, Gentle Mode */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Daily Time Limits & Gentle Mode */}
            <div className="space-y-4">
              {/* Daily Time Limit Settings */}
              <Card variant="white" padding="md" className="border border-slate-200 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-heading font-black text-base text-slate-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-sky-600" />
                      Daily Speaking Time Limit
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Healthy boundaries: Sparky gently invites the child to rest when reached.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[0, 5, 10, 15, 20, 30].map((mins) => {
                    const isSelected = settings.dailyTimeLimitMinutes === mins;
                    return (
                      <button
                        key={mins}
                        onClick={() => handleTimeLimitChange(mins)}
                        className={`p-2.5 rounded-xl font-heading font-bold text-xs text-center transition-all ${
                          isSelected
                            ? 'bg-sky-600 text-white shadow-xs scale-105'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {mins === 0 ? 'Unlimited' : `${mins} min`}
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* Gentle Mode Toggle */}
              <Card variant="white" padding="md" className="border border-slate-200 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="font-heading font-black text-base text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      Gentle Mode
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Recommended for shy or younger children. Completely disables pace (WPM), pause count, and filler-word metrics, focusing strictly on ideas and bravery.
                    </p>
                  </div>
                  <button
                    onClick={handleToggleGentleMode}
                    className="text-purple-600 hover:text-purple-700 transition-transform active:scale-95 shrink-0"
                    aria-label="Toggle Gentle Mode"
                  >
                    {settings.gentleModeDefault ? (
                      <ToggleRight className="w-9 h-9 text-purple-600" />
                    ) : (
                      <ToggleLeft className="w-9 h-9 text-slate-300" />
                    )}
                  </button>
                </div>
                <div className="p-2.5 bg-purple-50 rounded-xl text-[11px] text-purple-900 font-medium">
                  Status: <strong>{settings.gentleModeDefault ? 'Gentle Mode Active (Praise-Only)' : 'Standard Feedback Active'}</strong>
                </div>
              </Card>
            </div>

            {/* Right: Category Controls */}
            <div>
              <Card variant="white" padding="md" className="border border-slate-200 space-y-4 h-full">
                <div>
                  <h3 className="font-heading font-black text-base text-slate-900 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-mint-600" />
                    Topic Category Controls
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Filter out any topic themes you prefer your child not to encounter on the wheel.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {ALL_CATEGORIES.map((cat) => {
                    const isDisabled = (settings.disabledCategories || []).includes(cat);
                    return (
                      <button
                        key={cat}
                        onClick={() => handleToggleCategory(cat)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                          isDisabled
                            ? 'bg-rose-50 border-rose-200 text-rose-800'
                            : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        <span className="font-heading font-bold">{cat}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isDisabled ? 'bg-rose-200 text-rose-900' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isDisabled ? 'Blocked' : 'Enabled'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: PRIVACY & DATA RIGHTS SECTION                                 */}
      {/* ==================================================================== */}
      {activeTab === 'privacy' && (
        <div className="space-y-6">
          {/* Data Transparency & Export Hub Card */}
          <Card variant="white" padding="md" className="border-2 border-purple-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                  Complete Data Transparency
                </span>
                <h2 className="font-heading font-black text-lg text-slate-900 mt-1">
                  Access & Download Your Family's Data
                </h2>
                <p className="text-xs text-slate-500">
                  Inspect every record stored in our database or download standard portable formats anytime.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="sky"
                  size="sm"
                  className="text-xs"
                  icon={<FileText className="w-3.5 h-3.5" />}
                  onClick={() => setIsSeeAllDataOpen(true)}
                >
                  See All Data We Have
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs border-slate-300"
                  icon={<Download className="w-3.5 h-3.5" />}
                  onClick={handleDownloadJSON}
                >
                  Download JSON
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs border-slate-300"
                  icon={<Download className="w-3.5 h-3.5" />}
                  onClick={handleDownloadCSV}
                >
                  Download CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs border-amber-300 text-amber-800 hover:bg-amber-50"
                  icon={<RefreshCw className="w-3.5 h-3.5" />}
                  onClick={handleClearDashboard}
                >
                  Clear Dashboard
                </Button>
              </div>
            </div>

            {/* Audit Log Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-slate-400 font-heading font-bold text-[10px] uppercase block">
                  Last Data Export
                </span>
                <span className="font-bold text-slate-800 text-xs sm:text-sm">
                  {settings.lastExportDate
                    ? new Date(settings.lastExportDate).toLocaleString()
                    : 'Never exported'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-slate-400 font-heading font-bold text-[10px] uppercase block">
                  Last Data Deletion
                </span>
                <span className="font-bold text-slate-800 text-xs sm:text-sm">
                  {settings.lastDeletionDate
                    ? `${new Date(settings.lastDeletionDate).toLocaleString()}`
                    : 'No deletions recorded'}
                </span>
                {settings.lastDeletionDetails && (
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {settings.lastDeletionDetails}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Consent Toggles: Change Anytime */}
          <Card variant="white" padding="md" className="border border-slate-200 space-y-4">
            <div>
              <h3 className="font-heading font-black text-base text-slate-900">
                Parental Consent Choices (Change Anytime)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Under COPPA & GDPR-K, you have full authority to revoke or grant consent with zero penalty.
              </p>
            </div>

            <div className="space-y-3">
              {/* Audio Recording Storage */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="space-y-0.5 pr-4">
                  <p className="font-heading font-bold text-sm text-slate-800">
                    Audio & Video Recording Storage
                  </p>
                  <p className="text-xs text-slate-500">
                    Default is strictly OFF. When enabled, recordings are encrypted with short-lived signed URLs and auto-deleted in 30 days.
                  </p>
                </div>
                <button
                  onClick={handleToggleRecordingStorage}
                  className="text-purple-600 hover:text-purple-700 shrink-0"
                  aria-label="Toggle Recording Storage"
                >
                  {settings.storeRecordingsOptIn ? (
                    <ToggleRight className="w-8 h-8 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-300" />
                  )}
                </button>
              </div>

              {/* Face Analysis Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="space-y-0.5 pr-4">
                  <p className="font-heading font-bold text-sm text-slate-800">
                    On-Device Face & Smile Analysis
                  </p>
                  <p className="text-xs text-slate-500">
                    Calculates positive eye contact and smiles in browser memory without storing video frames or biometric voiceprints. Turn off for Voice-Only Mode.
                  </p>
                </div>
                <button
                  onClick={handleToggleFaceAnalysis}
                  className="text-purple-600 hover:text-purple-700 shrink-0"
                  aria-label="Toggle Face Analysis"
                >
                  {settings.faceAnalysisEnabled ? (
                    <ToggleRight className="w-8 h-8 text-sky-600" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-300" />
                  )}
                </button>
              </div>

              {/* Weekly Progress Emails */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="space-y-0.5 pr-4">
                  <p className="font-heading font-bold text-sm text-slate-800">
                    Weekly Progress Emails
                  </p>
                  <p className="text-xs text-slate-500">
                    Sends a gentle summary of speaking minutes and badges to <code>{parentEmail}</code>. Zero marketing ads.
                  </p>
                </div>
                <button
                  onClick={handleToggleEmailSummaries}
                  className="text-purple-600 hover:text-purple-700 shrink-0"
                  aria-label="Toggle Weekly Email Summaries"
                >
                  {settings.emailSummariesOptIn ? (
                    <ToggleRight className="w-8 h-8 text-purple-600" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-300" />
                  )}
                </button>
              </div>
            </div>
          </Card>

          {/* Session Deletion Table (Laptop) / Cards (Phone) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-black text-base text-slate-900">
                  Individual Practice Sessions
                </h3>
                <p className="text-xs text-slate-500">
                  Delete any single recording and its transcript with PIN confirmation.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {sessions.length} Sessions Stored
              </span>
            </div>

            {/* Empty State */}
            {sessions.length === 0 && (
              <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-sky-50 flex items-center justify-center text-sky-600">
                  <Mic className="w-6 h-6" />
                </div>
                <h4 className="font-heading font-black text-slate-800 text-sm sm:text-base">
                  No practice sessions recorded yet
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  When your child finishes their first speech from the topic wheel, their practice metrics, growth score, and scrubbed transcript will appear here.
                </p>
              </div>
            )}

            {/* Laptop: Table Layout */}
            {sessions.length > 0 && (
              <div className="hidden md:block overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-heading font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Topic & Category</th>
                      <th className="p-3">Duration</th>
                      <th className="p-3">Score</th>
                      <th className="p-3">Scrubbed Transcript Preview</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sessions.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-slate-500 font-mono text-[11px]">
                          {new Date(s.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <span className="font-heading font-bold text-slate-800 block">{s.topicTitle}</span>
                          <span className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded font-medium">
                            {s.topicCategory}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-700">{s.durationSeconds}s</td>
                        <td className="p-3">
                          <span className="font-heading font-black text-emerald-600">{s.braveVoiceScore}</span>
                        </td>
                        <td className="p-3 text-slate-600 italic max-w-xs truncate">
                          "{s.scrubbedTranscript}"
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleOpenDeleteSession(s)}
                            className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg font-heading font-bold transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete Session
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Mobile: Cards Layout */}
            {sessions.length > 0 && (
              <div className="md:hidden space-y-2.5">
                {sessions.map((s) => (
                  <div key={s.id} className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-heading font-bold text-sm text-slate-800">{s.topicTitle}</p>
                        <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md font-bold">
                          {s.topicCategory}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-slate-400">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 italic line-clamp-2">
                      "{s.scrubbedTranscript}"
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-xs font-bold text-emerald-600">
                        Score: {s.braveVoiceScore} / 100
                      </span>
                      <button
                        onClick={() => handleOpenDeleteSession(s)}
                        className="text-xs text-rose-600 font-heading font-bold flex items-center gap-1 hover:text-rose-800"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Destructive Deletion Rights (GDPR-K & COPPA) */}
          <Card variant="white" padding="md" className="border-2 border-rose-200 bg-rose-50/40 space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                Permanent Right to Erasure
              </span>
              <h3 className="font-heading font-black text-lg text-slate-900">
                Irreversible Data Deletion Options
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Deletions immediately purge all database records, speech transcripts, audio files, and cache entries. A confirmation receipt will be emailed to <code>{parentEmail}</code>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="outline"
                size="md"
                className="text-rose-700 border-rose-300 hover:bg-rose-100 text-xs sm:text-sm font-heading font-black flex-1"
                icon={<Trash2 className="w-4 h-4 text-rose-600" />}
                onClick={handleOpenDeleteChild}
              >
                Delete All of This Child's Data
              </Button>

              <Button
                variant="coral"
                size="md"
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-heading font-black flex-1"
                icon={<Trash2 className="w-4 h-4" />}
                onClick={handleOpenDeleteAccount}
              >
                Delete My Whole Account
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODALS & DIALOGS                                                     */}
      {/* ==================================================================== */}

      {/* PIN Gate Modal for Initial Entry */}
      <PinGateModal
        isOpen={isPinGateOpen && !isParentMode}
        onClose={() => {
          setIsPinGateOpen(false);
          if (!isParentMode) navigate('/');
        }}
        onSuccess={() => setIsPinGateOpen(false)}
      />

      {/* PIN-Protected Deletion Modal */}
      <PinConfirmDeletionModal
        isOpen={deletionConfig.isOpen}
        title={deletionConfig.title}
        description={deletionConfig.description}
        itemDetails={deletionConfig.itemDetails}
        scope={deletionConfig.scope}
        onClose={() => setDeletionConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirmed={handleExecuteConfirmedDeletion}
      />

      {/* "See All Data We Have" Full Transparency Modal */}
      <SeeAllDataModal
        isOpen={isSeeAllDataOpen}
        onClose={() => setIsSeeAllDataOpen(false)}
        data={parentDashboardService.getAllDataWeHave(parentId, currentChildId)}
        onDownloadJSON={handleDownloadJSON}
        onDownloadCSV={handleDownloadCSV}
      />

      {/* Parent Onboarding Setup */}
      <ParentOnboardingModal
        isOpen={isOnboardingModalOpen}
        onClose={() => setIsOnboardingModalOpen(false)}
        onCompleted={() => {
          setIsOnboardingModalOpen(false);
          refreshData();
        }}
      />
    </div>
  );
};
