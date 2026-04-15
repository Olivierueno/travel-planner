import { NextRequest, NextResponse } from 'next/server';

interface NominatimResult {
  name?: string;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=jp&limit=5&addressdetails=1`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'TravelPlanner/1.0 (travel-planner-app)',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ results: [] });
    }

    const data: NominatimResult[] = await res.json();
    const results = data.map((item) => ({
      name: item.name || item.display_name.split(',')[0],
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      type: item.type,
    }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
