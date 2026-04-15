export interface RouteResult {
  distanceKm: number;
  durationMinutes: number;
}

const OSRM_BASE = 'https://router.project-osrm.org';

export async function getRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  mode: 'car' | 'walk' = 'car'
): Promise<RouteResult> {
  const profile = mode === 'walk' ? 'foot' : 'driving';
  const url = `${OSRM_BASE}/route/v1/${profile}/${fromLng},${fromLat};${toLng},${toLat}?overview=false`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`OSRM error: ${res.status}`);
  }

  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) {
    throw new Error('No route found');
  }

  return {
    distanceKm: Math.round(route.distance / 100) / 10,
    durationMinutes: Math.round(route.duration / 60),
  };
}
