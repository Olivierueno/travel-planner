'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import type { Stop, Activity, Accommodation } from '@/lib/types';
import { stopTotal, stayDuration } from '@/lib/types';


interface StopCardProps {
  stop: Stop | null;
  index: number;
  total: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSave: (stop: Stop) => void;
  onDelete: () => void;
  onMove: (direction: 'up' | 'down') => void;
  onCancel: () => void;
  currencySymbol: string;
}

interface GeoResult {
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  type: string;
}

function formatDate(d: string): string {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  const mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${mo[dt.getMonth()]} ${dt.getDate()}`;
}

/* --- Compact display (collapsed) --- */

function CompactDisplay({
  stop,
  index,
  total,
  onToggleExpand,
  onSave,
  onDelete,
  onMove,
  currencySymbol,
}: {
  stop: Stop;
  index: number;
  total: number;
  onToggleExpand: () => void;
  onSave: (stop: Stop) => void;
  onDelete: () => void;
  onMove: (direction: 'up' | 'down') => void;
  currencySymbol: string;
}) {
  const accoms: Accommodation[] = stop.accommodations || [];
  const acts: Activity[] = stop.activities || [];
  const cost = stopTotal(stop);

  const [addingAccom, setAddingAccom] = useState(false);
  const [accomName, setAccomName] = useState('');
  const [accomCost, setAccomCost] = useState(0);
  const [addingAct, setAddingAct] = useState(false);
  const [actName, setActName] = useState('');
  const [actCost, setActCost] = useState(0);

  function saveAccom() {
    if (!accomName.trim()) return;
    onSave({
      ...stop,
      accommodations: [...accoms, { id: crypto.randomUUID(), name: accomName.trim(), costJPY: accomCost || 0 }],
    });
    setAccomName(''); setAccomCost(0); setAddingAccom(false);
  }

  function saveAct() {
    if (!actName.trim()) return;
    onSave({
      ...stop,
      activities: [...acts, { id: crypto.randomUUID(), name: actName.trim(), costJPY: actCost || 0 }],
    });
    setActName(''); setActCost(0); setAddingAct(false);
  }

  const arrDate = stop.arrivalDate || (stop as any).date || '';
  const depDate = stop.departureDate || '';
  const dur = stayDuration(stop);

  const meta = (() => {
    if (!arrDate) return '';
    if (arrDate === depDate || !depDate) {
      // Same day: "Apr 15 · 09:00 → 17:00 · 8h"
      const parts = [formatDate(arrDate)];
      if (stop.arrivalTime && stop.departureTime) parts.push(`${stop.arrivalTime} \u2192 ${stop.departureTime}`);
      if (dur) parts.push(dur);
      return parts.join(' \u00B7 ');
    }
    // Multi-day: "Apr 15, 14:00 → Apr 18, 09:00 · 2d 19h"
    const parts = [
      `${formatDate(arrDate)}${stop.arrivalTime ? ', ' + stop.arrivalTime : ''} \u2192 ${formatDate(depDate)}${stop.departureTime ? ', ' + stop.departureTime : ''}`,
    ];
    if (dur) parts.push(dur);
    return parts.join(' \u00B7 ');
  })();

  const inlineInput = 'flex-1 px-2 py-1 bg-neutral-50 border border-neutral-200 rounded text-[12px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 transition-[border-color] duration-150';
  const costInput = 'w-20 px-2 py-1 bg-neutral-50 border border-neutral-200 rounded text-[12px] font-data text-neutral-900 focus:outline-none focus:border-neutral-400 transition-[border-color] duration-150';

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 cursor-pointer" onClick={onToggleExpand}>
        <h3 className="text-[14px] font-semibold text-neutral-900 truncate">{stop.name}</h3>
        <div className="flex items-center gap-0 shrink-0">
          <span className="text-[10px] text-neutral-400 mr-1">#{index}</span>
          {index > 1 && (
            <button onClick={e => { e.stopPropagation(); onMove('up'); }} className="text-neutral-300 hover:text-neutral-900 p-0.5 transition-colors duration-150" title="Move up">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd"/></svg>
            </button>
          )}
          {index < total && (
            <button onClick={e => { e.stopPropagation(); onMove('down'); }} className="text-neutral-300 hover:text-neutral-900 p-0.5 transition-colors duration-150" title="Move down">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
            </button>
          )}
          <button onClick={e => { e.stopPropagation(); onToggleExpand(); }} className="text-neutral-300 hover:text-neutral-900 p-0.5 transition-colors duration-150" title="Edit">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} className="text-neutral-300 hover:text-red-500 p-0.5 transition-colors duration-150" title="Delete">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
          </button>
        </div>
      </div>

      {/* Meta */}
      <p className="text-[11px] text-neutral-500 mt-0.5">{meta}</p>

      {/* Entry cost */}
      {stop.costJPY > 0 && (
        <p className="text-[11px] font-data text-neutral-600 mt-0.5">Entry {currencySymbol}{stop.costJPY.toLocaleString()}</p>
      )}

      {/* Stays */}
      {(accoms.length > 0 || addingAccom) && (
        <div className="mt-2">
          <p className="text-[9px] uppercase tracking-[1.2px] text-neutral-400 mb-1">Stays</p>
          {accoms.map(a => (
            <div key={a.id} className="flex items-center justify-between py-px">
              <span className="text-[12px] text-neutral-800 truncate">{a.name}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] font-data text-neutral-500">{currencySymbol}{a.costJPY.toLocaleString()}</span>
                <button onClick={e => { e.stopPropagation(); onSave({ ...stop, accommodations: accoms.filter(x => x.id !== a.id) }); }} className="text-neutral-300 hover:text-red-500 text-[13px] leading-none transition-colors duration-150">&times;</button>
              </div>
            </div>
          ))}
          {addingAccom ? (
            <div className="flex items-center gap-1 mt-1">
              <input type="text" value={accomName} onChange={e => setAccomName(e.target.value)} placeholder="Name" className={inlineInput} autoFocus onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); saveAccom(); } }} />
              <span className="text-[11px] text-neutral-400">{currencySymbol}</span>
              <input type="number" value={accomCost} onChange={e => setAccomCost(parseInt(e.target.value) || 0)} min={0} className={costInput} />
              <button onClick={e => { e.stopPropagation(); saveAccom(); }} className="text-neutral-500 hover:text-neutral-900 text-[13px] px-0.5 transition-colors duration-150">&#10003;</button>
              <button onClick={e => { e.stopPropagation(); setAddingAccom(false); setAccomName(''); setAccomCost(0); }} className="text-neutral-400 hover:text-neutral-600 text-[13px] px-0.5 transition-colors duration-150">&times;</button>
            </div>
          ) : (
            <button onClick={e => { e.stopPropagation(); setAddingAccom(true); }} className="text-[11px] text-neutral-400 hover:text-neutral-900 mt-0.5 transition-colors duration-150">+ Add</button>
          )}
        </div>
      )}
      {accoms.length === 0 && !addingAccom && (
        <button onClick={e => { e.stopPropagation(); setAddingAccom(true); }} className="text-[10px] text-neutral-400 hover:text-neutral-900 mt-1.5 block transition-colors duration-150">+ Stay</button>
      )}

      {/* Activities */}
      {(acts.length > 0 || addingAct) && (
        <div className="mt-2">
          <p className="text-[9px] uppercase tracking-[1.2px] text-neutral-400 mb-1">Activities</p>
          {acts.map(a => (
            <div key={a.id} className="flex items-center justify-between py-px">
              <span className="text-[12px] text-neutral-800 truncate">{a.name}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] font-data text-neutral-500">{currencySymbol}{a.costJPY.toLocaleString()}</span>
                <button onClick={e => { e.stopPropagation(); onSave({ ...stop, activities: acts.filter(x => x.id !== a.id) }); }} className="text-neutral-300 hover:text-red-500 text-[13px] leading-none transition-colors duration-150">&times;</button>
              </div>
            </div>
          ))}
          {addingAct ? (
            <div className="flex items-center gap-1 mt-1">
              <input type="text" value={actName} onChange={e => setActName(e.target.value)} placeholder="Name" className={inlineInput} autoFocus onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); saveAct(); } }} />
              <span className="text-[11px] text-neutral-400">{currencySymbol}</span>
              <input type="number" value={actCost} onChange={e => setActCost(parseInt(e.target.value) || 0)} min={0} className={costInput} />
              <button onClick={e => { e.stopPropagation(); saveAct(); }} className="text-neutral-500 hover:text-neutral-900 text-[13px] px-0.5 transition-colors duration-150">&#10003;</button>
              <button onClick={e => { e.stopPropagation(); setAddingAct(false); setActName(''); setActCost(0); }} className="text-neutral-400 hover:text-neutral-600 text-[13px] px-0.5 transition-colors duration-150">&times;</button>
            </div>
          ) : (
            <button onClick={e => { e.stopPropagation(); setAddingAct(true); }} className="text-[11px] text-neutral-400 hover:text-neutral-900 mt-0.5 transition-colors duration-150">+ Add</button>
          )}
        </div>
      )}
      {acts.length === 0 && !addingAct && (
        <button onClick={e => { e.stopPropagation(); setAddingAct(true); }} className="text-[10px] text-neutral-400 hover:text-neutral-900 mt-0.5 block transition-colors duration-150">+ Activity</button>
      )}

      {/* Notes */}
      {stop.notes && <p className="text-[11px] text-neutral-500 mt-2 line-clamp-2">{stop.notes}</p>}

      {/* Total */}
      {cost > 0 && (
        <div className="border-t border-neutral-100 pt-1.5 mt-2 flex justify-end">
          <span className="text-[11px] font-data font-medium text-neutral-900">Total {currencySymbol}{cost.toLocaleString()}</span>
        </div>
      )}
    </>
  );
}

/* --- Expanded edit form --- */

function ExpandedForm({
  stop,
  index,
  total,
  existingStopsCount,
  onSave,
  onCancel,
  autoFocusSearch,
  currencySymbol,
}: {
  stop: Stop | null;
  index: number;
  total: number;
  existingStopsCount: number;
  onSave: (stop: Stop) => void;
  onCancel: () => void;
  autoFocusSearch: boolean;
  currencySymbol: string;
}) {
  const isNew = stop === null;

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [name, setName] = useState(stop?.name || '');
  const [lat, setLat] = useState<number | null>(stop?.lat ?? null);
  const [lng, setLng] = useState<number | null>(stop?.lng ?? null);
  const [arrivalDate, setArrivalDate] = useState(stop?.arrivalDate || (stop as any)?.date || '');
  const [arrivalTime, setArrivalTime] = useState(stop?.arrivalTime || '14:00');
  const [departureDate, setDepartureDate] = useState(stop?.departureDate || stop?.arrivalDate || (stop as any)?.date || '');
  const [departureTime, setDepartureTime] = useState(stop?.departureTime || '09:00');
  const [departureDateTouched, setDepartureDateTouched] = useState(!!stop?.departureDate);
  const [costJPY, setCostJPY] = useState(stop?.costJPY || 0);
  const [notes, setNotes] = useState(stop?.notes || '');

  const [accommodations, setAccommodations] = useState<Accommodation[]>(stop?.accommodations || []);
  const [addingAccom, setAddingAccom] = useState(false);
  const [newAccomName, setNewAccomName] = useState('');
  const [newAccomCost, setNewAccomCost] = useState(0);

  const [activities, setActivities] = useState<Activity[]>(stop?.activities || []);
  const [addingActivity, setAddingActivity] = useState(false);
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityCost, setNewActivityCost] = useState(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocusSearch && searchRef.current) {
      searchRef.current.focus();
    }
  }, [autoFocusSearch]);

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

  function handleAddAccom() {
    if (!newAccomName.trim()) return;
    setAccommodations(prev => [
      ...prev,
      { id: crypto.randomUUID(), name: newAccomName.trim(), costJPY: newAccomCost || 0 },
    ]);
    setNewAccomName('');
    setNewAccomCost(0);
    setAddingAccom(false);
  }

  function handleRemoveAccom(id: string) {
    setAccommodations(prev => prev.filter(a => a.id !== id));
  }

  function handleAddActivity() {
    if (!newActivityName.trim()) return;
    setActivities(prev => [
      ...prev,
      { id: crypto.randomUUID(), name: newActivityName.trim(), costJPY: newActivityCost || 0 },
    ]);
    setNewActivityName('');
    setNewActivityCost(0);
    setAddingActivity(false);
  }

  function handleRemoveActivity(id: string) {
    setActivities(prev => prev.filter(a => a.id !== id));
  }

  function handleArrivalDateChange(value: string) {
    setArrivalDate(value);
    if (!departureDateTouched && value) {
      const next = new Date(value + 'T00:00:00');
      next.setDate(next.getDate() + 1);
      setDepartureDate(next.toISOString().split('T')[0]);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || lat === null || lng === null) return;

    const result: Stop = {
      id: stop?.id || crypto.randomUUID(),
      name: name.trim(),
      description: stop?.description || '',
      lat,
      lng,
      arrivalDate,
      arrivalTime,
      departureDate: departureDate || arrivalDate,
      departureTime,
      costJPY,
      notes,
      accommodations,
      activities,
      order: stop?.order ?? existingStopsCount,
      addedBy: stop?.addedBy || 'Me',
      createdAt: stop?.createdAt || new Date().toISOString(),
    };

    onSave(result);
  }

  const labelClass = 'block text-[10px] uppercase tracking-[1.2px] text-neutral-400 mb-1';
  const inputClass = 'w-full px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 transition-[border-color] duration-150';
  const inlineInput = 'flex-1 px-2 py-1.5 bg-neutral-50 border border-neutral-200 rounded text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 transition-[border-color] duration-150';
  const inlineCostInput = 'w-20 px-2 py-1.5 bg-neutral-50 border border-neutral-200 rounded text-[13px] font-data text-neutral-900 focus:outline-none focus:border-neutral-400 transition-[border-color] duration-150';

  return (
    <form onSubmit={handleSubmit} className="expand-content">
      {/* Title row */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[14px] font-semibold text-neutral-900">
          {isNew ? 'New Stop' : stop.name}
        </h3>
        <span className="text-[10px] text-neutral-400">#{index}</span>
      </div>

      <div className="space-y-3">
        {/* Place Search */}
        <div className="relative">
          <label className={labelClass}>Search Location</label>
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search for a place..."
              className={`${inputClass} !pl-8`}
            />
            {searching && (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-neutral-400" />
              </div>
            )}
          </div>

          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-neutral-200 z-10 max-h-40 overflow-y-auto shadow-sm">
              {searchResults.map((result, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectResult(result)}
                  className="w-full text-left px-3 py-2 hover:bg-neutral-50 border-b border-neutral-100 last:border-0 transition-colors duration-150"
                >
                  <p className="text-[12px] font-medium text-neutral-900">{result.name}</p>
                  <p className="text-[10px] text-neutral-500 truncate">{result.displayName}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Name */}
        <div>
          <label className={labelClass}>Name <span className="text-red-400 normal-case">*</span></label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g., Fushimi Inari Shrine"
            required
            className={inputClass}
          />
        </div>

        {/* Arrive */}
        <div>
          <label className={labelClass}>Arrive</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={arrivalDate}
              onChange={e => handleArrivalDateChange(e.target.value)}
              className={inputClass}
            />
            <input
              type="time"
              value={arrivalTime}
              onChange={e => setArrivalTime(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Depart */}
        <div>
          <label className={labelClass}>Depart</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={departureDate}
              onChange={e => { setDepartureDate(e.target.value); setDepartureDateTouched(true); }}
              className={inputClass}
            />
            <input
              type="time"
              value={departureTime}
              onChange={e => setDepartureTime(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Entry Cost */}
        <div>
          <label className={labelClass}>Entry Cost ({currencySymbol})</label>
          <input
            type="number"
            value={costJPY}
            onChange={e => setCostJPY(parseInt(e.target.value) || 0)}
            min={0}
            className={inputClass}
          />
        </div>

        {/* Stays */}
        <div>
          <p className={labelClass}>Stays</p>
          {accommodations.map(accom => (
            <div key={accom.id} className="flex items-center justify-between py-1">
              <span className="text-[12px] text-neutral-800 truncate">{accom.name}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] font-data text-neutral-500">{currencySymbol}{accom.costJPY.toLocaleString()}</span>
                <button type="button" onClick={() => handleRemoveAccom(accom.id)} className="text-neutral-400 hover:text-red-500 text-[13px] leading-none transition-colors duration-150">&times;</button>
              </div>
            </div>
          ))}
          {addingAccom ? (
            <div className="flex items-center gap-1.5 mt-1">
              <input
                type="text"
                value={newAccomName}
                onChange={e => setNewAccomName(e.target.value)}
                placeholder="Name"
                className={inlineInput}
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddAccom(); } }}
              />
              <span className="text-[11px] text-neutral-400">{currencySymbol}</span>
              <input
                type="number"
                value={newAccomCost}
                onChange={e => setNewAccomCost(parseInt(e.target.value) || 0)}
                min={0}
                className={inlineCostInput}
              />
              <button type="button" onClick={handleAddAccom} className="text-neutral-600 hover:text-neutral-900 text-[13px] leading-none px-0.5 transition-colors duration-150">&#10003;</button>
              <button type="button" onClick={() => { setAddingAccom(false); setNewAccomName(''); setNewAccomCost(0); }} className="text-neutral-400 hover:text-neutral-600 text-[13px] leading-none px-0.5 transition-colors duration-150">&times;</button>
            </div>
          ) : (
            <button type="button" onClick={() => setAddingAccom(true)} className="text-[11px] text-neutral-400 hover:text-neutral-900 mt-0.5 transition-colors duration-150">+ Add</button>
          )}
        </div>

        {/* Activities */}
        <div>
          <p className={labelClass}>Activities</p>
          {activities.map(act => (
            <div key={act.id} className="flex items-center justify-between py-1">
              <span className="text-[12px] text-neutral-800 truncate">{act.name}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] font-data text-neutral-500">{currencySymbol}{act.costJPY.toLocaleString()}</span>
                <button type="button" onClick={() => handleRemoveActivity(act.id)} className="text-neutral-400 hover:text-red-500 text-[13px] leading-none transition-colors duration-150">&times;</button>
              </div>
            </div>
          ))}
          {addingActivity ? (
            <div className="flex items-center gap-1.5 mt-1">
              <input
                type="text"
                value={newActivityName}
                onChange={e => setNewActivityName(e.target.value)}
                placeholder="Name"
                className={inlineInput}
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddActivity(); } }}
              />
              <span className="text-[11px] text-neutral-400">{currencySymbol}</span>
              <input
                type="number"
                value={newActivityCost}
                onChange={e => setNewActivityCost(parseInt(e.target.value) || 0)}
                min={0}
                className={inlineCostInput}
              />
              <button type="button" onClick={handleAddActivity} className="text-neutral-600 hover:text-neutral-900 text-[13px] leading-none px-0.5 transition-colors duration-150">&#10003;</button>
              <button type="button" onClick={() => { setAddingActivity(false); setNewActivityName(''); setNewActivityCost(0); }} className="text-neutral-400 hover:text-neutral-600 text-[13px] leading-none px-0.5 transition-colors duration-150">&times;</button>
            </div>
          ) : (
            <button type="button" onClick={() => setAddingActivity(true)} className="text-[11px] text-neutral-400 hover:text-neutral-900 mt-0.5 transition-colors duration-150">+ Add</button>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className={labelClass}>Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="Any additional notes..."
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* Coordinates */}
        {lat !== null && lng !== null && (
          <p className="text-[10px] text-neutral-400 font-data">{lat.toFixed(5)}, {lng.toFixed(5)}</p>
        )}
        {lat === null && (
          <p className="text-[10px] text-amber-600">Search for a place above to set the location</p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 border border-neutral-200 hover:border-neutral-300 rounded-lg text-[12px] font-medium text-neutral-600 transition-all duration-150"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim() || lat === null || lng === null}
            className="px-4 py-1.5 bg-neutral-900 text-white rounded-lg text-[12px] font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80 transition-opacity duration-150"
          >
            {isNew ? 'Add Stop' : 'Save'}
          </button>
        </div>
      </div>
    </form>
  );
}

/* --- Main StopCard component --- */

export default function StopCard({
  stop,
  index,
  total,
  isExpanded,
  onToggleExpand,
  onSave,
  onDelete,
  onMove,
  onCancel,
  currencySymbol,
}: StopCardProps) {
  return (
    <div
      className={`bg-white border rounded-[10px] transition-all duration-300 ${
        isExpanded
          ? 'border-neutral-900 shadow-sm p-4'
          : stop
            ? 'border-neutral-200 hover:border-neutral-300 px-3.5 py-3'
            : 'border-neutral-900 shadow-sm p-4'
      }`}
    >
      {isExpanded || stop === null ? (
        <ExpandedForm
          stop={stop}
          index={index}
          total={total}
          existingStopsCount={total}
          onSave={onSave}
          onCancel={stop === null ? onCancel : onToggleExpand}
          autoFocusSearch={stop === null}
          currencySymbol={currencySymbol}
        />
      ) : (
        <CompactDisplay
          stop={stop}
          index={index}
          total={total}
          onToggleExpand={onToggleExpand}
          onSave={onSave}
          onDelete={onDelete}
          onMove={onMove}
          currencySymbol={currencySymbol}
        />
      )}
    </div>
  );
}
