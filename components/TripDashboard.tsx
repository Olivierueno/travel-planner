'use client';

import { useState, useEffect, useMemo, useCallback, FormEvent } from 'react';
import dynamic from 'next/dynamic';
import type { Trip, Stop, TransportSegment } from '@/lib/types';
import { generatePrintHTML } from '@/lib/export-pdf';
import { CURRENCIES, autoCalculateArrivals } from '@/lib/types';
import Timeline from './Timeline';

const Map = dynamic(() => import('./MapInner'), {
  ssr: false,
  loading: () => (
    <div
      className="h-full w-full flex items-center justify-center"
      style={{ background: 'var(--bg-secondary)' }}
    >
      <span className="text-[13px] text-neutral-400">Loading map...</span>
    </div>
  ),
});

function formatDateRange(start: string, end: string): string {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');

  if (start === end) {
    return `${monthNames[s.getMonth()]} ${s.getDate()}, ${s.getFullYear()}`;
  }
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${monthNames[s.getMonth()]} ${s.getDate()} \u2013 ${e.getDate()}, ${e.getFullYear()}`;
  }
  return `${monthNames[s.getMonth()]} ${s.getDate()} \u2013 ${monthNames[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;
}

export default function TripDashboard() {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [expandedStopId, setExpandedStopId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [createTitle, setCreateTitle] = useState('');
  const [createStartDate, setCreateStartDate] = useState('');
  const [createEndDate, setCreateEndDate] = useState('');
  const [createMemberName, setCreateMemberName] = useState('');
  const [creating, setCreating] = useState(false);

  const currencySymbol = trip?.settings?.currencySymbol || '\u00A5';

  const fetchTrip = useCallback(async () => {
    try {
      const res = await fetch('/api/trip');
      const data = await res.json();
      setTrip(data.trip || null);
    } catch {
      // leave null
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrip();
  }, [fetchTrip]);

  const saveTrip = useCallback(
    async (updated: Trip) => {
      setTrip(updated);
      try {
        const res = await fetch('/api/trip', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trip: updated }),
        });
        const data = await res.json();
        setTrip(data.trip);
      } catch {
        fetchTrip();
      }
    },
    [fetchTrip]
  );

  const calculateRoutes = useCallback(
    async (stops: Stop[], existingSegments?: TransportSegment[]): Promise<TransportSegment[]> => {
      const sorted = [...stops].sort((a, b) => a.order - b.order);

      if (sorted.length < 2) return [];

      setRoutesLoading(true);
      try {
        const pairs = sorted.slice(0, -1).map((from, i) => ({
          from,
          to: sorted[i + 1],
        }));

        return await Promise.all(
          pairs.map(async ({ from, to }) => {
            const existing = (existingSegments || []).find(
              (seg) => seg.fromStopId === from.id && seg.toStopId === to.id
            );
            const mode =
              existing?.mode === 'car' || existing?.mode === 'walk' || existing?.mode === 'train'
                ? existing.mode
                : 'car';

            try {
              const params = new URLSearchParams({
                from_lat: String(from.lat),
                from_lng: String(from.lng),
                to_lat: String(to.lat),
                to_lng: String(to.lng),
                mode,
              });
              const res = await fetch(`/api/routing?${params}`);
              if (!res.ok) throw new Error();
              const data = await res.json();
              return {
                id: `${from.id}-${to.id}`,
                fromStopId: from.id,
                toStopId: to.id,
                mode: mode as 'car' | 'walk',
                distanceKm: data.distanceKm || 0,
                durationMinutes: data.durationMinutes || 0,
                notes: existing?.notes || '',
              };
            } catch {
              return {
                id: `${from.id}-${to.id}`,
                fromStopId: from.id,
                toStopId: to.id,
                mode: mode as 'car' | 'walk',
                distanceKm: 0,
                durationMinutes: 0,
                notes: '',
              };
            }
          })
        );
      } finally {
        setRoutesLoading(false);
      }
    },
    []
  );

  const saveStop = useCallback(
    async (updatedStop: Stop) => {
      if (!trip) return;
      const updatedStops = trip.stops.map((s) =>
        s.id === updatedStop.id ? updatedStop : s
      );
      await saveTrip({ ...trip, stops: updatedStops });
    },
    [trip, saveTrip]
  );

  const editStop = useCallback(
    async (updatedStop: Stop) => {
      if (!trip) return;
      const updatedStops = trip.stops.map((s) =>
        s.id === updatedStop.id ? updatedStop : s
      );
      const transportSegments = await calculateRoutes(
        updatedStops,
        trip.transportSegments
      );
      const stopsWithArrivals = autoCalculateArrivals(updatedStops, transportSegments);
      await saveTrip({
        ...trip,
        stops: stopsWithArrivals,
        transportSegments,
        changelog: [
          ...trip.changelog,
          {
            id: crypto.randomUUID(),
            action: 'stop.edited',
            detail: `Edited "${updatedStop.name}"`,
            member: 'Me',
            timestamp: new Date().toISOString(),
          },
        ],
      });
      setExpandedStopId(null);
    },
    [trip, calculateRoutes, saveTrip]
  );

  const addStop = useCallback(
    async (stopData: Stop) => {
      if (!trip) return;
      const newStop = {
        ...stopData,
        order: trip.stops.length,
        accommodations: stopData.accommodations || [],
      };
      const updatedStops = [...trip.stops, newStop];
      const transportSegments = await calculateRoutes(
        updatedStops,
        trip.transportSegments
      );
      const stopsWithArrivals = autoCalculateArrivals(updatedStops, transportSegments);
      await saveTrip({
        ...trip,
        stops: stopsWithArrivals,
        transportSegments,
        changelog: [
          ...trip.changelog,
          {
            id: crypto.randomUUID(),
            action: 'stop.added',
            detail: `Added "${newStop.name}"`,
            member: 'Me',
            timestamp: new Date().toISOString(),
          },
        ],
      });
      setIsAddingNew(false);
    },
    [trip, calculateRoutes, saveTrip]
  );

  const deleteStop = useCallback(
    async (stopId: string) => {
      if (!trip) return;
      const target = trip.stops.find((s) => s.id === stopId);
      if (!target || !window.confirm(`Delete "${target.name}"?`)) return;
      const updatedStops = trip.stops.filter((s) => s.id !== stopId);
      const transportSegments = await calculateRoutes(
        updatedStops,
        trip.transportSegments
      );
      const stopsWithArrivals = autoCalculateArrivals(updatedStops, transportSegments);
      await saveTrip({
        ...trip,
        stops: stopsWithArrivals,
        transportSegments,
        changelog: [
          ...trip.changelog,
          {
            id: crypto.randomUUID(),
            action: 'stop.deleted',
            detail: `Deleted "${target.name}"`,
            member: 'Me',
            timestamp: new Date().toISOString(),
          },
        ],
      });
      if (selectedStopId === stopId) setSelectedStopId(null);
      if (expandedStopId === stopId) setExpandedStopId(null);
    },
    [trip, calculateRoutes, saveTrip, selectedStopId, expandedStopId]
  );

  const updateTransportSegment = useCallback(
    async (updated: TransportSegment) => {
      if (!trip) return;

      const fromStop = trip.stops.find((s) => s.id === updated.fromStopId);
      const toStop = trip.stops.find((s) => s.id === updated.toStopId);

      let finalSegment = updated;
      if (fromStop && toStop) {
        try {
          const mode =
            updated.mode === 'car' || updated.mode === 'walk' || updated.mode === 'train'
              ? updated.mode
              : 'car';
          const params = new URLSearchParams({
            from_lat: String(fromStop.lat),
            from_lng: String(fromStop.lng),
            to_lat: String(toStop.lat),
            to_lng: String(toStop.lng),
            mode,
          });
          const res = await fetch(`/api/routing?${params}`);
          if (res.ok) {
            const data = await res.json();
            finalSegment = {
              ...updated,
              distanceKm: data.distanceKm || 0,
              durationMinutes: data.durationMinutes || 0,
            };
          }
        } catch {
          // keep existing values
        }
      }

      await saveTrip({
        ...trip,
        transportSegments: trip.transportSegments.map((seg) =>
          seg.id === finalSegment.id ? finalSegment : seg
        ),
      });
    },
    [trip, saveTrip]
  );

  const exportJSON = useCallback(() => {
    if (!trip) return;
    const blob = new Blob([JSON.stringify(trip, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${trip.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [trip]);

  const sortedStops = useMemo(() => {
    if (!trip) return [];
    return [...trip.stops].sort((a, b) => a.order - b.order);
  }, [trip]);

  const moveStop = useCallback(
    async (stopId: string, direction: 'up' | 'down') => {
      if (!trip) return;
      const sorted = [...trip.stops].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((s) => s.id === stopId);
      if (idx === -1) return;
      if (direction === 'up' && idx === 0) return;
      if (direction === 'down' && idx === sorted.length - 1) return;

      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      const orderA = sorted[idx].order;
      const orderB = sorted[swapIdx].order;
      sorted[idx] = { ...sorted[idx], order: orderB };
      sorted[swapIdx] = { ...sorted[swapIdx], order: orderA };

      const segments = await calculateRoutes(sorted);
      const stopsWithArrivals = autoCalculateArrivals(sorted, segments);
      await saveTrip({ ...trip, stops: stopsWithArrivals, transportSegments: segments });
    },
    [trip, calculateRoutes, saveTrip]
  );

  const exportPDF = useCallback(() => {
    if (!trip) return;
    const dateRange = formatDateRange(trip.startDate, trip.endDate);
    const html = generatePrintHTML(sortedStops, trip.transportSegments, trip.title, dateRange, currencySymbol);
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 300);
    }
  }, [trip, sortedStops, currencySymbol]);

  const openInGoogleMaps = useCallback(() => {
    if (sortedStops.length === 0) return;
    const coords = sortedStops.map((s) => `${s.lat},${s.lng}`);
    window.open(
      `https://www.google.com/maps/dir/${coords.join('/')}`,
      '_blank'
    );
  }, [sortedStops]);

  const toggleExpand = useCallback((stopId: string) => {
    setExpandedStopId(prev => prev === stopId ? null : stopId);
    setIsAddingNew(false);
  }, []);

  const startAddStop = useCallback(() => {
    setIsAddingNew(true);
    setExpandedStopId(null);
  }, []);

  const cancelAddStop = useCallback(() => {
    setIsAddingNew(false);
  }, []);

  // When a stop is expanded and the user saves via the inline form,
  // we need to handle it as an edit (recalculate routes).
  const handleSaveStop = useCallback(
    async (updatedStop: Stop) => {
      // If it's the currently expanded stop, treat as full edit with route recalc
      if (expandedStopId === updatedStop.id) {
        await editStop(updatedStop);
      } else {
        // Inline save (accommodations/activities from compact view)
        await saveStop(updatedStop);
      }
    },
    [expandedStopId, editStop, saveStop]
  );

  async function handleCreateTrip(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: createTitle,
          startDate: createStartDate,
          endDate: createEndDate,
          memberName: createMemberName,
        }),
      });
      const data = await res.json();
      setTrip(data.trip);
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  }

  // --- Loading ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-neutral-300" />
      </div>
    );
  }

  // --- Create trip ---
  if (!trip) {
    const labelClass =
      'block text-[11px] uppercase tracking-[0.5px] text-neutral-500 mb-1.5';
    const inputClass =
      'w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 transition-[border-color] duration-150';

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white border border-neutral-200 rounded-[10px] p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <p className="text-[11px] uppercase tracking-[1.5px] text-neutral-500 mb-2">
              Travel Planner
            </p>
            <h1 className="text-[24px] font-semibold text-neutral-900">
              Create Your Trip
            </h1>
            <p className="text-[14px] text-neutral-500 mt-2">
              Set up the basics to start planning
            </p>
          </div>

          <form onSubmit={handleCreateTrip} className="space-y-4">
            <div>
              <label htmlFor="create-title" className={labelClass}>
                Trip Title
              </label>
              <input
                id="create-title"
                type="text"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                placeholder="e.g., Spring Japan 2025"
                required
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="create-start" className={labelClass}>
                  Start Date
                </label>
                <input
                  id="create-start"
                  type="date"
                  value={createStartDate}
                  onChange={(e) => setCreateStartDate(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="create-end" className={labelClass}>
                  End Date
                </label>
                <input
                  id="create-end"
                  type="date"
                  value={createEndDate}
                  onChange={(e) => setCreateEndDate(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="create-name" className={labelClass}>
                Your Name
              </label>
              <input
                id="create-name"
                type="text"
                value={createMemberName}
                onChange={(e) => setCreateMemberName(e.target.value)}
                placeholder="Your name"
                required
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full py-2.5 px-5 bg-neutral-900 text-white rounded-lg text-[13px] font-medium disabled:opacity-50 hover:opacity-80 transition-opacity duration-150 mt-2"
            >
              {creating ? 'Creating...' : 'Start Planning'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- Main dashboard ---
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-5 py-3 flex items-center justify-between shrink-0">
        <div className="min-w-0">
          <h1 className="text-[15px] font-semibold text-neutral-900 truncate">
            {trip.title}
          </h1>
          <p className="text-[12px] text-neutral-500 mt-0.5">
            {formatDateRange(trip.startDate, trip.endDate)} &middot;{' '}
            {trip.stops.length} stop{trip.stops.length !== 1 ? 's' : ''}{' '}
            &middot; {trip.members.length} member
            {trip.members.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {routesLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-neutral-400" />
          )}
          <button
            onClick={startAddStop}
            className="w-[30px] h-[30px] bg-neutral-900 text-white rounded-lg text-[16px] leading-none font-light flex items-center justify-center hover:opacity-80 transition-opacity duration-150"
            title="Add Stop"
          >
            +
          </button>
          {sortedStops.length >= 2 && (
            <button
              onClick={openInGoogleMaps}
              className="w-[30px] h-[30px] border border-neutral-200 hover:border-neutral-300 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-all duration-150"
              title="Open in Google Maps"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          <button
            onClick={exportPDF}
            className="w-[30px] h-[30px] border border-neutral-200 hover:border-neutral-300 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-all duration-150"
            title="Print itinerary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={exportJSON}
            className="w-[30px] h-[30px] border border-neutral-200 hover:border-neutral-300 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-all duration-150"
            title="Download JSON"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-[30px] h-[30px] border border-neutral-200 hover:border-neutral-300 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-all duration-150"
            title="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </header>

      {showSettings && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.3)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowSettings(false); }}
        >
          <div className="bg-white border border-neutral-200 rounded-[10px] p-6 w-full max-w-sm shadow-lg expand-content">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[14px] font-semibold text-neutral-900">Settings</p>
              <button
                onClick={() => setShowSettings(false)}
                className="text-neutral-400 hover:text-neutral-900 text-[18px] leading-none transition-colors duration-150"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3">
              {/* Currency */}
              <div>
                <label className="block text-[10px] uppercase tracking-[1.2px] text-neutral-400 mb-1">Currency</label>
                <select
                  value={trip.settings?.currency || 'JPY'}
                  onChange={(e) => {
                    const curr = CURRENCIES.find(c => c.code === e.target.value);
                    if (curr && trip) {
                      saveTrip({
                        ...trip,
                        settings: { currency: curr.code, currencySymbol: curr.symbol },
                      });
                    }
                  }}
                  className="w-full px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-[13px] text-neutral-900 focus:outline-none focus:border-neutral-400 transition-[border-color] duration-150"
                >
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.symbol} {c.code} - {c.label}</option>
                  ))}
                </select>
              </div>

              {/* Trip Title */}
              <div>
                <label className="block text-[10px] uppercase tracking-[1.2px] text-neutral-400 mb-1">Trip Title</label>
                <input
                  type="text"
                  value={trip.title}
                  onChange={(e) => {
                    if (trip) saveTrip({ ...trip, title: e.target.value });
                  }}
                  className="w-full px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-[13px] text-neutral-900 focus:outline-none focus:border-neutral-400 transition-[border-color] duration-150"
                />
              </div>

              {/* Trip Dates */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase tracking-[1.2px] text-neutral-400 mb-1">Start</label>
                  <input
                    type="date"
                    value={trip.startDate}
                    onChange={(e) => {
                      if (trip) saveTrip({ ...trip, startDate: e.target.value });
                    }}
                    className="w-full px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-[13px] text-neutral-900 focus:outline-none focus:border-neutral-400 transition-[border-color] duration-150"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[1.2px] text-neutral-400 mb-1">End</label>
                  <input
                    type="date"
                    value={trip.endDate}
                    onChange={(e) => {
                      if (trip) saveTrip({ ...trip, endDate: e.target.value });
                    }}
                    className="w-full px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-[13px] text-neutral-900 focus:outline-none focus:border-neutral-400 transition-[border-color] duration-150"
                  />
                </div>
              </div>
            </div>

              {/* Delete trip */}
              <div className="border-t border-neutral-100 pt-3 mt-3">
                <button
                  onClick={async () => {
                    if (!window.confirm('Delete this entire trip? This cannot be undone.')) return;
                    setShowSettings(false);
                    await fetch('/api/trip', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ trip: null }),
                    });
                    setTrip(null);
                  }}
                  className="text-[12px] text-red-500 hover:text-red-600 transition-colors duration-150"
                >
                  Delete this trip
                </button>
              </div>

              <div className="border-t border-neutral-100 pt-3 mt-3">
                <p className="text-[10px] text-neutral-400 leading-relaxed">
                  Travel Planner by UENO Systems. Usage-based pricing. You pay only for third-party services consumed plus a small service fee. Data stored securely. No personal data collected or shared. Provided as-is without warranty.
                </p>
              </div>
          </div>
        </div>
      )}

      {/* Main split */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Map */}
        <div className="h-[40vh] md:h-full md:w-[55%] border-b md:border-b-0 md:border-r border-neutral-200 map-wrapper">
          <Map
            stops={sortedStops}
            transportSegments={trip.transportSegments}
            selectedStopId={selectedStopId}
            onStopClick={setSelectedStopId}
          />
        </div>

        {/* Timeline */}
        <div
          className="flex-1 overflow-y-auto timeline-scroll"
          style={{ background: 'var(--bg-secondary)' }}
        >
          <Timeline
            stops={sortedStops}
            transportSegments={trip.transportSegments}
            selectedStopId={selectedStopId}
            expandedStopId={expandedStopId}
            isAddingNew={isAddingNew}
            onStopClick={setSelectedStopId}
            onToggleExpand={toggleExpand}
            onSaveStop={handleSaveStop}
            onAddNewStop={addStop}
            onDeleteStop={deleteStop}
            onTransportEdit={updateTransportSegment}
            onMoveStop={moveStop}
            onStartAddStop={startAddStop}
            onCancelAddStop={cancelAddStop}
            currencySymbol={currencySymbol}
          />
        </div>
      </div>

      {/* Footer bar */}
      <div className="bg-white border-t border-neutral-200 px-5 py-2 shrink-0 flex items-center justify-between text-[10px] text-neutral-400">
        <span>Travel Planner by UENO Systems</span>
        <span>Usage-based pricing &middot; No data collected &middot; Provided &ldquo;as is&rdquo;</span>
      </div>
    </div>
  );
}
