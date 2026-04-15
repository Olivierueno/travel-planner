'use client';

import type { TransportSegment, TransportMode } from '@/lib/types';

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

const MODES: TransportMode[] = ['car', 'walk'];

function normalizeMode(mode: string): TransportMode {
  if (mode === 'car' || mode === 'walk') return mode;
  return 'car';
}

export default function TransportSegmentCard({
  segment,
  onEdit,
}: TransportSegmentCardProps) {
  const currentMode = normalizeMode(segment.mode);

  function handleToggle(mode: TransportMode) {
    if (mode !== currentMode) {
      onEdit({ ...segment, mode });
    }
  }

  return (
    <div className="flex items-center gap-3 py-2.5 px-2">
      {/* Vertical connector */}
      <div className="w-6 flex justify-center shrink-0">
        <div className="w-px h-5 bg-neutral-200" />
      </div>

      {/* Content */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Mode toggle */}
        <div className="flex items-center gap-0.5">
          {MODES.map((mode) => (
            <button
              key={mode}
              onClick={() => handleToggle(mode)}
              className={`px-2 py-0.5 rounded text-[11px] transition-all duration-150 ${
                mode === currentMode
                  ? 'bg-neutral-900 text-white'
                  : 'bg-transparent text-neutral-400 hover:text-neutral-600'
              }`}
            >
              {mode === 'car' ? 'Car' : 'Walk'}
            </button>
          ))}
        </div>

        {segment.distanceKm > 0 && (
          <span className="text-[12px] font-data text-neutral-400">
            {segment.distanceKm.toFixed(1)} km
          </span>
        )}

        <span className="text-[12px] font-data text-neutral-400">
          {formatDuration(segment.durationMinutes)}
        </span>
      </div>
    </div>
  );
}
