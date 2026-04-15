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
  return `${minutes}m`;
}

const TRANSPORT_MODES: TransportMode[] = [
  'shinkansen',
  'train',
  'bus',
  'walk',
  'taxi',
  'car',
  'flight',
  'ferry',
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
    <div className="flex items-center gap-3 py-2.5 px-2">
      {/* Vertical connector */}
      <div className="w-8 flex justify-center shrink-0">
        <div className="w-px h-5 bg-neutral-200" />
      </div>

      {/* Content */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Mode selector */}
        <div className="relative">
          <button
            onClick={() => setShowModeSelect(!showModeSelect)}
            className="flex items-center gap-1.5 border border-neutral-200 hover:border-neutral-300 px-2 py-1 rounded text-[12px] text-neutral-600 transition-all duration-150"
          >
            <span className="text-sm leading-none">{config.icon}</span>
            <span>{config.label}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-2.5 w-2.5 text-neutral-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {showModeSelect && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-lg border border-neutral-200 py-1 z-20 min-w-[150px] shadow-sm">
              {TRANSPORT_MODES.map((mode) => {
                const mc = TRANSPORT_CONFIG[mode];
                return (
                  <button
                    key={mode}
                    onClick={() => handleModeChange(mode)}
                    className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-neutral-50 flex items-center gap-2 transition-colors duration-150 ${
                      mode === segment.mode
                        ? 'bg-neutral-50 font-medium'
                        : 'text-neutral-600'
                    }`}
                  >
                    <span>{mc.icon}</span>
                    <span>{mc.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {segment.distanceKm > 0 && (
          <span className="text-[12px] text-neutral-400 font-data">
            {segment.distanceKm.toFixed(1)} km
          </span>
        )}

        <span className="text-[12px] text-neutral-400 font-data">
          {formatDuration(segment.durationMinutes)}
        </span>
      </div>
    </div>
  );
}
