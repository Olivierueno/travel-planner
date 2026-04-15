export interface TripSettings {
  currency: string;
  currencySymbol: string;
}

export const CURRENCIES: { code: string; symbol: string; label: string }[] = [
  { code: 'JPY', symbol: '\u00A5', label: 'Japanese Yen' },
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
  { code: 'EUR', symbol: '\u20AC', label: 'Euro' },
  { code: 'GBP', symbol: '\u00A3', label: 'British Pound' },
  { code: 'KHR', symbol: '\u17DB', label: 'Cambodian Riel' },
  { code: 'THB', symbol: '\u0E3F', label: 'Thai Baht' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar' },
  { code: 'KRW', symbol: '\u20A9', label: 'Korean Won' },
];

export const DEFAULT_SETTINGS: TripSettings = {
  currency: 'JPY',
  currencySymbol: '\u00A5',
};

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
  settings: TripSettings;
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
