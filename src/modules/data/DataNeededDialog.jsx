import { useEffect, useState } from 'react';
import { ClipboardList, ArrowRight, X } from 'lucide-react';
import { fetchDatasets } from '../../services/datasetsApi';
import { DATASET_DEFINITIONS, scopeKeys, datasetsForScope, scopedDatasets } from './datasetDefinitions';

/**
 * "Data needed" — opens after sign-in when datasets this portal depends on
 * are missing or due. "Remind me later" snoozes it for this session only, so
 * it asks again at the next sign-in until the data is in.
 * Spec: docs/services/00-shared-principles.md, section 3 (reminders).
 */
const SNOOZE_KEY = 'fi_data_needed_snoozed';

const DUE_TEXT = { missing: 'Not provided yet', due: 'Update due' };

const DataNeededDialog = ({ cropType, serviceId, onFill }) => {
  const [items, setItems] = useState([]);
  const [preview, setPreview] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SNOOZE_KEY)) return;
    let active = true;
    const keys = scopeKeys({ cropType, serviceId });
    // Everything this portal needs that is missing or due, from our
    // definitions merged with the backend's status for each.
    fetchDatasets()
      .then(list => {
        const scoped = scopedDatasets(list, keys).filter(d => d.status === 'missing' || d.status === 'due');
        if (active && scoped.length) { setItems(scoped); setOpen(true); }
      })
      .catch(() => {
        // Backend unreachable: still ask for what this portal needs; the
        // Your data page says when saving is not connected.
        if (!active) return;
        const scoped = datasetsForScope(DATASET_DEFINITIONS, keys).map(d => ({ ...d, status: 'missing' }));
        if (scoped.length) { setItems(scoped); setPreview(true); setOpen(true); }
      });
    return () => { active = false; };
  }, [cropType, serviceId]);

  // Closing (X, Escape, clicking outside) is the same as "Remind me later":
  // the user carries on working and is asked again at the next sign-in.
  const later = () => { sessionStorage.setItem(SNOOZE_KEY, '1'); setOpen(false); };
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') later(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;
  const fill = (id) => { setOpen(false); sessionStorage.setItem(SNOOZE_KEY, '1'); onFill?.(id); };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/30 p-4" role="dialog" aria-modal="true" aria-labelledby="data-needed-title" onClick={later}>
      <div className="w-full max-w-xl bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-7 pt-7 pb-5 relative">
          <button onClick={later} aria-label="Close and remind me later" className="absolute right-5 top-5 p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"><X size={18} /></button>
          <div className="w-11 h-11 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-green-700"><ClipboardList size={20} /></div>
          <h2 id="data-needed-title" className="text-xl font-bold text-gray-900 tracking-tight mt-4">A few facts will make your dashboard fit your farms</h2>
          <p className="text-sm text-gray-600 mt-1.5">Add them now, or close this and carry on; we will remind you next time. You can also add them any time from Settings → Your data.</p>
          {preview && <p className="text-xs text-sky-800 mt-2">Saving is not connected right now; you can still prepare the files.</p>}
        </div>
        <ul className="divide-y divide-gray-100 border-y border-gray-100 max-h-[45vh] overflow-y-auto">
          {items.map(d => (
            <li key={d.id} className="px-7 py-4 flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-gray-900">{d.name}</div>
                <div className="text-xs text-gray-600 mt-0.5">{d.why}</div>
                <div className="text-[11px] font-semibold text-slate-600 mt-1">{DUE_TEXT[d.status] || 'Needed'}</div>
              </div>
              <button onClick={() => fill(d.id)} className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold text-green-700 border border-green-200 hover:bg-green-50">
                Fill now <ArrowRight size={14} />
              </button>
            </li>
          ))}
        </ul>
        <div className="px-7 py-4 flex justify-end bg-gray-50/60">
          <button onClick={later} className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100">Remind me later</button>
        </div>
      </div>
    </div>
  );
};

export default DataNeededDialog;
