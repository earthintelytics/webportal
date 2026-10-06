import { useEffect, useState } from 'react';
import { ArrowRight, Database, Plus, Sparkles, X } from 'lucide-react';
import { SCENARIOS } from './scenarioTemplates';
import { scopeKeys } from '../data/datasetDefinitions';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const ALL = 'all estates';
const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm bg-white text-gray-900 focus:border-green-700 focus:outline-none';
const btnPrimary = 'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-700 hover:bg-green-800 disabled:opacity-50';
const btnSecondary = 'px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50';

const fill = (template, values) => template.replace(/\{(\w+)\}/g, (_, k) => String(values[k] ?? ''));

const Panel = ({ eyebrow, title, text, onClose, children }) => (
  <div className="bg-white border border-gray-200 rounded-2xl p-6 lg:p-8 space-y-6">
    <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100">
      <div>
        <p className="text-xs font-semibold text-green-800">{eyebrow}</p>
        <h3 className="font-display text-xl font-semibold text-gray-900 mt-1">{title}</h3>
        {text && <p className="text-sm text-gray-500 mt-1">{text}</p>}
      </div>
      <button type="button" onClick={onClose} aria-label="Back to the what-ifs" className="p-2 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100"><X size={18} /></button>
    </div>
    {children}
  </div>
);

