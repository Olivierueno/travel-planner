import { NextRequest, NextResponse } from 'next/server';
import { getTrip, saveTrip } from '@/lib/storage';
import type { Trip } from '@/lib/types';
import { DEFAULT_SETTINGS } from '@/lib/types';

export async function GET() {
  const trip = await getTrip();
  return NextResponse.json({ trip });
}

export async function PUT(request: NextRequest) {
  // Reject payloads over 1MB
  const contentLength = parseInt(request.headers.get('content-length') || '0');
  if (contentLength > 1_000_000) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  const { trip } = (await request.json()) as { trip: Trip | null };
  if (trip === null) {
    // Delete trip by saving empty state
    const { writeFile, mkdir } = await import('fs/promises');
    const { join } = await import('path');
    const dir = join(process.cwd(), 'data');
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'trip.json'), 'null');
    return NextResponse.json({ trip: null });
  }
  const saved = await saveTrip(trip);
  return NextResponse.json({ trip: saved });
}

export async function POST(request: NextRequest) {
  const { title, startDate, endDate, memberName } = await request.json();

  const colors = [
    '#f43f5e',
    '#3b82f6',
    '#22c55e',
    '#f59e0b',
    '#8b5cf6',
    '#06b6d4',
  ];

  const trip: Trip = {
    id: crypto.randomUUID(),
    title,
    description: '',
    startDate,
    endDate,
    members: [
      {
        id: crypto.randomUUID(),
        name: memberName,
        color: colors[0],
      },
    ],
    stops: [],
    transportSegments: [],
    changelog: [
      {
        id: crypto.randomUUID(),
        action: 'trip.created',
        detail: `Trip "${title}" created by ${memberName}`,
        member: memberName,
        timestamp: new Date().toISOString(),
      },
    ],
    settings: DEFAULT_SETTINGS,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const saved = await saveTrip(trip);
  return NextResponse.json({ trip: saved });
}
