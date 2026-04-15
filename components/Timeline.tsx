'use client';

import type { Stop, TransportSegment } from '@/lib/types';
import StopCard from './StopCard';
import TransportSegmentCard from './TransportSegment';

interface TimelineProps {
  stops: Stop[];
  transportSegments: TransportSegment[];
  selectedStopId: string | null;
  onStopClick: (stopId: string) => void;
  onEditStop: (stop: Stop) => void;
  onDeleteStop: (stopId: string) => void;
  onTransportEdit: (segment: TransportSegment) => void;
  tripStartDate?: string;
}

function formatDateHeader(dateStr: string, tripStartDate?: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const dayName = dayNames[date.getDay()];
  const monthName = monthNames[date.getMonth()];
  const dayNum = date.getDate();

  let dayLabel = '';
  if (tripStartDate) {
    const start = new Date(tripStartDate + 'T00:00:00');
    const diffMs = date.getTime() - start.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    dayLabel = `Day ${diffDays + 1} — `;
  }

  return `${dayLabel}${dayName}, ${monthName} ${dayNum}`;
}

export default function Timeline({
  stops,
  transportSegments,
  selectedStopId,
  onStopClick,
  onEditStop,
  onDeleteStop,
  onTransportEdit,
  tripStartDate,
}: TimelineProps) {
  if (stops.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="text-slate-500 font-medium">No stops planned yet</p>
        <p className="text-slate-400 text-sm mt-1">
          Click &quot;Add Stop&quot; to start building your itinerary
        </p>
      </div>
    );
  }

  // Group stops by date
  const grouped: Record<string, Stop[]> = {};
  for (const stop of stops) {
    const dateKey = stop.date || 'unscheduled';
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(stop);
  }

  const sortedDates = Object.keys(grouped).sort();

  // Build a flat ordered list of stop IDs to find transport between consecutive stops
  const flatStopIds = stops.map((s) => s.id);

  function findTransportSegment(fromStopId: string, toStopId: string): TransportSegment | undefined {
    return transportSegments.find(
      (seg) => seg.fromStopId === fromStopId && seg.toStopId === toStopId
    );
  }

  return (
    <div className="p-4 space-y-0">
      {sortedDates.map((dateKey) => (
        <div key={dateKey} className="mb-4">
          {/* Date header */}
          <div className="sticky top-0 bg-slate-50 z-10 py-2 mb-2">
            <h2 className="text-sm font-semibold text-slate-700">
              {dateKey === 'unscheduled'
                ? 'Unscheduled'
                : formatDateHeader(dateKey, tripStartDate)}
            </h2>
          </div>

          {/* Stops in this date group */}
          <div className="space-y-0">
            {grouped[dateKey].map((stop) => {
              const globalIndex = flatStopIds.indexOf(stop.id);
              const nextStopId = globalIndex < flatStopIds.length - 1 ? flatStopIds[globalIndex + 1] : null;
              const transport = nextStopId ? findTransportSegment(stop.id, nextStopId) : undefined;

              return (
                <div key={stop.id}>
                  <StopCard
                    stop={stop}
                    index={globalIndex + 1}
                    isSelected={selectedStopId === stop.id}
                    onStopClick={() => onStopClick(stop.id)}
                    onEdit={() => onEditStop(stop)}
                    onDelete={() => onDeleteStop(stop.id)}
                  />
                  {transport && (
                    <TransportSegmentCard
                      segment={transport}
                      onEdit={onTransportEdit}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
