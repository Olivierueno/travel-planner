'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import type { Stop, StopCategory, Activity, Accommodation } from '@/lib/types';
import { CATEGORY_CONFIG } from '@/lib/types';

interface AddStopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (stop: Stop) => void;
  editingStop?: Stop | null;
  existingStopsCount: number;
}

interface GeoResult {
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  type: string;
}

const CATEGORIES: StopCategory[] = [
  'temple', 'shrine', 'museum', 'park', 'food', 'shopping',
  'onsen', 'entertainment', 'nature', 'accommodation', 'transport-hub', 'other',
];

function timeDiffMinutes(arrival: string, departure: string): number {
  if (!arrival || !departure) return 0;
  const [aH, aM] = arrival.split(':').map(Number);
  const [dH, dM] = departure.split(':').map(Number);
  return dH * 60 + dM - (aH * 60 + aM);
}

const labelClass =
  'block text-[11px] uppercase tracking-[0.5px] text-neutral-500 mb-1.5';
const inputClass =
  'w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 transition-[border-color] duration-150';

export default function AddStopModal({
  isOpen,
  onClose,
  onSave,
  editingStop,
  existingStopsCount,
}: AddStopModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<StopCategory>('other');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [date, setDate] = useState('');
  const [arrivalTime, setArrivalTime] = useState('09:00');
  const [departureTime, setDepartureTime] = useState('11:00');
  const [costJPY, setCostJPY] = useState(0);
  const [notes, setNotes] = useState('');

  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [addingAccom, setAddingAccom] = useState(false);
  const [newAccomName, setNewAccomName] = useState('');
  const [newAccomCost, setNewAccomCost] = useState(0);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [addingActivity, setAddingActivity] = useState(false);
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityCost, setNewActivityCost] = useState(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (editingStop) {
      setName(editingStop.name);
      setCategory(editingStop.category);
      setLat(editingStop.lat);
      setLng(editingStop.lng);
      setDate(editingStop.date);
      setArrivalTime(editingStop.arrivalTime || '09:00');
      setDepartureTime(editingStop.departureTime || '11:00');
      setCostJPY(editingStop.costJPY || 0);
      setNotes(editingStop.notes || '');
      setAccommodations(editingStop.accommodations || []);
      setActivities(editingStop.activities || []);
      setSearchQuery('');
    } else {
      setName('');
      setCategory('other');
      setLat(null);
      setLng(null);
      setDate('');
      setArrivalTime('09:00');
      setDepartureTime('11:00');
      setCostJPY(0);
      setNotes('');
      setAccommodations([]);
      setActivities([]);
      setSearchQuery('');
    }
    setSearchResults([]);
    setShowResults(false);
    setAddingAccom(false);
    setAddingActivity(false);
  }, [editingStop, isOpen]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/geocode?q=${encodeURIComponent(searchQuery)}`
        );
        const data = await res.json();
        setSearchResults(data.results || []);
        setShowResults(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  function handleSelectResult(result: GeoResult) {
    setName(result.name);
    setLat(result.lat);
    setLng(result.lng);
    setShowResults(false);
    setSearchQuery('');
  }

  function handleAddAccom() {
    if (!newAccomName.trim()) return;
    setAccommodations((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: newAccomName.trim(), costJPY: newAccomCost || 0 },
    ]);
    setNewAccomName('');
    setNewAccomCost(0);
    setAddingAccom(false);
  }

  function handleRemoveAccom(id: string) {
    setAccommodations((prev) => prev.filter((a) => a.id !== id));
  }

  function handleAddActivity() {
    if (!newActivityName.trim()) return;
    setActivities((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: newActivityName.trim(), costJPY: newActivityCost || 0 },
    ]);
    setNewActivityName('');
    setNewActivityCost(0);
    setAddingActivity(false);
  }

  function handleRemoveActivity(id: string) {
    setActivities((prev) => prev.filter((a) => a.id !== id));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || lat === null || lng === null) return;

    const duration = timeDiffMinutes(arrivalTime, departureTime);

    const stop: Stop = {
      id: editingStop?.id || crypto.randomUUID(),
      name: name.trim(),
      description: '',
      category,
      lat,
      lng,
      date,
      arrivalTime,
      departureTime,
      durationMinutes: duration > 0 ? duration : 0,
      costJPY,
      notes,
      accommodations,
      activities,
      order: editingStop?.order ?? existingStopsCount,
      addedBy: 'Me',
      createdAt: editingStop?.createdAt || new Date().toISOString(),
    };

    onSave(stop);
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.4)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-[10px] border border-neutral-200 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-lg">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-neutral-200">
          <h2 className="text-[15px] font-semibold text-neutral-900">
            {editingStop ? 'Edit Stop' : 'Add Stop'}
          </h2>
          <p className="text-[13px] text-neutral-500 mt-1">
            {editingStop
              ? 'Update the details of this stop'
              : 'Search for a place or enter details manually'}
          </p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Place Search */}
          <div className="relative">
            <label htmlFor="place-search" className={labelClass}>
              Search Place
            </label>
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                id="place-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a place in Japan..."
                className={`${inputClass} !pl-9`}
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-neutral-400" />
                </div>
              )}
            </div>

            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-neutral-200 z-10 max-h-48 overflow-y-auto shadow-sm">
                {searchResults.map((result, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectResult(result)}
                    className="w-full text-left px-4 py-2.5 hover:bg-neutral-50 border-b border-neutral-100 last:border-0 transition-colors duration-150"
                  >
                    <p className="text-[13px] font-medium text-neutral-900">
                      {result.name}
                    </p>
                    <p className="text-[11px] text-neutral-500 truncate">
                      {result.displayName}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Name */}
          <div>
            <label htmlFor="stop-name" className={labelClass}>
              Name <span className="text-red-400 normal-case">*</span>
            </label>
            <input
              id="stop-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Fushimi Inari Shrine"
              required
              className={inputClass}
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="stop-category" className={labelClass}>
              Category
            </label>
            <select
              id="stop-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as StopCategory)}
              className={inputClass}
            >
              {CATEGORIES.map((cat) => {
                const cfg = CATEGORY_CONFIG[cat];
                return (
                  <option key={cat} value={cat}>
                    {cfg.letter} — {cfg.label}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Date */}
          <div>
            <label htmlFor="stop-date" className={labelClass}>
              Date
            </label>
            <input
              id="stop-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Time row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="stop-arrival" className={labelClass}>
                Arrival
              </label>
              <input
                id="stop-arrival"
                type="time"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="stop-departure" className={labelClass}>
                Departure
              </label>
              <input
                id="stop-departure"
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Cost */}
          <div>
            <label htmlFor="stop-cost" className={labelClass}>
              Entry Cost (JPY)
            </label>
            <input
              id="stop-cost"
              type="number"
              value={costJPY}
              onChange={(e) => setCostJPY(parseInt(e.target.value) || 0)}
              min={0}
              className={inputClass}
            />
          </div>

          {/* STAYS section */}
          <div>
            <p className={labelClass}>Stays</p>
            {accommodations.map((accom) => (
              <div
                key={accom.id}
                className="flex items-center justify-between py-1"
              >
                <span className="text-[13px] text-neutral-900 truncate">
                  {accom.name}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[12px] font-data text-neutral-500">
                    &yen;{accom.costJPY.toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAccom(accom.id)}
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
                  className="flex-1 px-2 py-1.5 bg-neutral-50 border border-neutral-200 rounded text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 transition-[border-color] duration-150"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddAccom();
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
                    className="w-20 px-2 py-1.5 bg-neutral-50 border border-neutral-200 rounded text-[13px] font-data text-neutral-900 focus:outline-none focus:border-neutral-400 transition-[border-color] duration-150"
                    min={0}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddAccom}
                  className="text-neutral-600 hover:text-neutral-900 text-[14px] leading-none px-1 transition-colors duration-150"
                >
                  &#10003;
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddingAccom(false);
                    setNewAccomName('');
                    setNewAccomCost(0);
                  }}
                  className="text-neutral-400 hover:text-neutral-600 text-[14px] leading-none px-1 transition-colors duration-150"
                >
                  &times;
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddingAccom(true)}
                className="text-[12px] text-neutral-400 hover:text-neutral-900 mt-1 transition-colors duration-150"
              >
                + Add
              </button>
            )}
          </div>

          {/* ACTIVITIES section */}
          <div>
            <p className={labelClass}>Activities</p>
            {activities.map((act) => (
              <div
                key={act.id}
                className="flex items-center justify-between py-1"
              >
                <span className="text-[13px] text-neutral-900 truncate">
                  {act.name}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[12px] font-data text-neutral-500">
                    &yen;{act.costJPY.toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveActivity(act.id)}
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
                  className="flex-1 px-2 py-1.5 bg-neutral-50 border border-neutral-200 rounded text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 transition-[border-color] duration-150"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddActivity();
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
                    className="w-20 px-2 py-1.5 bg-neutral-50 border border-neutral-200 rounded text-[13px] font-data text-neutral-900 focus:outline-none focus:border-neutral-400 transition-[border-color] duration-150"
                    min={0}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddActivity}
                  className="text-neutral-600 hover:text-neutral-900 text-[14px] leading-none px-1 transition-colors duration-150"
                >
                  &#10003;
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddingActivity(false);
                    setNewActivityName('');
                    setNewActivityCost(0);
                  }}
                  className="text-neutral-400 hover:text-neutral-600 text-[14px] leading-none px-1 transition-colors duration-150"
                >
                  &times;
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddingActivity(true)}
                className="text-[12px] text-neutral-400 hover:text-neutral-900 mt-1 transition-colors duration-150"
              >
                + Add
              </button>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="stop-notes" className={labelClass}>
              Notes
            </label>
            <textarea
              id="stop-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any additional notes..."
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Coordinates indicator */}
          {lat !== null && lng !== null && (
            <p className="text-[11px] text-neutral-400 font-data">
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </p>
          )}
          {lat === null && (
            <p className="text-[11px] text-amber-600">
              Search for a place above to set the location
            </p>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-neutral-200 hover:border-neutral-300 rounded-lg text-[13px] font-medium text-neutral-600 transition-all duration-150"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || lat === null || lng === null}
              className="px-5 py-2 bg-neutral-900 text-white rounded-lg text-[13px] font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80 transition-opacity duration-150"
            >
              {editingStop ? 'Update' : 'Add Stop'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
