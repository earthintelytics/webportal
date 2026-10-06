import { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  X,
  Database,
  CheckCircle2,
  Sliders,
  Plus,
  Send
} from 'lucide-react';
import { SCENARIOS } from './scenarioTemplates';
import { scopeKeys } from '../data/datasetDefinitions';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function fill(template, values) {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(values[k] ?? ''));
}

const ScenarioBuilder = ({ cropType, serviceId, estates = [], onRun }) => {
  const keys = scopeKeys({ cropType, serviceId });
  // Always include service:advisor if in advisor service
  if (serviceId === 'advisor' && !keys.includes('service:advisor')) {
    keys.unshift('service:advisor');
  }
  const scenarios = keys.flatMap(k => SCENARIOS[k] || []);

  const [active, setActive] = useState(null);
  const [values, setValues] = useState({});
  const [customDataNotes, setCustomDataNotes] = useState('');
  const [customFieldParams, setCustomFieldParams] = useState([
    { key: 'Observed Soil Moisture', value: '' },
    { key: 'Current Growth Stage', value: '' }
  ]);

  // Custom scenario creation state
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customScenarioTitle, setCustomScenarioTitle] = useState('');
  const [customScenarioDesc, setCustomScenarioDesc] = useState('');
  const [customScenarioEstate, setCustomScenarioEstate] = useState(estates[0] || 'All Estates');
  const [customScenarioDataReqs, setCustomScenarioDataReqs] = useState('');

  const estateLabel = estates.length ? null : 'All Estates';

  const open = (s) => {
    const v = {};
    for (const p of s.params) {
      if (p.type === 'month') v[p.name] = MONTHS[new Date().getMonth()];
      else if (p.type === 'estate') v[p.name] = estates[0] ? estates[0] : 'All Estates';
      else v[p.name] = p.default ?? '';
    }
    setValues(v);
    setCustomDataNotes('');
    setActive(s);
    setIsCustomMode(false);
  };

  const handleRunStandard = () => {
    let baseQuestion = fill(active.question, values);
    
    // Append custom data user added
    const customDetails = [];
    if (customDataNotes.trim()) {
      customDetails.push(`Field observations & custom notes: ${customDataNotes.trim()}`);
    }
    customFieldParams.forEach(p => {
      if (p.key.trim() && p.value.trim()) {
        customDetails.push(`${p.key.trim()}: ${p.value.trim()}`);
      }
    });

    if (customDetails.length > 0) {
      baseQuestion += `\n\n[User Ingested Farm Data & Context]:\n` + customDetails.map(d => `- ${d}`).join('\n');
    }

    onRun(baseQuestion, { 
      scenario: active.id, 
      params: values, 
      customData: customDetails,
      requiredData: active.requiredData || []
    });
  };

  const handleRunCustom = (e) => {
    e.preventDefault();
    if (!customScenarioTitle.trim() && !customScenarioDesc.trim()) return;

    let fullPrompt = `What if scenario: ${customScenarioTitle}\n${customScenarioDesc}\nEstate/Target: ${customScenarioEstate}`;
    
    const customDetails = [];
    if (customScenarioDataReqs.trim()) {
      customDetails.push(`Data inputs: ${customScenarioDataReqs.trim()}`);
    }
    if (customDataNotes.trim()) {
      customDetails.push(`Field observations: ${customDataNotes.trim()}`);
    }
    customFieldParams.forEach(p => {
      if (p.key.trim() && p.value.trim()) {
        customDetails.push(`${p.key.trim()}: ${p.value.trim()}`);
      }
    });

    if (customDetails.length > 0) {
      fullPrompt += `\n\n[Ingested Farm Context]:\n` + customDetails.map(d => `- ${d}`).join('\n');
    }

    onRun(fullPrompt, {
      scenario: 'custom-user-scenario',
      title: customScenarioTitle,
      estate: customScenarioEstate,
      customData: customDetails
    });
  };

  const input = (p) => {
    const cls = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white text-slate-900 focus:border-emerald-700 focus:outline-none shadow-xs';
    const set = (val) => setValues(v => ({ ...v, [p.name]: val }));
    
    if (p.type === 'month') {
      return (
        <select className={cls} value={values[p.name]} onChange={e => set(e.target.value)}>
          {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      );
    }
    if (p.type === 'estate') {
      return (
        <select className={cls} value={values[p.name]} onChange={e => set(e.target.value)}>
          {estateLabel ? (
            <option value="All Estates">{estateLabel}</option>
          ) : (
            <>
              <option value="All Estates">All estates</option>
              {estates.map(e => <option key={e} value={e}>{e}</option>)}
            </>
          )}
        </select>
      );
    }
    if (p.type === 'choice') {
      return (
        <select className={cls} value={values[p.name]} onChange={e => set(e.target.value)}>
          {p.choices.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      );
    }
    const numeric = ['percent', 'number', 'weeks'].includes(p.type);
    return (
      <input 
        className={cls} 
        type={numeric ? 'number' : 'text'} 
        min={numeric ? 0 : undefined} 
        max={p.type === 'percent' ? 100 : undefined} 
        value={values[p.name]} 
        onChange={e => set(e.target.value)} 
      />
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 text-left py-4">
      {/* Advisor Hero Introduction */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Agronomic AI scenario modeller</span>
        </div>
        <h3 className="text-3xl lg:text-4xl font-display font-bold text-slate-900 tracking-tight">
          Farm AI advisor
        </h3>
        <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Select a recommended what-if simulation below or define your own custom scenario. You can ingest your own ground measurements, telemetry, and field parameters to model crop responses with confidence.
        </p>
      </div>

      {/* ── STANDARD SCENARIO CARDS GRID ── */}
      {!active && !isCustomMode && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-bold text-slate-900">Recommended agronomic scenarios</h4>
              <p className="text-xs text-slate-500">Simulations tailored to your licensed crops and estate telemetry</p>
            </div>
            <button
              onClick={() => setIsCustomMode(true)}
              className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus size={14} className="text-emerald-700" />
              <span>Define custom scenario</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scenarios.map(s => (
              <div
                key={s.id}
                onClick={() => open(s)}
                className="p-6 bg-white border border-slate-200 hover:border-emerald-700/60 rounded-3xl cursor-pointer transition-colors shadow-xs flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800">
                      <Sparkles size={16} />
                    </div>
                    <h5 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                      {s.title}
                    </h5>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-4">
                    {s.desc}
                  </p>
                </div>

                {/* Data Requirements Chips */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                    <Database size={13} className="text-emerald-700" />
                    <span>Data Needed & Recommended:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(s.requiredData || ['Sentinel Telemetry', 'Weather Forecast']).map((req, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[10px] font-medium text-slate-600">
                        {req}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center justify-end text-xs font-bold text-emerald-700">
                    <span className="flex items-center gap-1">
                      Configure & run
                      <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ACTIVE SCENARIO MODELLER WITH CUSTOM DATA INGESTION ── */}
      {active && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 space-y-6 shadow-sm">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-bold">
                <Sparkles size={12} />
                <span>Simulation hypothesis</span>
              </div>
              <h4 className="text-xl font-bold text-slate-900 mt-1.5">{active.title}</h4>
              <p className="text-xs text-slate-500 mt-0.5">{active.desc}</p>
            </div>
            <button 
              onClick={() => setActive(null)} 
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Back to scenarios"
            >
              <X size={18} />
            </button>
          </div>

          {/* 1. Required Data & Prerequisites Alert */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
              <Database size={15} className="text-emerald-700" />
              <span>Data Recommended for High-Confidence Modelling</span>
            </div>
            <p className="text-xs text-emerald-800/90 leading-relaxed">
              Our AI engine automatically fuses your Sentinel satellite vegetative indices and live weather forecasts. For best precision, you can also inject custom soil samples or observations below:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {(active.requiredData || []).map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-xs font-semibold text-emerald-900 shadow-2xs">
                  <CheckCircle2 size={13} className="text-emerald-700" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Simulation Parameters */}
          <div className="space-y-4">
            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Scenario model parameters</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {active.params.map(p => (
                <label key={p.name} className="space-y-1.5 block">
                  <span className="text-xs font-semibold text-slate-700">{p.label}</span>
                  {input(p)}
                </label>
              ))}
            </div>
          </div>

          {/* 3. Ingest Custom Farm Data & Observations */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders size={16} className="text-slate-700" />
                <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Inject Your Custom Field Data & Ground Observations (Optional)
                </h5>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Improves recommendation accuracy</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {customFieldParams.map((param, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Parameter name"
                    value={param.key}
                    onChange={e => {
                      const copy = [...customFieldParams];
                      copy[idx].key = e.target.value;
                      setCustomFieldParams(copy);
                    }}
                    className="w-1/2 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="e.g. 18.5%, Stage V3, pH 6.1"
                    value={param.value}
                    onChange={e => {
                      const copy = [...customFieldParams];
                      copy[idx].value = e.target.value;
                      setCustomFieldParams(copy);
                    }}
                    className="w-1/2 px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Specific field observations & notes
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Block 4B showing early chlorosis along boundary drainage; fertilizer round applied on 12th; soil compacted in southern rows."
                value={customDataNotes}
                onChange={e => setCustomDataNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:border-emerald-700 focus:outline-none shadow-2xs resize-none"
              />
            </div>
          </div>

          {/* 4. Generated Question Preview */}
          <div className="rounded-2xl bg-white border border-slate-200 p-4 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Simulation hypothesis preview</span>
            <p className="text-sm font-medium text-slate-800 leading-relaxed italic">
              "{fill(active.question, values)}"
            </p>
          </div>

          {/* 5. Run Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setActive(null)}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleRunStandard} 
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-xs"
            >
              <span>Run scenario simulation</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── CUSTOM SCENARIO BUILDER MODAL/PANEL ── */}
      {isCustomMode && (
        <form onSubmit={handleRunCustom} className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 space-y-6 shadow-sm animate-in fade-in">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-bold">
                <Plus size={12} />
                <span>Custom What-If Hypothesis</span>
              </div>
              <h4 className="text-xl font-bold text-slate-900 mt-1.5">Define your custom scenario</h4>
              <p className="text-xs text-slate-500 mt-0.5">Specify any farm question, hypothesis, or planned agronomic intervention</p>
            </div>
            <button 
              type="button"
              onClick={() => setIsCustomMode(false)} 
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Scenario title</label>
              <input
                type="text"
                required
                placeholder="e.g. Swapping to Drought-Tolerant Seedlings"
                value={customScenarioTitle}
                onChange={e => setCustomScenarioTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white text-slate-900 focus:border-emerald-700 focus:outline-none shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Target Estate / Sector</label>
              <select
                value={customScenarioEstate}
                onChange={e => setCustomScenarioEstate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white text-slate-900 focus:border-emerald-700 focus:outline-none shadow-xs"
              >
                <option value="All Estates">All estates</option>
                {estates.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              What-If Hypothesis & Agronomic Question
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. What if we transition 150 ha of low-yielding palms to dwarf variety seedlings in Q2? How does this impact water requirements, canopy cover, and expected payback period over 4 years?"
              value={customScenarioDesc}
              onChange={e => setCustomScenarioDesc(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white text-slate-900 focus:border-emerald-700 focus:outline-none shadow-xs resize-none"
            />
          </div>

          {/* Custom data inputs for custom scenario */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
            <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Inject custom measurements & field notes
            </h5>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data Points & Parameters (e.g. Cost per seedling: $4.50, Historical Yield: 14 t/ha)
              </label>
              <input
                type="text"
                placeholder="e.g. Seedling cost: $4.50/unit, Planting density: 143 palms/ha, Target survival rate: 96%"
                value={customScenarioDataReqs}
                onChange={e => setCustomScenarioDataReqs(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCustomMode(false)}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-xs"
            >
              <span>Run custom simulation</span>
              <Send size={14} />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ScenarioBuilder;
