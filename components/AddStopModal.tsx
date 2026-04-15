'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import type { Stop, StopCategory } from '@/lib/types';
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
  return (dH * 60 + dM) - (aH * 60 + aM);
}

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

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Pre-fill when editing
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
      setSearchQuery('');
    }
    setSearchResults([]);
    setShowResults(false);
  }, [editingStop, isOpen]);

  // Debounced place search
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
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(searchQuery)}`);
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

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!name.trim() || lat === null || lng === null) {
      return;
    }

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
      activities: editingStop?.activities || [],
      order: editingStop?.order ?? existingStopsCount,
      addedBy: 'Me',
      createdAt: editingStop?.createdAt || new Date().toISOString(),
    };

    onSave(stop);
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">
            {editingStop ? 'Edit Stop' : 'Add Stop'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {editingStop ? 'Update the details of this stop' : 'Search for a place or enter details manually'}
          </p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Place Search */}
          <div className="relative">
            <label htmlFor="place-search" className="block text-sm font-medium text-slate-700 mb-1">
              Search Place
            </label>
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                id="place-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a place in Japan..."
                className="border border-slate-300 rounded-lg pl-9 pr-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-rose-500" />
                </div>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-slate-200 z-30 max-h-48 overflow-y-auto">
                {searchResults.map((result, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectResult(result)}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-0"
                  >
                    <p className="text-sm font-medium text-slate-900">{result.name}</p>
                    <p className="text-xs text-slate-500 truncate">{result.displayName}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Name */}
          <div>
            <label htmlFor="stop-name" className="block text-sm font-medium text-slate-700 mb-1">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              id="stop-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Fushimi Inari Shrine"
              required
              className="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="stop-category" className="block text-sm font-medium text-slate-700 mb-1">
              Category
            </label>
            <select
              id="stop-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as StopCategory)}
              className="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_CONFIG[cat].icon} {CATEGORY_CONFIG[cat].label}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label htmlFor="stop-date" className="block text-sm font-medium text-slate-700 mb-1">
              Date
            </label>
            <input
              id="stop-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>

          {/* Time row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="stop-arrival" className="block text-sm font-medium text-slate-700 mb-1">
                Arrival Time
              </label>
              <input
                id="stop-arrival"
                type="time"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="stop-departure" className="block text-sm font-medium text-slate-700 mb-1">
                Departure Time
              </label>
              <input
                id="stop-departure"
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Cost */}
          <div>
            <label htmlFor="stop-cost" className="block text-sm font-medium text-slate-700 mb-1">
              Cost (¥)
            </label>
            <input
              id="stop-cost"
              type="number"
              value={costJPY}
              onChange={(e) => setCostJPY(parseInt(e.target.value) || 0)}
              min={0}
              className="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="stop-notes" className="block text-sm font-medium text-slate-700 mb-1">
              Notes
            </label>
            <textarea
              id="stop-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any additional notes..."
              className="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Coordinates indicator */}
          {lat !== null && lng !== null && (
            <div className="text-xs text-slate-400">
              Coordinates: {lat.toFixed(5)}, {lng.toFixed(5)}
            </div>
          )}
          {lat === null && (
            <div className="text-xs text-amber-500">
              Search for a place above to set the location
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="border border-slate-300 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || lat === null || lng === null}
              className="bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {editingStop ? 'Update Stop' : 'Add Stop'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
