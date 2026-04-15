'use client';

import { useState, useEffect, useMemo, useCallback, FormEvent } from 'react';
import dynamic from 'next/dynamic';
import type { Trip, Stop, TransportSegment } from '@/lib/types';
import Timeline from './Timeline';
import AddStopModal from './AddStopModal';

const Map = dynamic(() => import('./MapInner'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-100 flex items-center justify-center">
      <div className="animate-pulse text-slate-400">Loading map...</div>
    </div>
  ),
});

function formatDateRange(start: string, end: string): string {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  const sMonth = monthNames[s.getMonth()];
  const eMonth = monthNames[e.getMonth()];
  const sDay = s.getDate();
  const eDay = e.getDate();
  const eYear = e.getFullYear();

  if (start === end) {
    return `${sMonth} ${sDay}, ${eYear}`;
  }
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${sMonth} ${sDay} - ${eDay}, ${eYear}`;
  }
  return `${sMonth} ${sDay} - ${eMonth} ${eDay}, ${eYear}`;
}

export default function TripDashboard() {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [showAddStop, setShowAddStop] = useState(false);
  const [editingStop, setEditingStop] = useState<Stop | null>(null);
  const [routesLoading, setRoutesLoading] = useState(false);

  // Create trip form state
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
      // Network error — leave trip as null
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrip();
  }, [fetchTrip]);

  const saveTrip = useCallback(async (updated: Trip) => {
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
      // Revert on error by re-fetching
      fetchTrip();
    }
  }, [fetchTrip]);

  const calculateRoutes = useCallback(async (stops: Stop[]): Promise<TransportSegment[]> => {
    const sorted = [...stops].sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.arrivalTime.localeCompare(b.arrivalTime);
    });

    if (sorted.length < 2) return [];

    setRoutesLoading(true);
    try {
      const pairs: { from: Stop; to: Stop }[] = [];
      for (let i = 0; i < sorted.length - 1; i++) {
        pairs.push({ from: sorted[i], to: sorted[i + 1] });
      }

      const results = await Promise.all(
        pairs.map(async ({ from, to }) => {
          try {
            const params = new URLSearchParams({
              from_lat: String(from.lat),
              from_lng: String(from.lng),
              to_lat: String(to.lat),
              to_lng: String(to.lng),
            });
            const res = await fetch(`/api/routing?${params}`);
            if (!res.ok) throw new Error('Routing failed');
            const data = await res.json();
            return {
              id: `${from.id}-${to.id}`,
              fromStopId: from.id,
              toStopId: to.id,
              mode: 'train' as const,
              distanceKm: data.distanceKm || 0,
              durationMinutes: data.durationMinutes || 0,
              costJPY: 0,
              routeGeometry: data.geometry || [
                [from.lat, from.lng],
                [to.lat, to.lng],
              ],
              notes: '',
            };
          } catch {
            // Fallback: straight line
            return {
              id: `${from.id}-${to.id}`,
              fromStopId: from.id,
              toStopId: to.id,
              mode: 'train' as const,
              distanceKm: 0,
              durationMinutes: 0,
              costJPY: 0,
              routeGeometry: [
                [from.lat, from.lng] as [number, number],
                [to.lat, to.lng] as [number, number],
              ],
              notes: '',
            };
          }
        })
      );

      return results;
    } finally {
      setRoutesLoading(false);
    }
  }, []);

  const addStop = useCallback(async (stopData: Stop) => {
    if (!trip) return;

    const newStop: Stop = {
      ...stopData,
      order: trip.stops.length,
    };

    const updatedStops = [...trip.stops, newStop];
    const transportSegments = await calculateRoutes(updatedStops);

    const changelog = [
      ...trip.changelog,
      {
        id: crypto.randomUUID(),
        action: 'stop.added',
        detail: `Added stop "${newStop.name}"`,
        member: 'Me',
        timestamp: new Date().toISOString(),
      },
    ];

    const updated: Trip = {
      ...trip,
      stops: updatedStops,
      transportSegments,
      changelog,
      updatedAt: new Date().toISOString(),
    };

    setShowAddStop(false);
    setEditingStop(null);
    await saveTrip(updated);
  }, [trip, calculateRoutes, saveTrip]);

  const editStop = useCallback(async (updatedStop: Stop) => {
    if (!trip) return;

    const updatedStops = trip.stops.map((s) =>
      s.id === updatedStop.id ? updatedStop : s
    );
    const transportSegments = await calculateRoutes(updatedStops);

    const changelog = [
      ...trip.changelog,
      {
        id: crypto.randomUUID(),
        action: 'stop.edited',
        detail: `Edited stop "${updatedStop.name}"`,
        member: 'Me',
        timestamp: new Date().toISOString(),
      },
    ];

    const updated: Trip = {
      ...trip,
      stops: updatedStops,
      transportSegments,
      changelog,
      updatedAt: new Date().toISOString(),
    };

    setShowAddStop(false);
    setEditingStop(null);
    await saveTrip(updated);
  }, [trip, calculateRoutes, saveTrip]);

  const deleteStop = useCallback(async (stopId: string) => {
    if (!trip) return;
    const stopToDelete = trip.stops.find((s) => s.id === stopId);
    if (!stopToDelete) return;

    if (!window.confirm(`Delete "${stopToDelete.name}"?`)) return;

    const updatedStops = trip.stops.filter((s) => s.id !== stopId);
    const transportSegments = await calculateRoutes(updatedStops);

    const changelog = [
      ...trip.changelog,
      {
        id: crypto.randomUUID(),
        action: 'stop.deleted',
        detail: `Deleted stop "${stopToDelete.name}"`,
        member: 'Me',
        timestamp: new Date().toISOString(),
      },
    ];

    const updated: Trip = {
      ...trip,
      stops: updatedStops,
      transportSegments,
      changelog,
      updatedAt: new Date().toISOString(),
    };

    if (selectedStopId === stopId) setSelectedStopId(null);
    await saveTrip(updated);
  }, [trip, calculateRoutes, saveTrip, selectedStopId]);

  const updateTransportSegment = useCallback(async (updatedSegment: TransportSegment) => {
    if (!trip) return;

    const updatedSegments = trip.transportSegments.map((seg) =>
      seg.id === updatedSegment.id ? updatedSegment : seg
    );

    const updated: Trip = {
      ...trip,
      transportSegments: updatedSegments,
      updatedAt: new Date().toISOString(),
    };

    await saveTrip(updated);
  }, [trip, saveTrip]);

  const exportJSON = useCallback(() => {
    if (!trip) return;
    const blob = new Blob([JSON.stringify(trip, null, 2)], { type: 'application/json' });
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
    return [...trip.stops].sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.arrivalTime.localeCompare(b.arrivalTime);
    });
  }, [trip]);

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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-500" />
      </div>
    );
  }

  // No trip — show creation form
  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Create Your Trip</h1>
            <p className="text-slate-500 text-sm mt-2">
              Set up the basics to start planning your Japan adventure
            </p>
          </div>

          <form onSubmit={handleCreateTrip} className="space-y-4">
            <div>
              <label htmlFor="create-title" className="block text-sm font-medium text-slate-700 mb-1">
                Trip Title
              </label>
              <input
                id="create-title"
                type="text"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                placeholder="e.g., Spring Japan 2025"
                required
                className="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="create-start" className="block text-sm font-medium text-slate-700 mb-1">
                  Start Date
                </label>
                <input
                  id="create-start"
                  type="date"
                  value={createStartDate}
                  onChange={(e) => setCreateStartDate(e.target.value)}
                  required
                  className="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="create-end" className="block text-sm font-medium text-slate-700 mb-1">
                  End Date
                </label>
                <input
                  id="create-end"
                  type="date"
                  value={createEndDate}
                  onChange={(e) => setCreateEndDate(e.target.value)}
                  required
                  className="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="create-name" className="block text-sm font-medium text-slate-700 mb-1">
                Your Name
              </label>
              <input
                id="create-name"
                type="text"
                value={createMemberName}
                onChange={(e) => setCreateMemberName(e.target.value)}
                placeholder="e.g., Olivier"
                required
                className="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-lg p-3 w-full font-medium transition-colors duration-200 mt-2"
            >
              {creating ? 'Creating...' : 'Start Planning'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Main trip dashboard
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-900 truncate">{trip.title}</h1>
          <p className="text-sm text-slate-500">
            {formatDateRange(trip.startDate, trip.endDate)} · {trip.stops.length} stop{trip.stops.length !== 1 ? 's' : ''} · {trip.members.length} member{trip.members.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {routesLoading && (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-rose-500" />
          )}
          <button
            onClick={() => {
              setEditingStop(null);
              setShowAddStop(true);
            }}
            className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + Add Stop
          </button>
          <button
            onClick={exportJSON}
            className="border border-slate-300 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 transition-colors"
          >
            Export JSON
          </button>
        </div>
      </header>

      {/* Main split */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Map — left side on desktop, top on mobile */}
        <div className="h-[40vh] md:h-full md:w-[55%] border-b md:border-b-0 md:border-r border-slate-200">
          <Map
            stops={sortedStops}
            transportSegments={trip.transportSegments}
            selectedStopId={selectedStopId}
            onStopClick={setSelectedStopId}
          />
        </div>

        {/* Timeline — right side on desktop, bottom on mobile */}
        <div className="flex-1 overflow-y-auto timeline-scroll">
          <Timeline
            stops={sortedStops}
            transportSegments={trip.transportSegments}
            selectedStopId={selectedStopId}
            onStopClick={setSelectedStopId}
            onEditStop={(stop) => {
              setEditingStop(stop);
              setShowAddStop(true);
            }}
            onDeleteStop={deleteStop}
            onTransportEdit={updateTransportSegment}
            tripStartDate={trip.startDate}
          />
        </div>
      </div>

      {/* Add/Edit Stop Modal */}
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
