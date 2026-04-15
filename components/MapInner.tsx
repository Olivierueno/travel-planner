'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Stop, TransportSegment } from '@/lib/types';
import { CATEGORY_CONFIG, TRANSPORT_CONFIG } from '@/lib/types';

function createNumberedIcon(number: number, color: string): L.DivIcon {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background: white;
      border: 3px solid ${color};
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 13px;
      color: ${color};
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    ">${number}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  });
}

function FitBounds({ stops }: { stops: Stop[] }) {
  const map = useMap();
  useEffect(() => {
    if (stops.length === 0) {
      map.setView([36.5, 138], 6);
      return;
    }
    if (stops.length === 1) {
      map.setView([stops[0].lat, stops[0].lng], 13);
      return;
    }
    const bounds = L.latLngBounds(stops.map((s) => [s.lat, s.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [stops, map]);
  return null;
}

function FlyToStop({ stop }: { stop: Stop | undefined }) {
  const map = useMap();
  useEffect(() => {
    if (stop) {
      map.flyTo([stop.lat, stop.lng], 14, { duration: 0.5 });
    }
  }, [stop, map]);
  return null;
}

interface MapProps {
  stops: Stop[];
  transportSegments: TransportSegment[];
  selectedStopId: string | null;
  onStopClick: (stopId: string) => void;
}

function formatTime(time: string): string {
  return time || '--:--';
}

export default function MapInner({
  stops,
  transportSegments,
  selectedStopId,
  onStopClick,
}: MapProps) {
  const selectedStop = selectedStopId
    ? stops.find((s) => s.id === selectedStopId)
    : undefined;

  return (
    <MapContainer
      center={[36.5, 138]}
      zoom={6}
      className="h-full w-full"
      zoomControl={true}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds stops={stops} />
      <FlyToStop stop={selectedStop} />

      {/* Stop markers */}
      {stops.map((stop, index) => {
        const config = CATEGORY_CONFIG[stop.category] || CATEGORY_CONFIG.other;
        return (
          <Marker
            key={stop.id}
            position={[stop.lat, stop.lng]}
            icon={createNumberedIcon(index + 1, config.color)}
            eventHandlers={{
              click: () => onStopClick(stop.id),
            }}
          >
            <Popup>
              <div className="text-sm min-w-[140px]">
                <div className="flex items-center gap-1 font-semibold text-slate-900">
                  <span>{config.icon}</span>
                  <span>{stop.name}</span>
                </div>
                {stop.date && (
                  <p className="text-slate-500 text-xs mt-1">{stop.date}</p>
                )}
                {(stop.arrivalTime || stop.departureTime) && (
                  <p className="text-slate-500 text-xs">
                    {formatTime(stop.arrivalTime)} → {formatTime(stop.departureTime)}
                  </p>
                )}
                {stop.costJPY > 0 && (
                  <p className="text-emerald-600 text-xs font-medium mt-1">
                    ¥{stop.costJPY.toLocaleString()}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Transport route polylines */}
      {transportSegments.map((segment) => {
        if (!segment.routeGeometry || segment.routeGeometry.length < 2) return null;
        const config = TRANSPORT_CONFIG[segment.mode] || TRANSPORT_CONFIG.train;
        const isWalk = segment.mode === 'walk';

        return (
          <Polyline
            key={segment.id}
            positions={segment.routeGeometry}
            pathOptions={{
              color: config.color,
              weight: 4,
              opacity: 0.7,
              ...(isWalk ? { dashArray: '8, 12' } : {}),
            }}
          />
        );
      })}
    </MapContainer>
  );
}
