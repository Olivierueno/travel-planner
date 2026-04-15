'use client';

import { useState } from 'react';
import type { Stop, Activity, Accommodation } from '@/lib/types';
import { CATEGORY_CONFIG, stopTotal } from '@/lib/types';

interface StopCardProps {
  stop: Stop;
  index: number;
  total: number;
  isSelected: boolean;
  onStopClick: () => void;
  onSave: (stop: Stop) => void;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (direction: 'up' | 'down') => void;
}

function formatDuration(m: number): string {
  if (m <= 0) return '';
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const r = m % 60;
    return r > 0 ? `${h}h ${r}m` : `${h}h`;
  }
  return `${m}m`;
}

function formatDate(d: string): string {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  const mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${mo[dt.getMonth()]} ${dt.getDate()}`;
}

export default function StopCard({
  stop,
  index,
  total,
  isSelected,
  onStopClick,
  onSave,
  onEdit,
  onDelete,
  onMove,
}: StopCardProps) {
  const config = CATEGORY_CONFIG[stop.category] || CATEGORY_CONFIG.other;
  const accoms: Accommodation[] = stop.accommodations || [];
  const acts: Activity[] = stop.activities || [];
  const dur = stop.durationMinutes || 0;
  const cost = stopTotal(stop);

  const [addingAccom, setAddingAccom] = useState(false);
  const [accomName, setAccomName] = useState('');
  const [accomCost, setAccomCost] = useState(0);
  const [addingAct, setAddingAct] = useState(false);
  const [actName, setActName] = useState('');
  const [actCost, setActCost] = useState(0);

  function saveAccom() {
    if (!accomName.trim()) return;
    onSave({
      ...stop,
      accommodations: [...accoms, { id: crypto.randomUUID(), name: accomName.trim(), costJPY: accomCost || 0 }],
    });
    setAccomName(''); setAccomCost(0); setAddingAccom(false);
  }

  function saveAct() {
    if (!actName.trim()) return;
    onSave({
      ...stop,
      activities: [...acts, { id: crypto.randomUUID(), name: actName.trim(), costJPY: actCost || 0 }],
    });
    setActName(''); setActCost(0); setAddingAct(false);
  }

  const meta = [
    config.label,
    stop.date ? formatDate(stop.date) : '',
    stop.arrivalTime ? `${stop.arrivalTime}\u2009\u2014\u2009${stop.departureTime || ''}` : '',
    dur > 0 ? formatDuration(dur) : '',
  ].filter(Boolean).join(' \u00B7 ');

  const inlineInput = 'flex-1 px-2 py-1 bg-neutral-50 border border-neutral-200 rounded text-[12px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 transition-[border-color] duration-150';
  const costInput = 'w-20 px-2 py-1 bg-neutral-50 border border-neutral-200 rounded text-[12px] font-data text-neutral-900 focus:outline-none focus:border-neutral-400 transition-[border-color] duration-150';

  return (
    <div
      className={`bg-white border rounded-[10px] px-3.5 py-3 transition-all duration-150 ${
        isSelected ? 'border-neutral-900' : 'border-neutral-200 hover:border-neutral-300'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 cursor-pointer" onClick={onStopClick}>
        <h3 className="text-[14px] font-semibold text-neutral-900 truncate">{stop.name}</h3>
        <div className="flex items-center gap-0 shrink-0">
          <span className="text-[10px] text-neutral-400 mr-1">#{index}</span>
          {index > 1 && (
            <button onClick={e => { e.stopPropagation(); onMove('up'); }} className="text-neutral-300 hover:text-neutral-900 p-0.5 transition-colors duration-150" title="Move up">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd"/></svg>
            </button>
          )}
          {index < total && (
            <button onClick={e => { e.stopPropagation(); onMove('down'); }} className="text-neutral-300 hover:text-neutral-900 p-0.5 transition-colors duration-150" title="Move down">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
            </button>
          )}
          <button onClick={e => { e.stopPropagation(); onEdit(); }} className="text-neutral-300 hover:text-neutral-900 p-0.5 transition-colors duration-150" title="Edit">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} className="text-neutral-300 hover:text-red-500 p-0.5 transition-colors duration-150" title="Delete">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
          </button>
        </div>
      </div>

      {/* Meta */}
      <p className="text-[11px] text-neutral-500 mt-0.5">{meta}</p>

      {/* Entry cost */}
      {stop.costJPY > 0 && (
        <p className="text-[11px] font-data text-neutral-600 mt-0.5">Entry ¥{stop.costJPY.toLocaleString()}</p>
      )}

      {/* Stays */}
      {(accoms.length > 0 || addingAccom) && (
        <div className="mt-2">
          <p className="text-[9px] uppercase tracking-[1.2px] text-neutral-400 mb-1">Stays</p>
          {accoms.map(a => (
            <div key={a.id} className="flex items-center justify-between py-px">
              <span className="text-[12px] text-neutral-800 truncate">{a.name}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] font-data text-neutral-500">¥{a.costJPY.toLocaleString()}</span>
                <button onClick={e => { e.stopPropagation(); onSave({ ...stop, accommodations: accoms.filter(x => x.id !== a.id) }); }} className="text-neutral-300 hover:text-red-500 text-[13px] leading-none transition-colors duration-150">&times;</button>
              </div>
            </div>
          ))}
          {addingAccom ? (
            <div className="flex items-center gap-1 mt-1">
              <input type="text" value={accomName} onChange={e => setAccomName(e.target.value)} placeholder="Name" className={inlineInput} autoFocus onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); saveAccom(); } }} />
              <span className="text-[11px] text-neutral-400">¥</span>
              <input type="number" value={accomCost} onChange={e => setAccomCost(parseInt(e.target.value) || 0)} min={0} className={costInput} />
              <button onClick={e => { e.stopPropagation(); saveAccom(); }} className="text-neutral-500 hover:text-neutral-900 text-[13px] px-0.5 transition-colors duration-150">&#10003;</button>
              <button onClick={e => { e.stopPropagation(); setAddingAccom(false); setAccomName(''); setAccomCost(0); }} className="text-neutral-400 hover:text-neutral-600 text-[13px] px-0.5 transition-colors duration-150">&times;</button>
            </div>
          ) : (
            <button onClick={e => { e.stopPropagation(); setAddingAccom(true); }} className="text-[11px] text-neutral-400 hover:text-neutral-900 mt-0.5 transition-colors duration-150">+ Add</button>
          )}
        </div>
      )}
      {accoms.length === 0 && !addingAccom && (
        <button onClick={e => { e.stopPropagation(); setAddingAccom(true); }} className="text-[10px] text-neutral-400 hover:text-neutral-900 mt-1.5 block transition-colors duration-150">+ Stay</button>
      )}

      {/* Activities */}
      {(acts.length > 0 || addingAct) && (
        <div className="mt-2">
          <p className="text-[9px] uppercase tracking-[1.2px] text-neutral-400 mb-1">Activities</p>
          {acts.map(a => (
            <div key={a.id} className="flex items-center justify-between py-px">
              <span className="text-[12px] text-neutral-800 truncate">{a.name}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] font-data text-neutral-500">¥{a.costJPY.toLocaleString()}</span>
                <button onClick={e => { e.stopPropagation(); onSave({ ...stop, activities: acts.filter(x => x.id !== a.id) }); }} className="text-neutral-300 hover:text-red-500 text-[13px] leading-none transition-colors duration-150">&times;</button>
              </div>
            </div>
          ))}
          {addingAct ? (
            <div className="flex items-center gap-1 mt-1">
              <input type="text" value={actName} onChange={e => setActName(e.target.value)} placeholder="Name" className={inlineInput} autoFocus onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); saveAct(); } }} />
              <span className="text-[11px] text-neutral-400">¥</span>
              <input type="number" value={actCost} onChange={e => setActCost(parseInt(e.target.value) || 0)} min={0} className={costInput} />
              <button onClick={e => { e.stopPropagation(); saveAct(); }} className="text-neutral-500 hover:text-neutral-900 text-[13px] px-0.5 transition-colors duration-150">&#10003;</button>
              <button onClick={e => { e.stopPropagation(); setAddingAct(false); setActName(''); setActCost(0); }} className="text-neutral-400 hover:text-neutral-600 text-[13px] px-0.5 transition-colors duration-150">&times;</button>
            </div>
          ) : (
            <button onClick={e => { e.stopPropagation(); setAddingAct(true); }} className="text-[11px] text-neutral-400 hover:text-neutral-900 mt-0.5 transition-colors duration-150">+ Add</button>
          )}
        </div>
      )}
      {acts.length === 0 && !addingAct && (
        <button onClick={e => { e.stopPropagation(); setAddingAct(true); }} className="text-[10px] text-neutral-400 hover:text-neutral-900 mt-0.5 block transition-colors duration-150">+ Activity</button>
      )}

      {/* Notes */}
      {stop.notes && <p className="text-[11px] text-neutral-500 mt-2 line-clamp-2">{stop.notes}</p>}

      {/* Total */}
      {cost > 0 && (
        <div className="border-t border-neutral-100 pt-1.5 mt-2 flex justify-end">
          <span className="text-[11px] font-data font-medium text-neutral-900">Total ¥{cost.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}
