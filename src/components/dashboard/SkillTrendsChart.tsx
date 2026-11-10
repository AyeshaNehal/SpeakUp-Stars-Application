/**
 * CHILD PRIVACY NOTE:
 * - Skill Trends Chart
 * - Laptop / Desktop: Interactive multi-line SVG trend chart showing Brave Voice, Eye Contact, and Steadiness.
 * - Mobile / Phone: Responsive simplified cards with progress bars and growth indicators.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Eye, Sparkles, Activity } from 'lucide-react';
import { Card } from '../common/Card';
import { SkillTrends } from '../../services/dashboard/parentDashboardService';

interface SkillTrendsChartProps {
  trends: SkillTrends;
}

export const SkillTrendsChart: React.FC<SkillTrendsChartProps> = ({ trends }) => {
  const [activeMetric, setActiveMetric] = useState<'brave' | 'eye' | 'all'>('all');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const bravePoints = trends.braveVoiceTrend;
  const eyePoints = trends.eyeContactTrend;

  // Chart dimensions
  const width = 640;
  const height = 240;
  const padding = { top: 20, right: 30, bottom: 35, left: 40 };

  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const count = Math.max(bravePoints.length, 1);
  const stepX = count > 1 ? plotW / (count - 1) : plotW / 2;

  // Coordinate mappers (0-100 scale)
  const getX = (idx: number) => padding.left + (count > 1 ? idx * stepX : plotW / 2);
  const getY = (val: number) => padding.top + plotH - (Math.min(100, Math.max(0, val)) / 100) * plotH;

  // Generate SVG path d string
  const createPath = (data: { score?: number; ratio?: number }[], key: 'score' | 'ratio') => {
    if (data.length === 0) return '';
    return data
      .map((item, i) => {
        const val = item[key] !== undefined ? (item[key] as number) : 0;
        const x = getX(i);
        const y = getY(val);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  const bravePath = createPath(bravePoints, 'score');
  const eyePath = createPath(eyePoints, 'ratio');

  return (
    <div className="space-y-4">
      {/* Top Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[11px] font-heading font-bold uppercase">Brave Voice</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-heading font-black text-emerald-950">
              {trends.averageBraveVoice}
            </span>
            <span className="text-xs font-bold text-emerald-600">/ 100</span>
          </div>
          <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
            +{trends.improvementPercentage}% growth
          </p>
        </div>

        <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-2xl">
          <div className="flex items-center justify-between text-sky-800">
            <span className="text-[11px] font-heading font-bold uppercase">Eye Contact</span>
            <Eye className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-heading font-black text-sky-950">
              {trends.averageEyeContact}%
            </span>
            <span className="text-xs font-bold text-sky-600">focus</span>
          </div>
          <p className="text-[10px] text-sky-700 font-semibold mt-0.5">
            Looking at camera
          </p>
        </div>

        <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-2xl">
          <div className="flex items-center justify-between text-purple-800">
            <span className="text-[11px] font-heading font-bold uppercase">Speaking Pace</span>
            <Activity className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-heading font-black text-purple-950">
              {trends.averageWpm}
            </span>
            <span className="text-xs font-bold text-purple-600">WPM</span>
          </div>
          <p className="text-[10px] text-purple-700 font-semibold mt-0.5">
            Age-appropriate rhythm
          </p>
        </div>

        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-[11px] font-heading font-bold uppercase">Consistency</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-heading font-black text-amber-950">
              Steady
            </span>
          </div>
          <p className="text-[10px] text-amber-700 font-semibold mt-0.5">
            Voice volume smooth
          </p>
        </div>
      </div>

      {/* Laptop / Desktop View: Multi-line SVG Trend Chart */}
      <div className="hidden sm:block">
        <Card variant="white" padding="md" className="border border-slate-200 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-slate-800 text-sm">
                Speaking Growth Over Sessions
              </h3>
              <p className="text-xs text-slate-400">
                Visual progression across recent practice recordings
              </p>
            </div>

            {/* Toggle Legend Pills */}
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setActiveMetric('all')}
                className={`px-2.5 py-1 rounded-lg font-heading font-bold transition-colors ${
                  activeMetric === 'all'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Metrics
              </button>
              <button
                onClick={() => setActiveMetric('brave')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-heading font-bold transition-colors ${
                  activeMetric === 'brave'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Brave Voice
              </button>
              <button
                onClick={() => setActiveMetric('eye')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-heading font-bold transition-colors ${
                  activeMetric === 'eye'
                    ? 'bg-sky-600 text-white'
                    : 'bg-sky-50 text-sky-700 hover:bg-sky-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                Eye Contact
              </button>
            </div>
          </div>

          {/* SVG Canvas Container */}
          {bravePoints.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Activity className="w-5 h-5" />
              </div>
              <p className="font-heading font-bold text-slate-700 text-sm">
                No growth curves recorded yet
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                After your child's first speech practice, their Brave Voice, Eye Contact, and Pacing trends will chart here.
              </p>
            </div>
          ) : (
            <div className="relative w-full aspect-[640/240] select-none">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-full overflow-visible"
            >
              {/* Grid Lines */}
              {[0, 25, 50, 75, 100].map((level) => {
                const y = getY(level);
                return (
                  <g key={level}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={width - padding.right}
                      y2={y}
                      stroke="#E2E8F0"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x={padding.left - 8}
                      y={y + 3}
                      textAnchor="end"
                      fontSize="10"
                      fill="#94A3B8"
                      className="font-mono font-medium"
                    >
                      {level}
                    </text>
                  </g>
                );
              })}

              {/* X Axis Labels */}
              {bravePoints.map((p, i) => {
                const x = getX(i);
                return (
                  <text
                    key={i}
                    x={x}
                    y={height - 10}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#64748B"
                    className="font-heading font-bold"
                  >
                    {p.date}
                  </text>
                );
              })}

              {/* Eye Contact Line (Sky Blue) */}
              {(activeMetric === 'all' || activeMetric === 'eye') && eyePath && (
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  d={eyePath}
                  fill="none"
                  stroke="#0284C7"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Brave Voice Line (Emerald Green) */}
              {(activeMetric === 'all' || activeMetric === 'brave') && bravePath && (
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  d={bravePath}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Dots and interactive hover targets */}
              {bravePoints.map((p, i) => {
                const x = getX(i);
                const yBrave = getY(p.score);
                const yEye = getY(eyePoints[i]?.ratio || 0);

                return (
                  <g key={i}>
                    {(activeMetric === 'all' || activeMetric === 'eye') && (
                      <circle
                        cx={x}
                        cy={yEye}
                        r="4"
                        fill="#0284C7"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                      />
                    )}
                    {(activeMetric === 'all' || activeMetric === 'brave') && (
                      <circle
                        cx={x}
                        cy={yBrave}
                        r="5"
                        fill="#10B981"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredIdx(i)}
                        onMouseLeave={() => setHoveredIdx(null)}
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip */}
            {hoveredIdx !== null && bravePoints[hoveredIdx] && (
              <div
                className="absolute z-10 bg-slate-900 text-white text-xs px-3 py-2 rounded-xl shadow-lg pointer-events-none -translate-x-1/2 -translate-y-12"
                style={{
                  left: `${(getX(hoveredIdx) / width) * 100}%`,
                  top: `${(getY(bravePoints[hoveredIdx].score) / height) * 100}%`,
                }}
              >
                <p className="font-heading font-bold text-emerald-400">
                  Brave Voice: {bravePoints[hoveredIdx].score} / 100
                </p>
                <p className="text-sky-300">
                  Eye Contact: {eyePoints[hoveredIdx]?.ratio || 0}%
                </p>
                <p className="text-[10px] text-slate-300">{bravePoints[hoveredIdx].date}</p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>

    {/* Mobile View: Simplified Stacked Cards */}
    <div className="sm:hidden space-y-2.5">
      <Card variant="white" padding="sm" className="space-y-3 border border-slate-200">
        <h4 className="font-heading font-bold text-xs text-slate-800">
          Recent Practice Sessions
        </h4>
        {bravePoints.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">
            No practice sessions recorded yet.
          </p>
        ) : (
          <div className="space-y-2">
            {bravePoints.slice(0, 4).map((p, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs"
              >
                <span className="font-heading font-bold text-slate-700">{p.date}</span>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-700 font-bold">
                    🦁 {p.score} pts
                  </span>
                  <span className="text-sky-700 font-bold">
                    👀 {eyePoints[i]?.ratio || 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
    </div>
  );
};
