import type { Stop, TransportSegment } from './types';
import { TRANSPORT_CONFIG, stopTotal, stayDuration } from './types';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

function fmtDate(d: string): string {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${days[dt.getDay()]}, ${months[dt.getMonth()]} ${dt.getDate()}`;
}

export function generatePrintHTML(
  stops: Stop[],
  segments: TransportSegment[],
  title: string,
  dateRange: string,
  currencySymbol: string
): string {
  let grandTotal = 0;

  const stopsHTML = stops.map((stop, i) => {
    const total = stopTotal(stop);
    grandTotal += total;
    const accoms = stop.accommodations || [];
    const acts = stop.activities || [];

    const seg = i < stops.length - 1
      ? segments.find(s => s.fromStopId === stop.id)
      : null;

    let html = `
      <div class="stop">
        <div class="stop-header">
          <div class="stop-num">${i + 1}</div>
          <div class="stop-info">
            <div class="stop-name">${esc(stop.name)}</div>
            <div class="stop-meta">
              ${(() => {
                const arrDate = stop.arrivalDate || (stop as any).date || '';
                const depDate = stop.departureDate || '';
                const dur = stayDuration(stop);
                if (!arrDate) return '';
                if (arrDate === depDate || !depDate) {
                  const parts = [fmtDate(arrDate)];
                  if (stop.arrivalTime && stop.departureTime) parts.push(`${stop.arrivalTime} &rarr; ${stop.departureTime}`);
                  if (dur) parts.push(dur);
                  return parts.join(' &middot; ');
                }
                const parts = [`${fmtDate(arrDate)}${stop.arrivalTime ? ', ' + stop.arrivalTime : ''} &rarr; ${fmtDate(depDate)}${stop.departureTime ? ', ' + stop.departureTime : ''}`];
                if (dur) parts.push(dur);
                return parts.join(' &middot; ');
              })()}
            </div>
          </div>
          ${total > 0 ? `<div class="stop-cost">${currencySymbol}${total.toLocaleString()}</div>` : ''}
        </div>`;

    if (accoms.length > 0) {
      html += `<div class="section"><div class="section-label">Stays</div>`;
      accoms.forEach(a => {
        html += `<div class="item"><span>${esc(a.name)}</span><span class="item-cost">${currencySymbol}${a.costJPY.toLocaleString()}</span></div>`;
      });
      html += `</div>`;
    }

    if (acts.length > 0) {
      html += `<div class="section"><div class="section-label">Activities</div>`;
      acts.forEach(a => {
        html += `<div class="item"><span>${esc(a.name)}</span><span class="item-cost">${currencySymbol}${a.costJPY.toLocaleString()}</span></div>`;
      });
      html += `</div>`;
    }

    if (stop.notes) {
      html += `<div class="notes">${esc(stop.notes)}</div>`;
    }

    html += `</div>`;

    if (seg) {
      const mode = TRANSPORT_CONFIG[seg.mode]?.label || 'Car';
      const parts = [mode];
      if (seg.distanceKm > 0) parts.push(`${seg.distanceKm.toFixed(1)} km`);
      if (seg.durationMinutes > 0) parts.push(fmtDuration(seg.durationMinutes));
      html += `<div class="transport">${parts.join(' &middot; ')}</div>`;
    }

    return html;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #171717; background: #fff; padding: 40px; max-width: 700px; margin: 0 auto; }
  h1 { font-size: 22px; font-weight: 600; }
  .subtitle { font-size: 13px; color: #737373; margin-top: 4px; }
  .summary { margin-top: 8px; font-size: 13px; color: #525252; padding-bottom: 20px; border-bottom: 1px solid #e5e5e5; margin-bottom: 24px; }
  .stop { border: 1px solid #e5e5e5; border-radius: 8px; padding: 14px 16px; margin-bottom: 0; }
  .stop-header { display: flex; align-items: flex-start; gap: 12px; }
  .stop-num { width: 24px; height: 24px; border-radius: 50%; border: 1.5px solid #171717; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; flex-shrink: 0; }
  .stop-info { flex: 1; min-width: 0; }
  .stop-name { font-size: 14px; font-weight: 600; }
  .stop-meta { font-size: 11px; color: #737373; margin-top: 2px; }
  .stop-cost { font-size: 12px; font-weight: 500; font-family: "SF Mono", Menlo, monospace; white-space: nowrap; }
  .section { margin-top: 10px; padding-left: 36px; }
  .section-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1.2px; color: #a3a3a3; margin-bottom: 4px; }
  .item { display: flex; justify-content: space-between; font-size: 12px; padding: 1px 0; }
  .item-cost { font-family: "SF Mono", Menlo, monospace; color: #525252; font-size: 11px; }
  .notes { margin-top: 8px; padding-left: 36px; font-size: 11px; color: #737373; }
  .transport { text-align: center; font-size: 10px; color: #a3a3a3; padding: 8px 0; }
  .grand-total { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e5e5; display: flex; justify-content: space-between; font-size: 14px; font-weight: 600; }
  .grand-total .amount { font-family: "SF Mono", Menlo, monospace; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <h1>${esc(title)}</h1>
  <div class="subtitle">${dateRange} &middot; ${stops.length} stop${stops.length !== 1 ? 's' : ''}</div>
  <div class="summary">Trip itinerary</div>
  ${stopsHTML}
  ${grandTotal > 0 ? `<div class="grand-total"><span>Trip Total</span><span class="amount">${currencySymbol}${grandTotal.toLocaleString()}</span></div>` : ''}
</body>
</html>`;
}
