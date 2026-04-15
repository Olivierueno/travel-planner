export interface RouteResult {
  distanceKm: number;
  durationMinutes: number;
}

const GMAPS_BASE = 'https://maps.googleapis.com/maps/api/distancematrix/json';

export async function getRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  mode: 'car' | 'walk' | 'train' = 'car'
): Promise<RouteResult> {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  if (!key) {
    throw new Error('Google Maps API key not configured');
  }

  const gmodeMap = { car: 'driving', walk: 'walking', train: 'transit' } as const;
  const gmode = gmodeMap[mode] || 'driving';
  // departure_time=now gives traffic-aware duration and is required for transit
  const needsDeparture = gmode === 'driving' || gmode === 'transit';
  const traffic = needsDeparture ? '&departure_time=now' : '';
  const url = `${GMAPS_BASE}?origins=${fromLat},${fromLng}&destinations=${toLat},${toLng}&mode=${gmode}${traffic}&key=${key}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Google Maps error: ${res.status}`);
  }

  const data = await res.json();

  if (data.status !== 'OK') {
    throw new Error(`Google Maps API: ${data.status}`);
  }

  const element = data.rows?.[0]?.elements?.[0];
  if (!element || element.status !== 'OK') {
    throw new Error(`No route found: ${element?.status || 'unknown'}`);
  }

  // Use traffic-aware duration when available, fall back to standard
  const durationSec = element.duration_in_traffic?.value || element.duration.value;

  return {
    distanceKm: Math.round(element.distance.value / 100) / 10,
    durationMinutes: Math.round(durationSec / 60),
  };
}
