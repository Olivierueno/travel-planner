import { Redis } from '@upstash/redis';
import type { Trip } from './types';

const TRIP_KEY = 'trip:data';

function getRedis(): Redis | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    return new Redis({ url, token });
  }
  return null;
}

export async function getTrip(): Promise<Trip | null> {
  const redis = getRedis();
  if (redis) {
    return redis.get<Trip>(TRIP_KEY);
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

  const redis = getRedis();
  if (redis) {
    await redis.set(TRIP_KEY, trip);
    return trip;
  }

  const { writeFile, mkdir } = await import('fs/promises');
  const { join } = await import('path');
  const dir = join(process.cwd(), 'data');
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'trip.json'), JSON.stringify(trip, null, 2));
  return trip;
}
