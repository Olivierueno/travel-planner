'use client';

import { useMemo, useState } from 'react';
import type { Stop, TransportSegment } from '@/lib/types';

interface MapProps {
  stops: Stop[];
  transportSegments: TransportSegment[];
  selectedStopId: string | null;
  onStopClick: (stopId: string) => void;
}

function buildEmbedUrl(stops: Stop[]): string {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  // No API key — show a fallback message
  if (!key) return '';

  const base = 'https://www.google.com/maps/embed/v1';

  if (stops.length === 0) {
    return `${base}/view?key=${key}&center=36.5,138&zoom=6&maptype=satellite`;
  }

  if (stops.length === 1) {
    const s = stops[0];
    return `${base}/place?key=${key}&q=${s.lat},${s.lng}&zoom=14&maptype=satellite`;
  }

  // Directions mode: origin, destination, waypoints
  const origin = `${stops[0].lat},${stops[0].lng}`;
  const destination = `${stops[stops.length - 1].lat},${stops[stops.length - 1].lng}`;

  let url = `${base}/directions?key=${key}&origin=${origin}&destination=${destination}&maptype=satellite`;

  // Waypoints (stops in between first and last)
  if (stops.length > 2) {
    const waypoints = stops
      .slice(1, -1)
      .map((s) => `${s.lat},${s.lng}`)
      .join('|');
    url += `&waypoints=${encodeURIComponent(waypoints)}`;
  }

  return url;
}

export default function MapInner({ stops }: MapProps) {
  const mapUrl = useMemo(() => buildEmbedUrl(stops), [stops]);
  const [loaded, setLoaded] = useState(false);

  if (!mapUrl) {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center"
        style={{ background: 'var(--bg-secondary)' }}
      >
        <div className="w-10 h-10 rounded-lg border border-neutral-200 bg-white flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <div>
          <p className="text-[13px] font-medium text-neutral-900">
            Google Maps API key required
          </p>
          <p className="text-[12px] text-neutral-500 mt-1 max-w-[280px]">
            Add <span className="font-data text-[11px]">NEXT_PUBLIC_GOOGLE_MAPS_KEY</span> to
            your environment variables
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {!loaded && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: 'var(--bg-secondary)' }}
        >
          <span className="text-[13px] text-neutral-400">
            Loading Google Maps...
          </span>
        </div>
      )}
      <iframe
        src={mapUrl}
        className="w-full h-full border-0"
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
