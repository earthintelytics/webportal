import { useState } from 'react';
import { RotateCcw, Plus, X } from 'lucide-react';
import { saveCropThreshold, resetCropThreshold } from '../../../services/adminApi';
import { useConfirm } from '../../components/ConfirmProvider';
import { inputCls } from '../../components/formHelpers';
import { Card, CardHeader, Button, IconButton, Pill } from '../../components/ui';

const byLow = (list) => [...list].sort((a, b) => Number(a.range?.[0]) - Number(b.range?.[0]));

/**
 * Map classes for one index and crop: the words, colours, value ranges and
 * advice clients see on the map and in the Overview KPIs. Highest class =
 * "good condition", lowest = "needs attention" in the KPI cards.
 */
const LegendEditor = ({ item, cropType, companyId, onSaved, onError }) => {
  const confirm = useConfirm();
  const [classes, setClasses] = useState(item.classes || []);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const update = (i, patch) => { setClasses((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c))); setDirty(true); };
  const bound = (i, which, v) => update(i, { range: which === 'lo' ? [v, classes[i].range[1]] : [classes[i].range[0], v] });

  const problems = (() => {
    const clean = classes.map((c) => [Number(c.range?.[0]), Number(c.range?.[1])]);
    if (clean.some(([a, b]) => Number.isNaN(a) || Number.isNaN(b))) return 'Every class needs a number for from and to.';
    const bad = classes.find((c, i) => clean[i][0] > clean[i][1]);
    if (bad) return `"${bad.label}" starts above where it ends.`;
    if (classes.some((c) => !String(c.label || '').trim())) return 'Every class needs words for clients.';
    const sorted = byLow(classes.map((c, i) => ({ ...c, r: clean[i] })));
    for (let i = 1; i < sorted.length; i++) if (sorted[i].r[0] < sorted[i - 1].r[1]) return `"${sorted[i - 1].label}" and "${sorted[i].label}" overlap.`;
    return null;
  })();

  const save = async () => {
    setBusy(true);
    try {
      await saveCropThreshold({ crop_type: cropType, index_key: item.index_key, company_id: companyId, classes: classes.map((c) => ({ label: c.label.trim(), color: c.color, advice: c.advice || '', range: [Number(c.range[0]), Number(c.range[1])] })) });
      setDirty(false); setSaved(true); setTimeout(() => setSaved(false), 2000); onSaved();
    } catch (e) { onError(e.message); } finally { setBusy(false); }
  };
  const reset = async () => {
    if (!(await confirm(`Put ${item.label} back to the platform default for this crop?`))) return;
    setBusy(true);
    try { await resetCropThreshold(cropType, item.index_key, companyId); onSaved(); } catch (e) { onError(e.message); } finally { setBusy(false); }
  };

  return (
    <Card>
      <CardHeader
        title={item.label}
        text={[item.crop_label, item.full].filter(Boolean).join(' · ')}
        actions={<>
          <Pill tone={item.calibrated ? 'good' : 'neutral'}>{item.calibrated ? 'Set for this scope' : 'Platform default'}</Pill>
          {item.calibrated && <Button variant="secondary" className="!py-2" onClick={reset} disabled={busy}><RotateCcw size={14} />Reset</Button>}
          <Button className="!py-2" onClick={save} disabled={busy || !dirty || !!problems}>{saved ? 'Saved' : busy ? 'Saving…' : 'Save'}</Button>
        </>}
      />
      <div className="px-6 py-5 space-y-5">
        {classes.length > 0 && (
          <div>
            <div className="flex h-3 rounded-full overflow-hidden border border-gray-200">
              {byLow(classes).map((c, i) => <span key={i} title={`${c.label}: ${c.range?.[0]} to ${c.range?.[1]}`} style={{ background: c.color, flex: Math.max(0.05, Math.abs(Number(c.range?.[1]) - Number(c.range?.[0])) || 0.05) }} />)}
            </div>
            <p className="text-xs text-gray-500 mt-2">How the map looks, lowest value on the left.</p>
          </div>
        )}
        {item.notes && <p className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">{item.notes}</p>}
        {item.formula && <p className="text-xs font-mono text-gray-500">{item.formula}</p>}

        <div className="space-y-3">
          <div className="hidden md:grid grid-cols-[28px_1fr_96px_96px_1.4fr_32px] gap-3 text-xs font-semibold text-gray-600">
            <span /><span>Words clients see</span><span>From</span><span>To</span><span>What to do (optional)</span><span />
          </div>
          {classes.map((c, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-[28px_1fr_96px_96px_1.4fr_32px] gap-3 items-center">
              <input type="color" value={c.color} onChange={(e) => update(i, { color: e.target.value })} aria-label="Class colour" className="w-7 h-7 rounded-md border border-gray-300 cursor-pointer bg-white p-0.5" />
              <input className={inputCls} value={c.label} onChange={(e) => update(i, { label: e.target.value })} placeholder="e.g. Healthy" />
              <input className={`${inputCls} font-mono`} type="number" step="any" value={c.range?.[0] ?? ''} onChange={(e) => bound(i, 'lo', e.target.value)} aria-label="From" />
              <input className={`${inputCls} font-mono`} type="number" step="any" value={c.range?.[1] ?? ''} onChange={(e) => bound(i, 'hi', e.target.value)} aria-label="To" />
              <input className={inputCls} value={c.advice || ''} onChange={(e) => update(i, { advice: e.target.value })} placeholder="e.g. Walk the block this week" />
              <IconButton label="Remove class" danger disabled={classes.length <= 2} onClick={() => { setClasses((p) => p.filter((_, j) => j !== i)); setDirty(true); }}><X size={15} /></IconButton>
            </div>
          ))}
          <button type="button" onClick={() => { setClasses((p) => [...p, { label: '', color: '#9ca3af', range: [0, 0], advice: '' }]); setDirty(true); }} className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700"><Plus size={15} />Add a class</button>
        </div>
        {problems && dirty && <p className="text-sm text-amber-800">{problems}</p>}
      </div>
    </Card>
  );
};

export default LegendEditor;
