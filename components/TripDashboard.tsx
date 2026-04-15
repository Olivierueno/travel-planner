'use client';

import { useState, useEffect, useMemo, useCallback, FormEvent } from 'react';
import dynamic from 'next/dynamic';
import type { Trip, Stop, TransportSegment } from '@/lib/types';
import { generateTimelineSVG } from '@/lib/export-svg';
import Timeline from './Timeline';
import AddStopModal from './AddStopModal';

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
  const [showAddStop, setShowAddStop] = useState(false);
  const [editingStop, setEditingStop] = useState<Stop | null>(null);
  const [routesLoading, setRoutesLoading] = useState(false);

  const [createTitle, setCreateTitle] = useState('');
  const [createStartDate, setCreateStartDate] = useState('');
  const [createEndDate, setCreateEndDate] = useState('');
  const [createMemberName, setCreateMemberName] = useState('');
  const [creating, setCreating] = useState(false);

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
      const sorted = [...stops].sort((a, b) => {
        const dc = a.date.localeCompare(b.date);
        return dc !== 0 ? dc : a.arrivalTime.localeCompare(b.arrivalTime);
      });

      if (sorted.length < 2) return [];

      setRoutesLoading(true);
      try {
        const pairs = sorted.slice(0, -1).map((from, i) => ({
          from,
          to: sorted[i + 1],
        }));

        return await Promise.all(
          pairs.map(async ({ from, to }) => {
            // Check for existing segment to preserve mode preference
            const existing = (existingSegments || []).find(
              (seg) => seg.fromStopId === from.id && seg.toStopId === to.id
            );
            const mode =
              existing?.mode === 'car' || existing?.mode === 'walk'
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
      await saveTrip({
        ...trip,
        stops: updatedStops,
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
      setShowAddStop(false);
      setEditingStop(null);
    },
    [trip, calculateRoutes, saveTrip]
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
      await saveTrip({
        ...trip,
        stops: updatedStops,
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
      setShowAddStop(false);
      setEditingStop(null);
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
      await saveTrip({
        ...trip,
        stops: updatedStops,
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
    },
    [trip, calculateRoutes, saveTrip, selectedStopId]
  );

  const updateTransportSegment = useCallback(
    async (updated: TransportSegment) => {
      if (!trip) return;

      // Re-fetch routing data for the new mode
      const fromStop = trip.stops.find((s) => s.id === updated.fromStopId);
      const toStop = trip.stops.find((s) => s.id === updated.toStopId);

      let finalSegment = updated;
      if (fromStop && toStop) {
        try {
          const mode =
            updated.mode === 'car' || updated.mode === 'walk'
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
      await saveTrip({ ...trip, stops: sorted, transportSegments: segments });
    },
    [trip, calculateRoutes, saveTrip]
  );

  const exportSVG = useCallback(() => {
    if (!trip || sortedStops.length === 0) return;
    const svg = generateTimelineSVG(sortedStops, trip.transportSegments, trip.title);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${trip.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [trip, sortedStops]);

  const openInGoogleMaps = useCallback(() => {
    if (sortedStops.length === 0) return;
    const coords = sortedStops.map((s) => `${s.lat},${s.lng}`);
    window.open(
      `https://www.google.com/maps/dir/${coords.join('/')}`,
      '_blank'
    );
  }, [sortedStops]);

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
                placeholder="e.g., Olivier"
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
            onClick={() => {
              setEditingStop(null);
              setShowAddStop(true);
            }}
            className="px-4 py-[7px] bg-neutral-900 text-white rounded-lg text-[12px] font-medium hover:opacity-80 transition-opacity duration-150"
          >
            + Add Stop
          </button>
          {sortedStops.length >= 2 && (
            <button
              onClick={openInGoogleMaps}
              className="px-3 py-[7px] border border-neutral-200 hover:border-neutral-300 rounded-lg text-[12px] font-medium text-neutral-600 transition-all duration-150"
              title="Open full route in Google Maps"
            >
              Map
            </button>
          )}
          <button
            onClick={exportSVG}
            className="px-3 py-[7px] border border-neutral-200 hover:border-neutral-300 rounded-lg text-[12px] font-medium text-neutral-600 transition-all duration-150"
            title="Download timeline as SVG"
          >
            SVG
          </button>
          <button
            onClick={exportJSON}
            className="px-3 py-[7px] border border-neutral-200 hover:border-neutral-300 rounded-lg text-[12px] font-medium text-neutral-600 transition-all duration-150"
            title="Download trip data as JSON"
          >
            JSON
          </button>
        </div>
      </header>

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
            onStopClick={setSelectedStopId}
            onSaveStop={saveStop}
            onEditStop={(stop) => {
              setEditingStop(stop);
              setShowAddStop(true);
            }}
            onDeleteStop={deleteStop}
            onTransportEdit={updateTransportSegment}
            onMoveStop={moveStop}
            onAddStop={() => {
              setEditingStop(null);
              setShowAddStop(true);
            }}
          />
        </div>
      </div>

      {/* Modal */}
      {showAddStop && (
        <AddStopModal
          isOpen={showAddStop}
          onClose={() => {
            setShowAddStop(false);
            setEditingStop(null);
          }}
          onSave={editingStop ? editStop : addStop}
          editingStop={editingStop}
          existingStopsCount={trip.stops.length}
        />
      )}
    </div>
  );
}
