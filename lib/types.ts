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
  arrivalDate: string;
  arrivalTime: string;
  departureDate: string;
  departureTime: string;
  costJPY: number;
  notes: string;
  activities: Activity[];
  accommodations: Accommodation[];
  order: number;
  addedBy: string;
  createdAt: string;
}

export function stayDuration(stop: Stop): string {
  if (!stop.arrivalDate || !stop.departureDate) return '';
  const arr = new Date(`${stop.arrivalDate}T${stop.arrivalTime || '00:00'}`);
  const dep = new Date(`${stop.departureDate}T${stop.departureTime || '00:00'}`);
  const mins = Math.floor((dep.getTime() - arr.getTime()) / 60000);
  if (mins <= 0) return '';
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0 && d === 0) parts.push(`${m}m`);
  return parts.join(' ') || '';
}

export function autoCalculateArrivals(
  stops: Stop[],
  segments: TransportSegment[]
): Stop[] {
  const sorted = [...stops].sort((a, b) => a.order - b.order);
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const seg = segments.find(
      (s) => s.fromStopId === prev.id && s.toStopId === sorted[i].id
    );
    if (prev.departureDate && prev.departureTime && seg && seg.durationMinutes > 0) {
      const dep = new Date(`${prev.departureDate}T${prev.departureTime}`);
      dep.setMinutes(dep.getMinutes() + seg.durationMinutes);
      sorted[i] = {
        ...sorted[i],
        arrivalDate: dep.toISOString().split('T')[0],
        arrivalTime: dep.toTimeString().slice(0, 5),
      };
    }
  }
  return sorted;
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
