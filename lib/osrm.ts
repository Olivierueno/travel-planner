export interface RouteResult {
  distanceKm: number;
  durationMinutes: number;
  geometry: [number, number][];
}

const OSRM_BASE = 'https://router.project-osrm.org';

export async function getRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<RouteResult> {
  // OSRM uses longitude,latitude order
  const url = `${OSRM_BASE}/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?geometries=geojson&overview=full`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`OSRM error: ${res.status}`);
  }

  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) {
    throw new Error('No route found');
  }

  // GeoJSON coordinates are [lng, lat], convert to [lat, lng] for Leaflet
  const geometry: [number, number][] = route.geometry.coordinates.map(
    ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
  );

  return {
    distanceKm: Math.round(route.distance / 100) / 10,
    durationMinutes: Math.round(route.duration / 60),
    geometry,
  };
}
