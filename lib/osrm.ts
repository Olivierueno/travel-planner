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
  if (!key) throw new Error('Google Maps API key not configured');

  const gmodeMap = { car: 'driving', walk: 'walking', train: 'transit' } as const;
  const gmode = gmodeMap[mode] || 'driving';

  const params = new URLSearchParams({
    origins: `${fromLat},${fromLng}`,
    destinations: `${toLat},${toLng}`,
    mode: gmode,
    key,
  });
  // departure_time required for transit and gives traffic-aware times for driving
  if (gmode === 'transit' || gmode === 'driving') {
    params.set('departure_time', String(Math.floor(Date.now() / 1000)));
  }

  const res = await fetch(`${GMAPS_BASE}?${params}`);
  if (!res.ok) throw new Error(`Google Maps error: ${res.status}`);

  const data = await res.json();
  if (data.status !== 'OK') {
    throw new Error(`Google Maps API: ${data.status} - ${data.error_message || 'no detail'}`);
  }

  const element = data.rows?.[0]?.elements?.[0];

  // Transit may return ZERO_RESULTS - fall back to driving
  if ((!element || element.status !== 'OK') && mode === 'train') {
    return getRoute(fromLat, fromLng, toLat, toLng, 'car');
  }

  if (!element || element.status !== 'OK') {
    throw new Error(`No route found: ${element?.status || 'unknown'}`);
  }

  const durationSec = element.duration_in_traffic?.value || element.duration.value;

  return {
    distanceKm: Math.round(element.distance.value / 100) / 10,
    durationMinutes: Math.round(durationSec / 60),
  };
}
