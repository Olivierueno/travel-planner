'use client';

import { useEffect, useRef, useMemo } from 'react';
import type { Stop, TransportSegment } from '@/lib/types';
import { stopTotal } from '@/lib/types';
import StopCard from './StopCard';
import TransportSegmentCard from './TransportSegment';

interface TimelineProps {
  stops: Stop[];
  transportSegments: TransportSegment[];
  selectedStopId: string | null;
  expandedStopId: string | null;
  isAddingNew: boolean;
  onStopClick: (stopId: string) => void;
  onToggleExpand: (stopId: string) => void;
  onSaveStop: (stop: Stop) => void;
  onAddNewStop: (stop: Stop) => void;
  onDeleteStop: (stopId: string) => void;
  onTransportEdit: (segment: TransportSegment) => void;
  onMoveStop: (stopId: string, direction: 'up' | 'down') => void;
  onStartAddStop: () => void;
  onCancelAddStop: () => void;
  currencySymbol: string;
}

function fmtDuration(m: number): string {
  if (!m || m <= 0) return '0m';
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const r = m % 60;
    return r > 0 ? `${h}h ${r}m` : `${h}h`;
  }
  return `${m}m`;
}

export default function Timeline({
  stops,
  transportSegments,
  selectedStopId,
  expandedStopId,
  isAddingNew,
  onStopClick,
  onToggleExpand,
  onSaveStop,
  onAddNewStop,
  onDeleteStop,
  onTransportEdit,
  onMoveStop,
  onStartAddStop,
  onCancelAddStop,
  currencySymbol,
}: TimelineProps) {
  const expandedRef = useRef<HTMLDivElement>(null);
  const newStopRef = useRef<HTMLDivElement>(null);

  function scrollToCard(el: HTMLElement) {
    const container = el.closest('.timeline-scroll') as HTMLElement | null;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const offset = elRect.top - containerRect.top + container.scrollTop;
    container.scrollTo({ top: offset - 12, behavior: 'smooth' });
  }

  useEffect(() => {
    if (expandedStopId && expandedRef.current) {
      scrollToCard(expandedRef.current);
    }
  }, [expandedStopId]);

  useEffect(() => {
    if (isAddingNew && newStopRef.current) {
      requestAnimationFrame(() => {
        if (newStopRef.current) scrollToCard(newStopRef.current);
      });
    }
  }, [isAddingNew]);

  // Trip summary totals
  const summary = useMemo(() => {
    const totalCost = stops.reduce((sum, s) => sum + stopTotal(s), 0);
    const totalDistance = transportSegments.reduce((sum, s) => sum + (s.distanceKm || 0), 0);
    const totalDuration = transportSegments.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
    return { totalCost, totalDistance, totalDuration };
  }, [stops, transportSegments]);

  if (stops.length === 0 && !isAddingNew) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <p className="text-[13px] font-medium text-neutral-900">No stops yet</p>
        <p className="text-[12px] text-neutral-500 mt-1">Add your first stop to start planning</p>
        <button
          onClick={onStartAddStop}
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
    <div className="p-3 pb-[8vh]">
      {/* Trip summary card */}
      {stops.length > 0 && (
        <div className="bg-white border border-neutral-200 rounded-[10px] px-3.5 py-2.5 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[9px] uppercase tracking-[1.2px] text-neutral-400">Distance</p>
              <p className="text-[13px] font-data font-medium text-neutral-900">
                {summary.totalDistance > 0 ? `${summary.totalDistance.toFixed(1)} km` : '--'}
              </p>
            </div>
            <div className="w-px h-6 bg-neutral-100" />
            <div>
              <p className="text-[9px] uppercase tracking-[1.2px] text-neutral-400">Travel</p>
              <p className="text-[13px] font-data font-medium text-neutral-900">
                {summary.totalDuration > 0 ? fmtDuration(summary.totalDuration) : '--'}
              </p>
            </div>
            <div className="w-px h-6 bg-neutral-100" />
            <div>
              <p className="text-[9px] uppercase tracking-[1.2px] text-neutral-400">Cost</p>
              <p className="text-[13px] font-data font-medium text-neutral-900">
                {summary.totalCost > 0 ? `${currencySymbol}${summary.totalCost.toLocaleString()}` : '--'}
              </p>
            </div>
          </div>
          <div className="text-[10px] text-neutral-400">
            {stops.length} stop{stops.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {stops.map((stop, idx) => {
        const next = idx < stops.length - 1 ? stops[idx + 1] : null;
        const seg = next ? findTransport(stop.id, next.id) : undefined;
        const isExpanded = expandedStopId === stop.id;

        return (
          <div
            key={stop.id}
            ref={isExpanded ? expandedRef : undefined}
          >
            <StopCard
              stop={stop}
              index={idx + 1}
              total={stops.length}
              isExpanded={isExpanded}
              onToggleExpand={() => onToggleExpand(stop.id)}
              onSave={onSaveStop}
              onDelete={() => onDeleteStop(stop.id)}
              onMove={(dir) => onMoveStop(stop.id, dir)}
              onCancel={() => onToggleExpand(stop.id)}
              currencySymbol={currencySymbol}
            />
            {seg && <TransportSegmentCard segment={seg} onEdit={onTransportEdit} />}
          </div>
        );
      })}

      {/* New stop inline card */}
      {isAddingNew && (
        <div ref={newStopRef} className="mt-3">
          <StopCard
            stop={null}
            index={stops.length + 1}
            total={stops.length}
            isExpanded={true}
            onToggleExpand={() => {}}
            onSave={onAddNewStop}
            onDelete={() => {}}
            onMove={() => {}}
            onCancel={onCancelAddStop}
            currencySymbol={currencySymbol}
          />
        </div>
      )}

      {/* Add stop button */}
      {!isAddingNew && (
        <button
          onClick={onStartAddStop}
          className="w-full mt-3 py-2 border border-dashed border-neutral-300 hover:border-neutral-400 rounded-[10px] text-[12px] text-neutral-400 hover:text-neutral-600 transition-all duration-150"
        >
          + Add Stop
        </button>
      )}
    </div>
  );
}