const FieldNotes = ({ value, onChange, placeholder }) => (
  <label className="block">
    <span className="block text-sm font-semibold text-gray-800">What you saw in the field <span className="font-normal text-gray-500">(optional)</span></span>
    <span className="block text-xs text-gray-500 mt-0.5">Soil tests, growth stage, pests, work done. It makes the answer fit your farm better.</span>
    <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${inputCls} mt-2 resize-none`} />
  </label>
);

/**
 * The Assistant's start page: what-ifs chosen for this crop or service, each
 * with a few values to fill in, or a question of the person's own. The filled
 * question goes to the chat (onRun) with the data it relies on. onFormOpen
 * tells the page when a form is open, so it can hide its chat box.
 */
const ScenarioBuilder = ({ cropType, serviceId, estates = [], onRun, onFormOpen }) => {
  const keys = scopeKeys({ cropType, serviceId });
  if (serviceId === 'advisor' && !keys.includes('service:advisor')) keys.unshift('service:advisor');
  const scenarios = keys.flatMap((k) => SCENARIOS[k] || []);

  const [active, setActive] = useState(null);
  const [values, setValues] = useState({});
  const [notes, setNotes] = useState('');
  const [custom, setCustom] = useState(null); // null | { title, question, estate }
  const formOpen = !!(active || custom);
  useEffect(() => { onFormOpen?.(formOpen); }, [formOpen, onFormOpen]);

  const withNotes = (q) => (notes.trim() ? `${q}\n\nWhat we saw in the field: ${notes.trim()}` : q);

  const open = (s) => {
    const v = {};
    for (const p of s.params) {
      if (p.type === 'month') v[p.name] = MONTHS[new Date().getMonth()];
      else if (p.type === 'estate') v[p.name] = estates[0] || ALL;
      else v[p.name] = p.default ?? '';
    }
    setValues(v); setNotes(''); setActive(s); setCustom(null);
  };

  const runScenario = () => onRun(withNotes(fill(active.question, values)), {
    scenario: active.id, params: values, customData: notes.trim() ? [notes.trim()] : [], requiredData: active.requiredData || [],
  });

  const runCustom = (e) => {
    e.preventDefault();
    if (!custom.question.trim()) return;
    const where = custom.estate === ALL ? '' : ` (for ${custom.estate})`;
    onRun(withNotes(`${custom.question.trim()}${where}`), {
      scenario: 'custom-user-scenario', title: custom.title, estate: custom.estate, customData: notes.trim() ? [notes.trim()] : [],
    });
  };

  const estateSelect = (value, onChange) => (
    <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value={ALL}>All estates</option>
      {estates.map((e) => <option key={e} value={e}>{e}</option>)}
    </select>
  );

  const input = (p) => {
    const set = (val) => setValues((v) => ({ ...v, [p.name]: val }));
    if (p.type === 'month') return <select className={inputCls} value={values[p.name]} onChange={(e) => set(e.target.value)}>{MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}</select>;
    if (p.type === 'estate') return estateSelect(values[p.name], set);
    if (p.type === 'choice') return <select className={inputCls} value={values[p.name]} onChange={(e) => set(e.target.value)}>{p.choices.map((c) => <option key={c} value={c}>{c}</option>)}</select>;
    const numeric = ['percent', 'number', 'weeks'].includes(p.type);
    return <input className={inputCls} type={numeric ? 'number' : 'text'} min={numeric ? 0 : undefined} max={p.type === 'percent' ? 100 : undefined} value={values[p.name]} onChange={(e) => set(e.target.value)} />;
  };

  if (active) {
    return (
      <Panel eyebrow="What-if" title={active.title} text={active.desc} onClose={() => setActive(null)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {active.params.map((p) => (
            <label key={p.name} className="block space-y-1.5">
              <span className="text-sm font-semibold text-gray-800">{p.label}</span>
              {input(p)}
            </label>
          ))}
        </div>
        {active.requiredData?.length > 0 && (
          <div className="rounded-xl border border-gray-200 p-4 space-y-2">
            <p className="flex items-center gap-2 text-sm font-semibold text-gray-800"><Database size={15} className="text-green-700" />Data that makes this answer better</p>
            <p className="text-xs text-gray-500">The Assistant uses your monitoring results and the weather. Upload these in Farm data if you have them.</p>
            <div className="flex flex-wrap gap-1.5">{active.requiredData.map((d) => <span key={d} className="px-2 py-0.5 rounded-md bg-gray-100 text-xs font-medium text-gray-700">{d}</span>)}</div>
          </div>
        )}
        <FieldNotes value={notes} onChange={setNotes} placeholder="e.g. Block 4B has yellow leaves near the drain; fertiliser went on 12 March." />
        <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500">The question that will be asked</p>
          <p className="text-sm text-gray-800 leading-relaxed mt-1">{fill(active.question, values)}</p>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => setActive(null)} className={btnSecondary}>Cancel</button>
          <button type="button" onClick={runScenario} className={btnPrimary}>Ask the Assistant<ArrowRight size={15} /></button>
        </div>
      </Panel>
    );
  }

  if (custom) {
    return (
      <form onSubmit={runCustom}>
        <Panel eyebrow="Your own what-if" title="Describe your situation" text="Any plan or question about your farm. Say what you would change and what you want to know." onClose={() => setCustom(null)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-gray-800">Short title <span className="font-normal text-gray-500">(optional)</span></span>
              <input className={inputCls} value={custom.title} onChange={(e) => setCustom({ ...custom, title: e.target.value })} placeholder="e.g. Switch to drought-tolerant seedlings" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-gray-800">Estate</span>
              {estateSelect(custom.estate, (estate) => setCustom({ ...custom, estate }))}
            </label>
          </div>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-gray-800">Your question</span>
            <textarea rows={4} required className={`${inputCls} resize-none`} value={custom.question} onChange={(e) => setCustom({ ...custom, question: e.target.value })}
              placeholder="e.g. What if we replant 150 ha of the oldest palms next year? What happens to water use, production and costs over 4 years?" />
          </label>
          <FieldNotes value={notes} onChange={setNotes} placeholder="e.g. Seedlings cost 4.50 dollars each; last harvest was 14 t/ha." />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setCustom(null)} className={btnSecondary}>Cancel</button>
            <button type="submit" className={btnPrimary} disabled={!custom.question.trim()}>Ask the Assistant<ArrowRight size={15} /></button>
          </div>
        </Panel>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-gray-900 tracking-tight">Ask, or try a what-if</h2>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">Type a question below, or pick a what-if. Answers use your monitoring results and the weather.</p>
        </div>
        <button type="button" onClick={() => { setNotes(''); setCustom({ title: '', question: '', estate: estates[0] || ALL }); }} className={`${btnSecondary} inline-flex items-center gap-1.5 shrink-0`}>
          <Plus size={15} className="text-green-700" />Describe your own
        </button>
      </div>
      {scenarios.length === 0 ? (
        <p className="text-sm text-gray-500 border border-dashed border-gray-300 rounded-2xl p-6 text-center">No ready-made what-ifs for this service yet. Describe your own, or type a question below.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scenarios.map((s) => (
            <button key={s.id} type="button" onClick={() => open(s)} className="min-w-0 text-left p-5 bg-white border border-gray-200 hover:border-green-600 rounded-2xl flex flex-col gap-3 group">
              <span className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-700 shrink-0"><Sparkles size={16} /></span>
                <span className="text-sm font-semibold text-gray-900">{s.title}</span>
              </span>
              <span className="text-sm text-gray-600 leading-relaxed">{s.desc}</span>
              <span className="w-full min-w-0 mt-auto pt-3 border-t border-gray-100 flex items-center justify-between gap-3 text-xs">
                <span className="min-w-0 flex-1 text-gray-500 truncate">Uses: {(s.requiredData || []).join(', ') || 'your monitoring results and the weather'}</span>
                <span className="flex items-center gap-1 font-semibold text-green-800 shrink-0">Set up<ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" /></span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScenarioBuilder;
