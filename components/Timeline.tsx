'use client';

import type { Stop, TransportSegment } from '@/lib/types';
import StopCard from './StopCard';
import TransportSegmentCard from './TransportSegment';

interface TimelineProps {
  stops: Stop[];
  transportSegments: TransportSegment[];
  selectedStopId: string | null;
  onStopClick: (stopId: string) => void;
  onSaveStop: (stop: Stop) => void;
  onEditStop: (stop: Stop) => void;
  onDeleteStop: (stopId: string) => void;
  onTransportEdit: (segment: TransportSegment) => void;
  onMoveStop: (stopId: string, direction: 'up' | 'down') => void;
  onAddStop: () => void;
}

export default function Timeline({
  stops,
  transportSegments,
  selectedStopId,
  onStopClick,
  onSaveStop,
  onEditStop,
  onDeleteStop,
  onTransportEdit,
  onMoveStop,
  onAddStop,
}: TimelineProps) {
  if (stops.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <p className="text-[13px] font-medium text-neutral-900">No stops yet</p>
        <p className="text-[12px] text-neutral-500 mt-1">Add your first stop to start planning</p>
        <button
          onClick={onAddStop}
          className="mt-4 px-4 py-2 bg-neutral-900 text-white rounded-lg text-[12px] font-medium hover:opacity-80 transition-opacity duration-150"
        >
          + Add Stop
        </button>
      </div>
    );
  }

  function findTransport(fromId: string, toId: string) {
    return transportSegments.find(
      (s) => s.fromStopId === fromId && s.toStopId === toId
    );
  }

  return (
    <div className="p-3">
      {stops.map((stop, idx) => {
        const next = idx < stops.length - 1 ? stops[idx + 1] : null;
        const seg = next ? findTransport(stop.id, next.id) : undefined;

        return (
          <div key={stop.id}>
            <StopCard
              stop={stop}
              index={idx + 1}
              total={stops.length}
              isSelected={selectedStopId === stop.id}
              onStopClick={() => onStopClick(stop.id)}
              onSave={onSaveStop}
              onEdit={() => onEditStop(stop)}
              onDelete={() => onDeleteStop(stop.id)}
              onMove={(dir) => onMoveStop(stop.id, dir)}
            />
            {seg && <TransportSegmentCard segment={seg} onEdit={onTransportEdit} />}
          </div>
        );
      })}

      <button
        onClick={onAddStop}
        className="w-full mt-3 py-2 border border-dashed border-neutral-300 hover:border-neutral-400 rounded-[10px] text-[12px] text-neutral-400 hover:text-neutral-600 transition-all duration-150"
      >
        + Add Stop
      </button>
    </div>
  );
}
