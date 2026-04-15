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
  mode: 'car' | 'walk' = 'car'
): Promise<RouteResult> {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  if (!key) {
    throw new Error('Google Maps API key not configured');
  }

  const gmode = mode === 'walk' ? 'walking' : 'driving';
  const url = `${GMAPS_BASE}?origins=${fromLat},${fromLng}&destinations=${toLat},${toLng}&mode=${gmode}&key=${key}`;

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

  return {
    distanceKm: Math.round(element.distance.value / 100) / 10,
    durationMinutes: Math.round(element.duration.value / 60),
  };
}
