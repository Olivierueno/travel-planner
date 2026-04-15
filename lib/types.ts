export interface Trip {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  members: Member[];
  stops: Stop[];
  transportSegments: TransportSegment[];
  changelog: ChangelogEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface Member {
  id: string;
  name: string;
  color: string;
}

export interface Stop {
  id: string;
  name: string;
  description: string;
  category: StopCategory;
  lat: number;
  lng: number;
  date: string;
  arrivalTime: string;
  departureTime: string;
  durationMinutes: number;
  costJPY: number;
  notes: string;
  activities: Activity[];
  accommodations: Accommodation[];
  order: number;
  addedBy: string;
  createdAt: string;
}

export type StopCategory =
  | 'temple'
  | 'shrine'
  | 'museum'
  | 'park'
  | 'food'
  | 'shopping'
  | 'onsen'
  | 'entertainment'
  | 'nature'
  | 'accommodation'
  | 'transport-hub'
  | 'other';

export interface Activity {
  id: string;
  name: string;
  costJPY: number;
}

export interface Accommodation {
  id: string;
  name: string;
  costJPY: number;
}

export interface TransportSegment {
  id: string;
  fromStopId: string;
  toStopId: string;
  mode: TransportMode;
  distanceKm: number;
  durationMinutes: number;
  notes: string;
}

export type TransportMode = 'car' | 'walk' | 'train';

export interface ChangelogEntry {
  id: string;
  action: string;
  detail: string;
  member: string;
  timestamp: string;
}

export const CATEGORY_CONFIG: Record<
  StopCategory,
  { label: string; letter: string; color: string }
> = {
  temple: { label: 'Temple', letter: 'T', color: '#dc2626' },
  shrine: { label: 'Shrine', letter: 'S', color: '#ea580c' },
  museum: { label: 'Museum', letter: 'M', color: '#7c3aed' },
  park: { label: 'Park', letter: 'P', color: '#16a34a' },
  food: { label: 'Food', letter: 'F', color: '#e11d48' },
  shopping: { label: 'Shopping', letter: '$', color: '#db2777' },
  onsen: { label: 'Onsen', letter: 'O', color: '#0891b2' },
  entertainment: { label: 'Entertainment', letter: 'E', color: '#9333ea' },
  nature: { label: 'Nature', letter: 'N', color: '#059669' },
  accommodation: { label: 'Accommodation', letter: 'A', color: '#2563eb' },
  'transport-hub': { label: 'Transport', letter: 'H', color: '#4f46e5' },
  other: { label: 'Other', letter: '\u00B7', color: '#6b7280' },
};

export const TRANSPORT_CONFIG: Record<TransportMode, { label: string }> = {
  car: { label: 'Car' },
  train: { label: 'Train' },
  walk: { label: 'Walk' },
};

export function stopTotal(stop: Stop): number {
  const base = stop.costJPY || 0;
  const accom = (stop.accommodations || []).reduce((s, a) => s + (a.costJPY || 0), 0);
  const acts = (stop.activities || []).reduce((s, a) => s + (a.costJPY || 0), 0);
  return base + accom + acts;
}
