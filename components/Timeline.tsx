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
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  let prefix = '';
  if (tripStartDate) {
    const start = new Date(tripStartDate + 'T00:00:00');
    const diff = Math.round(
      (date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    prefix = `Day ${diff + 1} — `;
  }

  return `${prefix}${dayNames[date.getDay()]}, ${monthNames[date.getMonth()]} ${date.getDate()}`;
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
        <div className="w-10 h-10 rounded-lg border border-neutral-200 bg-neutral-50 flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
        <p className="text-[14px] font-medium text-neutral-900">
          No stops planned yet
        </p>
        <p className="text-[13px] text-neutral-500 mt-1">
          Click &quot;Add Stop&quot; to start building your itinerary
        </p>
      </div>
    );
  }

  const grouped: Record<string, Stop[]> = {};
  for (const stop of stops) {
    const key = stop.date || 'unscheduled';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(stop);
  }

  const sortedDates = Object.keys(grouped).sort();
  const flatStopIds = stops.map((s) => s.id);

  function findTransport(fromId: string, toId: string) {
    return transportSegments.find(
      (seg) => seg.fromStopId === fromId && seg.toStopId === toId
    );
  }

  return (
    <div className="p-4">
      {sortedDates.map((dateKey) => (
        <div key={dateKey} className="mb-6">
          <div className="sticky top-0 z-10 py-2 mb-3" style={{ background: 'var(--bg-secondary)' }}>
            <h2 className="text-[11px] uppercase tracking-[1.5px] text-neutral-500 font-normal">
              {dateKey === 'unscheduled'
                ? 'Unscheduled'
                : formatDateHeader(dateKey, tripStartDate)}
            </h2>
          </div>

          <div className="space-y-0">
            {grouped[dateKey].map((stop) => {
              const globalIdx = flatStopIds.indexOf(stop.id);
              const nextId =
                globalIdx < flatStopIds.length - 1
                  ? flatStopIds[globalIdx + 1]
                  : null;
              const transport = nextId
                ? findTransport(stop.id, nextId)
                : undefined;

              return (
                <div key={stop.id}>
                  <StopCard
                    stop={stop}
                    index={globalIdx + 1}
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
