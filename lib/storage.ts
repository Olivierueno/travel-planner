import type { Trip } from './types';

const TRIP_KEY = 'trip:data';

function useKV(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

export async function getTrip(): Promise<Trip | null> {
  if (useKV()) {
    const { kv } = await import('@vercel/kv');
    return kv.get<Trip>(TRIP_KEY);
  }

  const { readFile } = await import('fs/promises');
  const { join } = await import('path');
  try {
    const data = await readFile(
      join(process.cwd(), 'data', 'trip.json'),
      'utf-8'
    );
    return JSON.parse(data) as Trip;
  } catch {
    return null;
  }
}

export async function saveTrip(trip: Trip): Promise<Trip> {
  trip.updatedAt = new Date().toISOString();

  if (useKV()) {
    const { kv } = await import('@vercel/kv');
    await kv.set(TRIP_KEY, trip);
    return trip;
  }

  const { writeFile, mkdir } = await import('fs/promises');
  const { join } = await import('path');
  const dir = join(process.cwd(), 'data');
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'trip.json'), JSON.stringify(trip, null, 2));
  return trip;
}
