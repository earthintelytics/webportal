import { useState } from 'react';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { SCENARIOS } from './scenarioTemplates';
import { scopeKeys } from '../data/datasetDefinitions';

/**
 * Assistant landing: what-if scenarios for this crop or service. Pick a case,
 * fill its parameters, run it; the answer comes back like advice (short
 * answer, assumptions, effect ranges, actions, data used, limits).
 */
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function fill(template, values) {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(values[k] ?? ''));
}

const ScenarioBuilder = ({ cropType, serviceId, estates = [], onRun }) => {
  const keys = scopeKeys({ cropType, serviceId });
  const scenarios = keys.flatMap(k => SCENARIOS[k] || []);
  const [active, setActive] = useState(null);
  const [values, setValues] = useState({});

  const estateLabel = estates.length ? null : 'the whole organisation';
  const open = (s) => {
    const v = {};
    for (const p of s.params) {
      if (p.type === 'month') v[p.name] = MONTHS[new Date().getMonth()];
      else if (p.type === 'estate') v[p.name] = estates[0] ? 'all estates' : 'the whole organisation';
      else v[p.name] = p.default ?? '';
    }
    setValues(v); setActive(s);
  };
  const run = () => onRun(fill(active.question, values), { scenario: active.id, params: values });

  const input = (p) => {
    const cls = 'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white';
    const set = (val) => setValues(v => ({ ...v, [p.name]: val }));
    if (p.type === 'month') return <select className={cls} value={values[p.name]} onChange={e => set(e.target.value)}>{MONTHS.map(m => <option key={m}>{m}</option>)}</select>;
    if (p.type === 'estate') return (
      <select className={cls} value={values[p.name]} onChange={e => set(e.target.value)}>
        {estateLabel ? <option>{estateLabel}</option> : <><option value="all estates">All estates</option>{estates.map(e => <option key={e}>{e}</option>)}</>}
      </select>
    );
    if (p.type === 'choice') return <select className={cls} value={values[p.name]} onChange={e => set(e.target.value)}>{p.choices.map(c => <option key={c}>{c}</option>)}</select>;
    const numeric = ['percent', 'number', 'weeks'].includes(p.type);
    return <input className={cls} type={numeric ? 'number' : 'text'} min={numeric ? 0 : undefined} max={p.type === 'percent' ? 100 : undefined} value={values[p.name]} onChange={e => set(e.target.value)} />;
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 text-left">
      <div className="text-center space-y-3">
        <h3 className="text-3xl font-bold text-gray-900 tracking-tight">Your advisor</h3>
        <p className="text-sm text-gray-500 max-w-xl mx-auto leading-relaxed">
          Ask a question, or play out a scenario: pick a case, set the numbers, and get advice built on your own fields, weather and satellite history, with the assumptions and limits spelled out.
        </p>
      </div>

      {!active && scenarios.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scenarios.map(s => (
            <button key={s.id} onClick={() => open(s)} className="p-5 bg-white border border-gray-200 rounded-2xl hover:border-green-600/50 transition-colors text-left group">
              <div className="flex items-center gap-2 mb-2">
                <span className="p-1.5 bg-green-50 text-green-700 rounded-lg"><Sparkles size={15} /></span>
                <span className="text-sm font-bold text-gray-800 group-hover:text-green-700">What if: {s.title.toLowerCase()}</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{s.desc}</p>
            </button>
          ))}
        </div>
      )}

      {active && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-bold text-green-700 uppercase tracking-widest">Scenario</div>
              <div className="text-lg font-bold text-gray-900 mt-1">What if: {active.title.toLowerCase()}</div>
            </div>
            <button onClick={() => setActive(null)} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100" aria-label="Back to scenarios"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {active.params.map(p => (
              <label key={p.name} className="space-y-1.5 block">
                <span className="text-xs font-semibold text-gray-700">{p.label}</span>
                {input(p)}
              </label>
            ))}
          </div>
          <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 text-sm text-gray-700">{fill(active.question, values)}</div>
          <button onClick={run} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700">
            Run scenario <ArrowRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ScenarioBuilder;
