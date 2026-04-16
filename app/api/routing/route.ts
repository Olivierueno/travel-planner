import { NextRequest, NextResponse } from 'next/server';
import { getRoute } from '@/lib/osrm';

const VALID_MODES = ['car', 'walk', 'train'] as const;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawFromLat = searchParams.get('from_lat');
  const rawFromLng = searchParams.get('from_lng');
  const rawToLat = searchParams.get('to_lat');
  const rawToLng = searchParams.get('to_lng');
  const modeParam = searchParams.get('mode') || 'car';

  const fromLat = parseFloat(rawFromLat || '');
  const fromLng = parseFloat(rawFromLng || '');
  const toLat = parseFloat(rawToLat || '');
  const toLng = parseFloat(rawToLng || '');

  if ([fromLat, fromLng, toLat, toLng].some(isNaN)) {
    console.error('Invalid coords raw:', { rawFromLat, rawFromLng, rawToLat, rawToLng });
    console.error('Invalid coords parsed:', { fromLat, fromLng, toLat, toLng });
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  // Validate coordinate ranges
  if (fromLat < -90 || fromLat > 90 || toLat < -90 || toLat > 90) {
    return NextResponse.json({ error: 'Latitude out of range' }, { status: 400 });
  }
  if (fromLng < -180 || fromLng > 180 || toLng < -180 || toLng > 180) {
    return NextResponse.json({ error: 'Longitude out of range' }, { status: 400 });
  }

  const mode = VALID_MODES.includes(modeParam as typeof VALID_MODES[number])
    ? (modeParam as 'car' | 'walk' | 'train')
    : 'car';

  try {
    const result = await getRoute(fromLat, fromLng, toLat, toLng, mode);
    return NextResponse.json(result);
  } catch (err) {
    console.error('Routing error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Routing failed' }, { status: 502 });
  }
}
