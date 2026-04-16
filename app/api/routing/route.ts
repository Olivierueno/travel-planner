import { NextRequest, NextResponse } from 'next/server';
import { getRoute } from '@/lib/osrm';

const VALID_MODES = ['car', 'walk', 'train'] as const;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fromLat = parseFloat(searchParams.get('from_lat') || '');
  const fromLng = parseFloat(searchParams.get('from_lng') || '');
  const toLat = parseFloat(searchParams.get('to_lat') || '');
  const toLng = parseFloat(searchParams.get('to_lng') || '');
  const modeParam = searchParams.get('mode') || 'car';

  if ([fromLat, fromLng, toLat, toLng].some(isNaN)) {
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
  } catch {
    return NextResponse.json({ error: 'Routing failed' }, { status: 502 });
  }
}
