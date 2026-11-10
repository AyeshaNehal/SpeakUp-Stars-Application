/**
 * CHILD SAFE & ZERO-TRACKER DESIGN:
 * - 5-Dimension Skills Radar Chart (Laptop View)
 * - Pure SVG rendering (zero third-party tracker or heavy chart dependencies).
 * - Dimensions: Voice, Eye Contact, Clarity, Story, Energy.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { SkillScores } from '../../services/ai/aiFeedbackService';

interface SkillsRadarChartProps {
  scores: SkillScores;
  className?: string;
}

interface AxisConfig {
  key: keyof Omit<SkillScores, 'braveVoiceScore'>;
  label: string;
  emoji: string;
  color: string;
}

const AXES: AxisConfig[] = [
  { key: 'voice', label: 'Voice Flow', emoji: '🎙️', color: '#0ea5e9' },
  { key: 'eyeContact', label: 'Eye Contact', emoji: '👀', color: '#10b981' },
  { key: 'energy', label: 'Energy & Smile', emoji: '☀️', color: '#f59e0b' },
  { key: 'story', label: 'Story & Time', emoji: '📚', color: '#8b5cf6' },
  { key: 'clarity', label: 'Clarity', emoji: '✨', color: '#ec4899' },
];

export const SkillsRadarChart: React.FC<SkillsRadarChartProps> = ({ scores, className = '' }) => {
  const size = 320;
  const center = size / 2;
  const radius = 100;
  const totalAxes = AXES.length;

  // Compute coordinate for an axis at given percentage (0-100)
  const getCoordinates = (index: number, valuePct: number, offsetRadius = 0) => {
    // Start at top (-90 degrees) and rotate clockwise
    const angle = (Math.PI * 2 / totalAxes) * index - Math.PI / 2;
    const r = (radius + offsetRadius) * (valuePct / 100);
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Grid levels (25%, 50%, 75%, 100%)
  const gridLevels = [25, 50, 75, 100];

  // Polygon path for current data
  const dataPoints = AXES.map((axis, i) => {
    const val = Math.max(30, Math.min(100, scores[axis.key]));
    return getCoordinates(i, val);
  });
  const polygonPointsStr = dataPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <div className={`flex flex-col items-center justify-center p-3 select-none ${className}`}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full max-w-[320px] aspect-square overflow-visible"
        aria-label="Speaking skills breakdown radar chart"
      >
        <defs>
          <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fde047" stopOpacity="0.65" />
            <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.25" />
          </radialGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Concentric Web Grid Polygons */}
        {gridLevels.map((lvl) => {
          const gridPoints = AXES.map((_, i) => getCoordinates(i, lvl))
            .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
            .join(' ');

          return (
            <polygon
              key={lvl}
              points={gridPoints}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={lvl === 100 ? '2' : '1'}
              strokeDasharray={lvl === 100 ? '' : '3 3'}
            />
          );
        })}

        {/* Radial Axis Lines */}
        {AXES.map((_, i) => {
          const end = getCoordinates(i, 100);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={end.x}
              y2={end.y}
              stroke="#cbd5e1"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Data Polygon Fill */}
        <motion.polygon
          initial={{ opacity: 0, scale: 0.2 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ transformOrigin: `${center}px ${center}px` }}
          points={polygonPointsStr}
          fill="url(#radarFill)"
          stroke="#0284c7"
          strokeWidth="3"
          filter="url(#glow)"
        />

        {/* Vertex Markers and Interactive Badges */}
        {dataPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="5"
            fill="#facc15"
            stroke="#1e293b"
            strokeWidth="2"
          />
        ))}

        {/* Outer Axis Labels */}
        {AXES.map((axis, i) => {
          // Label coordinate slightly outside the max radius
          const labelCoord = getCoordinates(i, 100, 24);
          const scoreVal = scores[axis.key];

          return (
            <g key={axis.key} transform={`translate(${labelCoord.x}, ${labelCoord.y})`}>
              <text
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[11px] font-heading font-black fill-slate-800"
              >
                {axis.emoji} {axis.label}
              </text>
              <text
                textAnchor="middle"
                dominantBaseline="central"
                y="14"
                className="text-[10px] font-heading font-extrabold fill-sky-700"
              >
                {scoreVal}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
