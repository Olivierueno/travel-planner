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

function formatDuration(minutes: number): string {
  if (minutes <= 0) return '';
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${minutes}m`;
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
      className={`bg-white border rounded-[10px] p-4 cursor-pointer transition-all duration-150 ${
        isSelected
          ? 'border-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
          : 'border-neutral-200 hover:border-neutral-300 hover:shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
      }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-lg border flex items-center justify-center text-sm shrink-0"
            style={{
              borderColor: config.color + '40',
              background: config.color + '08',
            }}
          >
            {config.icon}
          </div>
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold text-neutral-900 truncate leading-tight">
              {stop.name}
            </h3>
            {(stop.arrivalTime || stop.departureTime) && (
              <p className="text-[12px] text-neutral-500 mt-0.5 font-data">
                {stop.arrivalTime || '--:--'} — {stop.departureTime || '--:--'}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <span className="text-[11px] text-neutral-400 font-medium mr-1">
            #{index}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="text-neutral-400 hover:text-neutral-900 p-1 rounded transition-colors duration-150"
            title="Edit"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-neutral-400 hover:text-red-500 p-1 rounded transition-colors duration-150"
            title="Delete"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Data fields */}
      {(duration > 0 || stop.costJPY > 0) && (
        <div className="flex items-center gap-1.5 mt-3">
          {duration > 0 && (
            <span className="bg-neutral-50 border border-neutral-100 text-neutral-600 px-2 py-0.5 rounded text-[11px] font-medium">
              {formatDuration(duration)}
            </span>
          )}
          {stop.costJPY > 0 && (
            <span className="bg-neutral-50 border border-neutral-100 text-neutral-600 px-2 py-0.5 rounded text-[11px] font-data">
              ¥{stop.costJPY.toLocaleString()}
            </span>
          )}
        </div>
      )}

      {/* Notes */}
      {stop.notes && (
        <p className="text-[12px] text-neutral-500 mt-2.5 line-clamp-2 leading-relaxed">
          {stop.notes}
        </p>
      )}
    </div>
  );
}
