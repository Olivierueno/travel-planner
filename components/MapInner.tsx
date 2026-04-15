'use client';

import { useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Stop, TransportSegment } from '@/lib/types';
import { CATEGORY_CONFIG, TRANSPORT_CONFIG } from '@/lib/types';

function createNumberedIcon(number: number, color: string): L.DivIcon {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background: #fff;
      border: 2px solid ${color};
      border-radius: 50%;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 12px;
      color: ${color};
      box-shadow: 0 1px 4px rgba(0,0,0,0.15);
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    ">${number}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -18],
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
    const bounds = L.latLngBounds(
      stops.map((s) => [s.lat, s.lng] as [number, number])
    );
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
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds stops={stops} />
      <FlyToStop stop={selectedStop} />

      {stops.map((stop, index) => {
        const config =
          CATEGORY_CONFIG[stop.category] || CATEGORY_CONFIG.other;
        return (
          <Marker
            key={stop.id}
            position={[stop.lat, stop.lng]}
            icon={createNumberedIcon(index + 1, config.color)}
            eventHandlers={{ click: () => onStopClick(stop.id) }}
          >
            <Popup>
              <div>
                <div className="flex items-center gap-1.5 font-semibold text-neutral-900 text-[13px]">
                  <span>{config.icon}</span>
                  <span>{stop.name}</span>
                </div>
                {stop.date && (
                  <p className="text-neutral-500 text-[11px] mt-1">
                    {stop.date}
                  </p>
                )}
                {(stop.arrivalTime || stop.departureTime) && (
                  <p className="text-neutral-500 text-[11px] font-data">
                    {stop.arrivalTime || '--:--'} —{' '}
                    {stop.departureTime || '--:--'}
                  </p>
                )}
                {stop.costJPY > 0 && (
                  <p className="text-neutral-600 text-[11px] font-data font-medium mt-1">
                    ¥{stop.costJPY.toLocaleString()}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}

      {transportSegments.map((segment) => {
        if (!segment.routeGeometry || segment.routeGeometry.length < 2)
          return null;
        const config =
          TRANSPORT_CONFIG[segment.mode] || TRANSPORT_CONFIG.train;

        return (
          <Polyline
            key={segment.id}
            positions={segment.routeGeometry}
            pathOptions={{
              color: config.color,
              weight: 3,
              opacity: 0.6,
              ...(segment.mode === 'walk' ? { dashArray: '6, 10' } : {}),
            }}
          />
        );
      })}
    </MapContainer>
  );
}
