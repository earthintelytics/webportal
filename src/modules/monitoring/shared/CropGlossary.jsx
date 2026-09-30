import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Search, X } from 'lucide-react';
import { TOOLTIP_DESCRIPTIONS } from './dashboard/constants/tooltipDescriptions';

/**
 * Crop glossary (docs/INFORMATION_PRESENTATION.md): where technical terms live.
 * Built per crop from the crop's own indices as served by the backend
 * (labels, notes and legend classes set by the admin), plus a catalogue
 * `glossary` list when the backend provides one. Each entry links the farmer
 * word shown on screen to its technical name. The glossary is a technical
 * place, so radar measures are named here (they are not named on plain screens).
 */
const GENERAL = [
  { key: 'clear-view', plain: 'Clear view', technical: 'Cloud-free satellite image', meaning: 'A date when the satellite could see your farm without cloud. Figures on screen use clear views only.' },
  { key: 'block', plain: 'Block', technical: 'Plot / field polygon', meaning: 'One area of your farm as drawn in the boundary file you registered.' },
  { key: 'estate', plain: 'Estate', technical: 'Farm (site)', meaning: 'One location of your organisation, with its own boundary and blocks.' },
  { key: 'compared-normal', plain: 'Compared with normal', technical: 'Deviation from the multi-year range for the same period', meaning: 'Whether a block is doing better or worse than it usually does at this time of year.' },
  { key: 'estimate', plain: 'Estimate', technical: 'Model output (uncalibrated unless stated)', meaning: 'A figure worked out from satellite signals, not measured on the ground. Shown as a range.' },
];

