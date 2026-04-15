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
  durationMinutes: number;
  costJPY: number;
  notes: string;
}

export interface TransportSegment {
  id: string;
  fromStopId: string;
  toStopId: string;
  mode: TransportMode;
  distanceKm: number;
  durationMinutes: number;
  costJPY: number;
  routeGeometry: [number, number][];
  notes: string;
}

export type TransportMode =
  | 'shinkansen'
  | 'train'
  | 'bus'
  | 'walk'
  | 'taxi'
  | 'car'
  | 'flight'
  | 'ferry';

export interface ChangelogEntry {
  id: string;
  action: string;
  detail: string;
  member: string;
  timestamp: string;
}

export const CATEGORY_CONFIG: Record<
  StopCategory,
  { label: string; icon: string; color: string }
> = {
  temple: { label: 'Temple', icon: '\u26E9\uFE0F', color: '#dc2626' },
  shrine: { label: 'Shrine', icon: '\uD83C\uDFEF', color: '#ea580c' },
  museum: { label: 'Museum', icon: '\uD83C\uDFDB\uFE0F', color: '#7c3aed' },
  park: { label: 'Park', icon: '\uD83C\uDF33', color: '#16a34a' },
  food: { label: 'Food', icon: '\uD83C\uDF5C', color: '#e11d48' },
  shopping: { label: 'Shopping', icon: '\uD83D\uDECD\uFE0F', color: '#db2777' },
  onsen: { label: 'Onsen', icon: '\u2668\uFE0F', color: '#0891b2' },
  entertainment: { label: 'Entertainment', icon: '\uD83C\uDFAE', color: '#9333ea' },
  nature: { label: 'Nature', icon: '\uD83C\uDFD4\uFE0F', color: '#059669' },
  accommodation: { label: 'Accommodation', icon: '\uD83C\uDFE8', color: '#2563eb' },
  'transport-hub': { label: 'Transport Hub', icon: '\uD83D\uDE89', color: '#4f46e5' },
  other: { label: 'Other', icon: '\uD83D\uDCCD', color: '#6b7280' },
};

export const TRANSPORT_CONFIG: Record<
  TransportMode,
  { label: string; icon: string; color: string }
> = {
  shinkansen: { label: 'Shinkansen', icon: '\uD83D\uDE84', color: '#2563eb' },
  train: { label: 'Train', icon: '\uD83D\uDE83', color: '#3b82f6' },
  bus: { label: 'Bus', icon: '\uD83D\uDE8C', color: '#f59e0b' },
  walk: { label: 'Walk', icon: '\uD83D\uDEB6', color: '#22c55e' },
  taxi: { label: 'Taxi', icon: '\uD83D\uDE95', color: '#eab308' },
  car: { label: 'Car', icon: '\uD83D\uDE97', color: '#6366f1' },
  flight: { label: 'Flight', icon: '\u2708\uFE0F', color: '#8b5cf6' },
  ferry: { label: 'Ferry', icon: '\u26F4\uFE0F', color: '#06b6d4' },
};
