'use client';

import { useState } from 'react';
import type { Stop, Activity, Accommodation } from '@/lib/types';
import { CATEGORY_CONFIG, stopTotal } from '@/lib/types';

interface StopCardProps {
  stop: Stop;
  index: number;
  isSelected: boolean;
  onStopClick: () => void;
  onSave: (stop: Stop) => void;
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

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

const PencilIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-3.5 w-3.5"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
  </svg>
);

export default function StopCard({
  stop,
  index,
  isSelected,
  onStopClick,
  onSave,
  onEdit,
  onDelete,
}: StopCardProps) {
  const config = CATEGORY_CONFIG[stop.category] || CATEGORY_CONFIG.other;
  const accommodations: Accommodation[] = stop.accommodations || [];
  const activities: Activity[] = stop.activities || [];
  const duration = stop.durationMinutes || 0;
  const total = stopTotal(stop);

  const [addingAccom, setAddingAccom] = useState(false);
  const [newAccomName, setNewAccomName] = useState('');
  const [newAccomCost, setNewAccomCost] = useState(0);

  const [addingActivity, setAddingActivity] = useState(false);
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityCost, setNewActivityCost] = useState(0);

  function removeAccommodation(id: string) {
    onSave({
      ...stop,
      accommodations: accommodations.filter((a) => a.id !== id),
    });
  }

  function addAccommodation() {
    if (!newAccomName.trim()) return;
    const item: Accommodation = {
      id: crypto.randomUUID(),
      name: newAccomName.trim(),
      costJPY: newAccomCost || 0,
    };
    onSave({
      ...stop,
      accommodations: [...accommodations, item],
    });
    setNewAccomName('');
    setNewAccomCost(0);
    setAddingAccom(false);
  }

  function removeActivity(id: string) {
    onSave({
      ...stop,
      activities: activities.filter((a) => a.id !== id),
    });
  }

  function addActivity() {
    if (!newActivityName.trim()) return;
    const item: Activity = {
      id: crypto.randomUUID(),
      name: newActivityName.trim(),
      costJPY: newActivityCost || 0,
    };
    onSave({
      ...stop,
      activities: [...activities, item],
    });
    setNewActivityName('');
    setNewActivityCost(0);
    setAddingActivity(false);
  }

  const timeRange =
    stop.arrivalTime || stop.departureTime
      ? `${stop.arrivalTime || '--:--'} — ${stop.departureTime || '--:--'}`
      : '';

  const showStays = accommodations.length > 0 || addingAccom;
  const showActivities = activities.length > 0 || addingActivity;

  return (
    <div
      className={`bg-white border rounded-[10px] p-4 transition-all duration-150 ${
        isSelected
          ? 'border-neutral-900'
          : 'border-neutral-200 hover:border-neutral-300'
      }`}
    >
      {/* Header row */}
      <div
        className="flex items-start justify-between gap-3 cursor-pointer"
        onClick={onStopClick}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-6 h-6 rounded-md border flex items-center justify-center shrink-0"
            style={{
              borderColor: config.color,
              background: config.color + '08',
              color: config.color,
              fontWeight: 600,
              fontSize: '11px',
            }}
          >
            {config.letter}
          </div>
          <h3 className="text-[15px] font-semibold text-neutral-900 truncate leading-tight">
            {stop.name}
          </h3>
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
            <PencilIcon />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-neutral-400 hover:text-red-500 p-1 rounded transition-colors duration-150"
            title="Delete"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Meta line */}
      <div className="text-[12px] text-neutral-500 mt-1 ml-[34px]">
        {config.label}
        {stop.date ? ` \u00B7 ${formatDate(stop.date)}` : ''}
        {timeRange ? ` \u00B7 ${timeRange}` : ''}
        {duration > 0 ? ` \u00B7 ${formatDuration(duration)}` : ''}
      </div>

      {/* Entry cost */}
      {stop.costJPY > 0 && (
        <div className="text-[12px] font-data text-neutral-600 mt-1 ml-[34px]">
          Entry &yen;{stop.costJPY.toLocaleString()}
        </div>
      )}

      {/* STAYS section */}
      {(showStays || accommodations.length > 0) && (
        <div className="mt-3 ml-[34px]">
          <p className="text-[10px] uppercase tracking-[1.5px] text-neutral-500 mb-1.5">
            Stays
          </p>
          {accommodations.map((accom) => (
            <div
              key={accom.id}
              className="flex items-center justify-between py-0.5"
            >
              <span className="text-[13px] text-neutral-900 truncate">
                {accom.name}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[12px] font-data text-neutral-500">
                  &yen;{accom.costJPY.toLocaleString()}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAccommodation(accom.id);
                  }}
                  className="text-neutral-400 hover:text-red-500 text-[14px] leading-none transition-colors duration-150"
                >
                  &times;
                </button>
              </div>
            </div>
          ))}
          {addingAccom ? (
            <div className="flex items-center gap-1.5 mt-1">
              <input
                type="text"
                value={newAccomName}
                onChange={(e) => setNewAccomName(e.target.value)}
                placeholder="Name"
                className="flex-1 px-2 py-1 bg-neutral-50 border border-neutral-200 rounded text-[12px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 transition-[border-color] duration-150"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addAccommodation();
                  }
                }}
              />
              <div className="flex items-center gap-0.5">
                <span className="text-[12px] text-neutral-400">&yen;</span>
                <input
                  type="number"
                  value={newAccomCost}
                  onChange={(e) =>
                    setNewAccomCost(parseInt(e.target.value) || 0)
                  }
                  className="w-20 px-2 py-1 bg-neutral-50 border border-neutral-200 rounded text-[12px] font-data text-neutral-900 focus:outline-none focus:border-neutral-400 transition-[border-color] duration-150"
                  min={0}
                />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addAccommodation();
                }}
                className="text-neutral-600 hover:text-neutral-900 text-[14px] leading-none px-1 transition-colors duration-150"
                title="Save"
              >
                &#10003;
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setAddingAccom(false);
                  setNewAccomName('');
                  setNewAccomCost(0);
                }}
                className="text-neutral-400 hover:text-neutral-600 text-[14px] leading-none px-1 transition-colors duration-150"
                title="Cancel"
              >
                &times;
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setAddingAccom(true);
              }}
              className="text-[12px] text-neutral-400 hover:text-neutral-900 mt-1 transition-colors duration-150"
            >
              + Add
            </button>
          )}
        </div>
      )}

      {/* Show "+ Add stay" link when no stays exist and not already showing section */}
      {!showStays && accommodations.length === 0 && (
        <div className="mt-2 ml-[34px]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setAddingAccom(true);
            }}
            className="text-[11px] text-neutral-400 hover:text-neutral-900 transition-colors duration-150"
          >
            + Stay
          </button>
        </div>
      )}

      {/* ACTIVITIES section */}
      {(showActivities || activities.length > 0) && (
        <div className="mt-3 ml-[34px]">
          <p className="text-[10px] uppercase tracking-[1.5px] text-neutral-500 mb-1.5">
            Activities
          </p>
          {activities.map((act) => (
            <div
              key={act.id}
              className="flex items-center justify-between py-0.5"
            >
              <span className="text-[13px] text-neutral-900 truncate">
                {act.name}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[12px] font-data text-neutral-500">
                  &yen;{act.costJPY.toLocaleString()}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeActivity(act.id);
                  }}
                  className="text-neutral-400 hover:text-red-500 text-[14px] leading-none transition-colors duration-150"
                >
                  &times;
                </button>
              </div>
            </div>
          ))}
          {addingActivity ? (
            <div className="flex items-center gap-1.5 mt-1">
              <input
                type="text"
                value={newActivityName}
                onChange={(e) => setNewActivityName(e.target.value)}
                placeholder="Name"
                className="flex-1 px-2 py-1 bg-neutral-50 border border-neutral-200 rounded text-[12px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 transition-[border-color] duration-150"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addActivity();
                  }
                }}
              />
              <div className="flex items-center gap-0.5">
                <span className="text-[12px] text-neutral-400">&yen;</span>
                <input
                  type="number"
                  value={newActivityCost}
                  onChange={(e) =>
                    setNewActivityCost(parseInt(e.target.value) || 0)
                  }
                  className="w-20 px-2 py-1 bg-neutral-50 border border-neutral-200 rounded text-[12px] font-data text-neutral-900 focus:outline-none focus:border-neutral-400 transition-[border-color] duration-150"
                  min={0}
                />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addActivity();
                }}
                className="text-neutral-600 hover:text-neutral-900 text-[14px] leading-none px-1 transition-colors duration-150"
                title="Save"
              >
                &#10003;
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setAddingActivity(false);
                  setNewActivityName('');
                  setNewActivityCost(0);
                }}
                className="text-neutral-400 hover:text-neutral-600 text-[14px] leading-none px-1 transition-colors duration-150"
                title="Cancel"
              >
                &times;
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setAddingActivity(true);
              }}
              className="text-[12px] text-neutral-400 hover:text-neutral-900 mt-1 transition-colors duration-150"
            >
              + Add
            </button>
          )}
        </div>
      )}

      {/* Show "+ Add activity" link when no activities exist and not already showing section */}
      {!showActivities && activities.length === 0 && (
        <div className="mt-0.5 ml-[34px]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setAddingActivity(true);
            }}
            className="text-[11px] text-neutral-400 hover:text-neutral-900 transition-colors duration-150"
          >
            + Activity
          </button>
        </div>
      )}

      {/* Notes */}
      {stop.notes && (
        <p className="text-[12px] text-neutral-500 mt-3 ml-[34px] line-clamp-2 leading-relaxed">
          {stop.notes}
        </p>
      )}

      {/* Total */}
      {total > 0 && (
        <div className="border-t border-neutral-100 pt-2 mt-3 ml-[34px] flex justify-end">
          <span className="text-[12px] font-data font-medium text-neutral-900">
            Total &yen;{total.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}
