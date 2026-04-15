'use client';

import { useState } from 'react';
import type { TransportSegment, TransportMode } from '@/lib/types';
import { TRANSPORT_CONFIG } from '@/lib/types';

interface TransportSegmentCardProps {
  segment: TransportSegment;
  onEdit: (segment: TransportSegment) => void;
}

function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '--';
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${minutes} min`;
}

const TRANSPORT_MODES: TransportMode[] = [
  'shinkansen', 'train', 'bus', 'walk', 'taxi', 'car', 'flight', 'ferry',
];

export default function TransportSegmentCard({
  segment,
  onEdit,
}: TransportSegmentCardProps) {
  const [showModeSelect, setShowModeSelect] = useState(false);
  const config = TRANSPORT_CONFIG[segment.mode] || TRANSPORT_CONFIG.train;

  function handleModeChange(mode: TransportMode) {
    setShowModeSelect(false);
    if (mode !== segment.mode) {
      onEdit({ ...segment, mode });
    }
  }

  return (
    <div className="flex items-stretch py-1 px-4">
      {/* Vertical dashed connector line */}
      <div className="flex flex-col items-center mr-3 w-7">
        <div className="flex-1 border-l-2 border-dashed border-slate-300" />
      </div>

      {/* Content */}
      <div className="flex items-center gap-3 text-sm text-slate-500 py-2 flex-1 min-w-0">
        {/* Mode selector */}
        <div className="relative">
          <button
            onClick={() => setShowModeSelect(!showModeSelect)}
            className="flex items-center gap-1 hover:bg-slate-100 px-2 py-1 rounded transition-colors"
            title="Change transport mode"
          >
            <span>{config.icon}</span>
            <span className="font-medium" style={{ color: config.color }}>
              {config.label}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {showModeSelect && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 min-w-[160px]">
              {TRANSPORT_MODES.map((mode) => {
                const modeConfig = TRANSPORT_CONFIG[mode];
                return (
                  <button
                    key={mode}
                    onClick={() => handleModeChange(mode)}
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50 flex items-center gap-2 ${
                      mode === segment.mode ? 'bg-slate-50 font-medium' : ''
                    }`}
                  >
                    <span>{modeConfig.icon}</span>
                    <span>{modeConfig.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Distance */}
        {segment.distanceKm > 0 && (
          <span className="text-slate-400">
            {segment.distanceKm.toFixed(1)} km
          </span>
        )}

        {/* Duration */}
        <span className="text-slate-400">
          {formatDuration(segment.durationMinutes)}
        </span>

        {/* Colored accent bar */}
        <div
          className="h-1 flex-1 rounded-full max-w-[60px]"
          style={{ backgroundColor: config.color + '40' }}
        />
      </div>
    </div>
  );
}
