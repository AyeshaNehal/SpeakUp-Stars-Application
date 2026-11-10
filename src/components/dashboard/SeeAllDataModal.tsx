/**
 * CHILD PRIVACY NOTE (Rule 1, Rule 2, Rule 5):
 * - "See All Data We Have" Transparency Modal
 * - Full audit view of stored child records, sessions, metrics, scrubbed transcripts, and badges.
 * - Responsive: Table layout on laptop/desktop, simplified stacked cards on mobile.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShieldCheck,
  FileText,
  Mic,
  Award,
  Sparkles,
  Download,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';

interface SeeAllDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  onDownloadJSON: () => void;
  onDownloadCSV: () => void;
}

export const SeeAllDataModal: React.FC<SeeAllDataModalProps> = ({
  isOpen,
  onClose,
  data,
  onDownloadJSON,
  onDownloadCSV,
}) => {
  const [activeTab, setActiveTab] = useState<'sessions' | 'transcripts' | 'badges' | 'profile'>('sessions');

  if (!isOpen || !data) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border-2 border-slate-200 overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 bg-gradient-to-r from-purple-700 via-indigo-700 to-sky-700 text-white flex items-center justify-between shrink-0">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-300" />
                <span className="text-xs uppercase font-heading font-bold tracking-wider text-purple-200">
                  Data Transparency & COPPA Compliance
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-heading font-black">
                See All Data We Have
              </h2>
              <p className="text-xs text-purple-100">
                Transparent audit of profile, sessions, metrics, scrubbed speech, and badges.
              </p>
            </div>

            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Quick Actions Bar */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Tabs */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'sessions', label: `Sessions (${data.sessions?.length || 0})`, icon: Mic },
                { id: 'transcripts', label: 'Scrubbed Transcripts', icon: FileText },
                { id: 'badges', label: `Badges (${data.badgesEarned?.length || 0})`, icon: Award },
                { id: 'profile', label: 'Child Profile & Legal', icon: Lock },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-heading font-bold text-xs transition-colors ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-slate-300 bg-white"
                icon={<Download className="w-3.5 h-3.5" />}
                onClick={onDownloadJSON}
              >
                Download JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-slate-300 bg-white"
                icon={<Download className="w-3.5 h-3.5" />}
                onClick={onDownloadCSV}
              >
                Download CSV
              </Button>
            </div>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* TAB 1: SESSIONS & METRICS */}
            {activeTab === 'sessions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Showing all speaking session metrics tied to this child profile.</span>
                  <span className="font-bold text-slate-700">
                    Total Time: {data.sessionsSummary?.totalTimeMinutes || 0} mins
                  </span>
                </div>

                {/* Laptop: Table Layout */}
                <div className="hidden md:block overflow-x-auto border border-slate-200 rounded-2xl shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-heading font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Date</th>
                        <th className="p-3">Topic & Category</th>
                        <th className="p-3">Duration</th>
                        <th className="p-3">Brave Voice</th>
                        <th className="p-3">WPM</th>
                        <th className="p-3">Eye Contact</th>
                        <th className="p-3">Pauses / Fillers</th>
                        <th className="p-3">Audio Storage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {data.sessions?.map((s: any) => (
                        <tr key={s.id} className="hover:bg-purple-50/50 transition-colors">
                          <td className="p-3 text-slate-500 font-mono text-[11px]">
                            {new Date(s.date).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            <p className="font-bold text-slate-800">{s.topic}</p>
                            <span className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded font-medium">
                              {s.category}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-slate-700">{s.durationSeconds}s</td>
                          <td className="p-3">
                            <span className="font-heading font-black text-emerald-600 text-sm">
                              {s.braveVoiceScore}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-medium">{s.growthLevel}</span>
                          </td>
                          <td className="p-3 text-slate-600">{s.metrics?.wpm} WPM</td>
                          <td className="p-3 text-slate-600 font-semibold">{s.metrics?.eyeContactPercentage}%</td>
                          <td className="p-3 text-slate-500">
                            {s.metrics?.pauseCount}p / {s.metrics?.fillerWordsCount}f
                          </td>
                          <td className="p-3">
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600">
                              {s.recordingStored ? 'Encrypted (Opt-In)' : 'Memory Only (Discarded)'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile: Cards Layout */}
                <div className="md:hidden space-y-3">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {data.sessions?.map((s: any) => (
                    <Card key={s.id} variant="white" padding="sm" className="space-y-2 border border-slate-200">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-heading font-bold text-sm text-slate-900">{s.topic}</p>
                          <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md font-bold">
                            {s.category}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-slate-400">
                          {new Date(s.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs py-1 bg-slate-50 rounded-xl">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-heading uppercase">Score</span>
                          <span className="font-heading font-black text-emerald-600">{s.braveVoiceScore}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-heading uppercase">Pace</span>
                          <span className="font-bold text-slate-700">{s.metrics?.wpm} WPM</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-heading uppercase">Eye Focus</span>
                          <span className="font-bold text-slate-700">{s.metrics?.eyeContactPercentage}%</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: SCRUBBED TRANSCRIPTS */}
            {activeTab === 'transcripts' && (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-xs text-emerald-900">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-heading font-bold text-sm">PII Scrubber Guarantee</p>
                    <p className="mt-0.5">
                      All transcripts are sanitized on-device BEFORE saving. Real names, addresses, phone numbers, and schools are replaced with brackets (e.g. <code>[NAME]</code>, <code>[SCHOOL]</code>).
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {data.sessions?.map((s: any) => (
                    <div key={s.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-heading font-bold text-slate-800">{s.topic}</span>
                        <span className="text-slate-400 font-mono text-[11px]">{new Date(s.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 italic bg-white p-3 rounded-xl border border-slate-200 font-serif">
                        "{s.scrubbedTranscript || 'No speech transcript recorded.'}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: BADGES & REWARDS */}
            {activeTab === 'badges' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {data.badgesEarned?.map((b: any) => (
                    <div key={b.key} className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl flex items-start gap-3">
                      <span className="text-3xl">🌟</span>
                      <div className="space-y-1">
                        <p className="font-heading font-black text-sm text-slate-800">{b.name}</p>
                        <p className="text-xs text-slate-600">{b.description}</p>
                        <span className="text-[10px] text-amber-700 font-mono block">
                          Unlocked: {new Date(b.unlockedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
                  <h4 className="font-heading font-bold text-slate-800">Rewards Vault Summary</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-heading uppercase">Star Points</span>
                      <span className="font-heading font-black text-lg text-amber-600">
                        {data.rewardsVault?.starPointsBalance || 0} ⭐
                      </span>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-heading uppercase">Daily Streak</span>
                      <span className="font-heading font-black text-lg text-coral-600">
                        {data.rewardsVault?.dailyStreakDays || 0} Days 🔥
                      </span>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-heading uppercase">Streak Freezes</span>
                      <span className="font-heading font-black text-lg text-sky-600">
                        {data.rewardsVault?.streakFreezesRemaining || 0} Shield 🛡️
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: CHILD PROFILE & LEGAL */}
            {activeTab === 'profile' && (
              <div className="space-y-4 text-xs">
                <Card variant="white" padding="md" className="space-y-3 border border-slate-200">
                  <h4 className="font-heading font-black text-sm text-slate-800">Child Profile Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-slate-400 uppercase text-[10px] block font-heading">Nickname</span>
                      <span className="font-bold text-slate-800 text-sm">{data.childProfile?.nickname}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-slate-400 uppercase text-[10px] block font-heading">Age Band</span>
                      <span className="font-bold text-slate-800 text-sm">Ages {data.childProfile?.ageBand}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-slate-400 uppercase text-[10px] block font-heading">Child ID</span>
                      <span className="font-mono text-slate-600 text-xs">{data.childProfile?.id}</span>
                    </div>
                  </div>
                </Card>

                <Card variant="mint" padding="md" className="space-y-2 border border-emerald-200">
                  <h4 className="font-heading font-black text-sm text-emerald-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Children's Privacy Protection (COPPA & GDPR-K)
                  </h4>
                  <ul className="space-y-1.5 text-emerald-900 leading-relaxed">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {data.dataGovernanceGuarantees?.map((g: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{g}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close Viewer
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
