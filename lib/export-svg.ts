import type { Stop, TransportSegment } from './types';
import { stopTotal } from './types';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtDuration(m: number): string {
  if (!m || m <= 0) return '';
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const r = m % 60;
    return r > 0 ? `${h}h ${r}m` : `${h}h`;
  }
  return `${m}m`;
}

export function generateTimelineSVG(
  stops: Stop[],
  segments: TransportSegment[],
  title: string
): string {
  const w = 520;
  const nodeH = 56;
  const segH = 32;
  const pad = 40;
  const titleH = 50;
  const totalH =
    pad * 2 +
    titleH +
    stops.length * nodeH +
    Math.max(0, stops.length - 1) * segH;

  const lines: string[] = [];
  lines.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${totalH}" viewBox="0 0 ${w} ${totalH}">`
  );
  lines.push(
    `<style>text{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}</style>`
  );
  lines.push(`<rect width="${w}" height="${totalH}" fill="#fafafa" rx="8"/>`);

  // Title
  lines.push(
    `<text x="${pad}" y="${pad + 20}" font-size="18" font-weight="600" fill="#171717">${esc(title)}</text>`
  );

  let y = pad + titleH;

  stops.forEach((stop, i) => {
    const cy = y + 18;

    // Circle
    lines.push(
      `<circle cx="${pad}" cy="${cy}" r="10" fill="#fff" stroke="#171717" stroke-width="1.5"/>`
    );
    lines.push(
      `<text x="${pad}" y="${cy + 4}" text-anchor="middle" font-size="10" font-weight="600" fill="#171717">${i + 1}</text>`
    );

    // Name
    lines.push(
      `<text x="${pad + 22}" y="${cy - 2}" font-size="13" font-weight="600" fill="#171717">${esc(stop.name)}</text>`
    );

    // Meta
    const parts: string[] = [];
    if (stop.date) parts.push(stop.date);
    if (stop.arrivalTime)
      parts.push(`${stop.arrivalTime}\u2009\u2014\u2009${stop.departureTime || ''}`);
    const total = stopTotal(stop);
    if (total > 0) parts.push(`\u00A5${total.toLocaleString()}`);
    if (parts.length > 0) {
      lines.push(
        `<text x="${pad + 22}" y="${cy + 14}" font-size="10" fill="#737373">${esc(parts.join('  \u00B7  '))}</text>`
      );
    }

    y += nodeH;

    // Segment line
    if (i < stops.length - 1) {
      lines.push(
        `<line x1="${pad}" y1="${cy + 10}" x2="${pad}" y2="${y + 8}" stroke="#e5e5e5" stroke-width="1.5"/>`
      );
      const seg = segments.find((s) => s.fromStopId === stop.id);
      if (seg && (seg.distanceKm > 0 || seg.durationMinutes > 0)) {
        const label = [
          seg.mode === 'walk' ? 'Walk' : 'Car',
          seg.distanceKm > 0 ? `${seg.distanceKm.toFixed(1)} km` : '',
          fmtDuration(seg.durationMinutes),
        ]
          .filter(Boolean)
          .join('  \u00B7  ');
        lines.push(
          `<text x="${pad + 22}" y="${cy + 10 + segH / 2 + 3}" font-size="9" fill="#a3a3a3">${esc(label)}</text>`
        );
      }
      y += segH;
    }
  });

  lines.push('</svg>');
  return lines.join('\n');
}