export default function CropGlossary({ entries, extra, cropName, focusKey }) {
  const [q, setQ] = useState('');
  const items = useMemo(() => {
    const fromIndices = (entries || []).map(e => {
      const tech = TOOLTIP_DESCRIPTIONS[e.key?.toUpperCase?.()] || TOOLTIP_DESCRIPTIONS[e.key] || {};
      return {
        key: e.key,
        plain: e.crop_label || e.label || e.title || e.key,
        technical: `${String(e.key).toUpperCase()}${tech.full ? ` (${tech.full})` : ''}`,
        meaning: e.notes || tech.desc || tech.description || '',
        classes: (e.legend || []).map(l => ({ label: l.label, color: l.color })),
      };
    });
    const fromCatalogue = (extra || []).map(g => ({ key: g.key || g.term, plain: g.plain || g.term, technical: g.technical || '', meaning: g.meaning || g.definition || '', classes: [] }));
    const seen = new Set();
    return [...fromIndices, ...fromCatalogue, ...GENERAL]
      .filter(i => (seen.has(i.key) ? false : seen.add(i.key)));
  }, [entries, extra]);
  const shown = items.filter(i => !q || `${i.plain} ${i.technical} ${i.meaning}`.toLowerCase().includes(q.toLowerCase()));

  useEffect(() => {
    if (!focusKey) return;
    const el = document.getElementById(`glossary-${focusKey}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusKey]);

  return (
    <div className="p-10 space-y-8 overflow-y-auto h-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="w-11 h-11 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-green-700 shrink-0"><BookOpen size={20} /></span>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Glossary{cropName ? `: ${cropName}` : ''}</h2>
            <p className="text-sm text-gray-500 font-medium mt-2 max-w-2xl">The words used on your screens, what they mean, how to read the colours, and the technical name behind each one.</p>
          </div>
        </div>
        <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white max-w-xs w-full">
          <Search size={15} className="text-gray-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search" className="text-sm outline-none w-full" />
        </label>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {shown.map(i => (
          <div key={i.key} id={`glossary-${i.key}`} className={`bg-white rounded-2xl border p-5 space-y-2 ${focusKey === i.key ? 'border-green-600 ring-1 ring-green-600' : 'border-gray-200'}`}>
            <div className="text-base font-semibold text-gray-900">{i.plain}</div>
            {i.meaning && <p className="text-sm text-gray-700">{i.meaning}</p>}
            {i.classes?.length > 0 && (
              <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
                {i.classes.map(c => <span key={c.label} className="inline-flex items-center gap-1.5 text-xs text-gray-600"><span className="w-2.5 h-2.5 rounded-sm border border-gray-200" style={{ background: c.color }} />{c.label}</span>)}
              </div>
            )}
            <div className="text-xs text-gray-500 pt-1">Technical name: {i.technical || '—'}</div>
          </div>
        ))}
        {shown.length === 0 && <div className="text-sm text-gray-500">No terms match your search.</div>}
      </div>
    </div>
  );
}

// Terms a view uses besides index measures (weather, alerts…)
const VIEW_TERMS = {
  climate: [
    { key: 'rain', plain: 'Rain', technical: 'Precipitation (mm)', meaning: 'Rain that fell or is forecast, in millimetres.' },
    { key: 'water-use', plain: 'Water use', technical: 'Crop evapotranspiration, ETc (mm/day)', meaning: 'How much water the crop uses each day; compare with rain to judge irrigation.' },
    { key: 'surface-heat', plain: 'Surface heat', technical: 'Land surface temperature, LST (°C)', meaning: 'How hot the ground and canopy are; high values stress the crop.' },
  ],
  alerts: [
    { key: 'alert', plain: 'Alert', technical: 'Rule triggered on a block', meaning: 'A block where something changed enough to need a look, with the suggested action.' },
    { key: 'scouting', plain: 'Scouting', technical: 'Ground check of an alert', meaning: 'Someone visits the block, records what they found and closes the alert.' },
  ],
};

/**
 * "Glossary for this view": a side panel listing only the terms the current
 * page shows (its map layers / measures, plus view-specific terms).
 */
export function ViewGlossary({ entries, viewKeys, view, onOpenFull }) {
  const [open, setOpen] = useState(false);
  const items = useMemo(() => {
    const keys = new Set(viewKeys || []);
    const fromIndices = (entries || []).filter(e => keys.has(e.key)).map(e => {
      const tech = TOOLTIP_DESCRIPTIONS[e.key?.toUpperCase?.()] || TOOLTIP_DESCRIPTIONS[e.key] || {};
      return { key: e.key, plain: e.crop_label || e.label || e.title || e.key, technical: `${String(e.key).toUpperCase()}${tech.full ? ` (${tech.full})` : ''}`, meaning: e.notes || tech.desc || tech.description || '', classes: (e.legend || []).map(l => ({ label: l.label, color: l.color })) };
    });
    return [...fromIndices, ...(VIEW_TERMS[view] || [])];
  }, [entries, viewKeys, view]);
  if (!items.length) return null;
  return (
    <>
      <button onClick={() => setOpen(true)} className="no-print fixed right-6 bottom-6 z-[900] inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-gray-200 shadow-md text-sm font-semibold text-gray-700 hover:border-green-600">
        <BookOpen size={16} className="text-green-700" />Glossary for this view
      </button>
      {open && (
        <div className="fixed inset-0 z-[1500] flex justify-end bg-slate-900/20" onClick={() => setOpen(false)}>
          <aside onClick={e => e.stopPropagation()} className="w-full max-w-md h-full bg-white border-l border-gray-200 shadow-xl flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div><div className="text-base font-semibold text-gray-900">Glossary for this view</div><div className="text-xs text-gray-500">Only the terms on this page</div></div>
              <button onClick={() => setOpen(false)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100" aria-label="Close"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {items.map(i => (
                <div key={i.key} className="rounded-xl border border-gray-200 p-4 space-y-1.5">
                  <div className="text-sm font-semibold text-gray-900">{i.plain}</div>
                  {i.meaning && <p className="text-sm text-gray-700">{i.meaning}</p>}
                  {i.classes?.length > 0 && <div className="flex flex-wrap gap-x-3 gap-y-1">{i.classes.map(c => <span key={c.label} className="inline-flex items-center gap-1.5 text-xs text-gray-600"><span className="w-2.5 h-2.5 rounded-sm border border-gray-200" style={{ background: c.color }} />{c.label}</span>)}</div>}
                  <div className="text-xs text-gray-500">Technical name: {i.technical || '—'}</div>
                </div>
              ))}
            </div>
            {onOpenFull && <div className="px-6 py-4 border-t border-gray-100"><button onClick={() => { setOpen(false); onOpenFull(); }} className="text-sm font-semibold text-green-700 hover:underline">Open the full glossary</button></div>}
          </aside>
        </div>
      )}
    </>
  );
}
