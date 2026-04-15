import { NextRequest, NextResponse } from 'next/server';
import { getRoute } from '@/lib/osrm';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fromLat = parseFloat(searchParams.get('from_lat') || '');
  const fromLng = parseFloat(searchParams.get('from_lng') || '');
  const toLat = parseFloat(searchParams.get('to_lat') || '');
  const toLng = parseFloat(searchParams.get('to_lng') || '');

  if ([fromLat, fromLng, toLat, toLng].some(isNaN)) {
    return NextResponse.json(
      { error: 'Missing or invalid coordinates' },
      { status: 400 }
    );
  }

  try {
    const result = await getRoute(fromLat, fromLng, toLat, toLng);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      {
        error: 'Routing failed',
        detail: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 502 }
    );
  }
}
