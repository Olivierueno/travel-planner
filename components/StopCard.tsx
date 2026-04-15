'use client';

import type { Stop } from '@/lib/types';
import { CATEGORY_CONFIG } from '@/lib/types';

interface StopCardProps {
  stop: Stop;
  index: number;
  isSelected: boolean;
  onStopClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function formatTimeRange(arrival: string, departure: string): string {
  if (!arrival && !departure) return '';
  if (arrival && departure) return `${arrival} → ${departure}`;
  return arrival || departure;
}

function formatDuration(minutes: number): string {
  if (minutes <= 0) return '';
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${minutes} min`;
}

export default function StopCard({
  stop,
  index,
  isSelected,
  onStopClick,
  onEdit,
  onDelete,
}: StopCardProps) {
  const config = CATEGORY_CONFIG[stop.category] || CATEGORY_CONFIG.other;
  const duration = stop.durationMinutes || 0;

  return (
    <div
      onClick={onStopClick}
      className={`bg-white rounded-xl shadow-sm border border-slate-200 p-4 cursor-pointer transition-all duration-200 hover:shadow-md relative ${
        isSelected ? 'ring-2 ring-rose-500 shadow-md' : ''
      }`}
      style={{ borderLeftWidth: '4px', borderLeftColor: config.color }}
    >
      {/* Top row: category icon + name + actions */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0"
            style={{ backgroundColor: config.color + '18', color: config.color }}
          >
            {index}
          </span>
          <span className="text-base" title={config.label}>{config.icon}</span>
          <h3 className="font-semibold text-slate-900 truncate">{stop.name}</h3>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors"
            title="Edit stop"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors"
            title="Delete stop"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Second row: time range + duration */}
      <div className="flex items-center gap-2 mt-2">
        {(stop.arrivalTime || stop.departureTime) && (
          <span className="text-sm text-slate-600">
            {formatTimeRange(stop.arrivalTime, stop.departureTime)}
          </span>
        )}
        {duration > 0 && (
          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">
            {formatDuration(duration)}
          </span>
        )}
      </div>

      {/* Third row: cost */}
      {stop.costJPY > 0 && (
        <div className="mt-2">
          <span className="text-sm font-medium text-emerald-600">
            ¥{stop.costJPY.toLocaleString()}
          </span>
        </div>
      )}

      {/* Fourth row: notes */}
      {stop.notes && (
        <p className="text-sm text-slate-500 mt-2 line-clamp-2">
          {stop.notes}
        </p>
      )}
    </div>
  );
}
