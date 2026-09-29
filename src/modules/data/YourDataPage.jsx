import React, { useEffect, useMemo, useState } from 'react';
import { Upload, FileSpreadsheet, PencilLine, BookOpen, CheckCircle2, AlertTriangle, Download, ArrowRight, Plus, Trash2, Info } from 'lucide-react';
import { fetchDatasets, validateRows, commitRows, saveMapping, NotConnectedError } from '../../services/datasetsApi';
import { DATASET_DEFINITIONS, scopeKeys, datasetsForScope } from './datasetDefinitions';
import { parseCsv, suggestMapping, applyMapping, checkRows, templateCsv, buildFieldIndex } from './tabular';

/**
 * Settings → Your data. The client answers the open questions its pages need
 * (planting years, harvests, flowering months…) and uploads calibration data:
 * by hand, or as a CSV whose columns it matches to ours. Rows are checked
 * against the blocks registered at onboarding before anything is saved.
 * Spec: docs/services/00-shared-principles.md, section 3.
 */

const STATUS = {
  missing: { label: 'Not provided yet', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  due: { label: 'Update due', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  ok: { label: 'Up to date', cls: 'bg-green-50 text-green-700 border-green-200' },
};
const DUE_TEXT = { once: 'Once, update when it changes', season: 'Every season', monthly: 'Every month' };
const TYPE_TEXT = { field_id: 'Block ID', estate: 'Estate', number: 'Number', year: 'Year (YYYY)', date: 'Date (YYYY-MM-DD)', month: 'Month (YYYY-MM)', choice: 'One of a list', yesno: 'Yes / no', text: 'Text' };

const mappingKey = (id) => `fi_map_${localStorage.getItem('fi_tenant') || 'org'}_${id}`;
const loadMapping = (id) => { try { return JSON.parse(localStorage.getItem(mappingKey(id)) || 'null'); } catch { return null; } };
const storeMapping = (id, m) => { try { localStorage.setItem(mappingKey(id), JSON.stringify(m)); } catch { /* storage unavailable */ } };
const stripFlags = (rows) => rows.map(({ __ok, ...r }) => r); // eslint-disable-line no-unused-vars

function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

const Card = ({ className = '', children }) => (
  <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm ${className}`}>{children}</div>
);

const Pill = ({ status }) => {
  const s = STATUS[status] || STATUS.missing;
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${s.cls}`}>{s.label}</span>;
};

const StepBar = ({ step }) => (
  <div className="flex items-center gap-2 text-sm">
    {['Choose file', 'Match columns', 'Check rows', 'Save'].map((label, i) => (
      <React.Fragment key={label}>
        {i > 0 && <span className="w-6 h-px bg-gray-200" />}
        <span className={`flex items-center gap-2 font-semibold ${i + 1 === step ? 'text-green-700' : i + 1 < step ? 'text-gray-700' : 'text-gray-400'}`}>
          <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs ${i + 1 === step ? 'border-green-600 bg-green-50' : i + 1 < step ? 'border-gray-300 bg-gray-50' : 'border-gray-200'}`}>{i + 1}</span>
          {label}
        </span>
      </React.Fragment>
    ))}
  </div>
);

function CheckResult({ result, total }) {
  if (!result) return null;
  const problems = result.errors.length;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ['Rows', total],
          ['Ready to save', result.validCount],
          ['Rows with problems', total - result.validCount],
          ['Unknown blocks', result.unknownIds.length],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-gray-200 px-4 py-3">
            <div className="text-[11px] font-bold text-gray-600 uppercase tracking-widest">{label}</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
          </div>
        ))}
      </div>
      {result.unknownIds.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <div className="text-sm font-semibold text-amber-900">These blocks are not registered for your organisation</div>
          <p className="text-xs text-amber-900/80 mt-1">Check the spelling, or the estate column if you have several estates. Blocks are registered with your boundary at onboarding.</p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {result.unknownIds.slice(0, 40).map(id => <span key={id} className="text-xs font-mono px-2 py-0.5 rounded bg-white border border-amber-200">{id}</span>)}
            {result.unknownIds.length > 40 && <span className="text-xs text-amber-900">+{result.unknownIds.length - 40} more</span>}
          </div>
        </div>
      )}
      {problems > 0 ? (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-widest text-gray-600">
              <tr><th className="px-4 py-2.5">Row</th><th className="px-4 py-2.5">Column</th><th className="px-4 py-2.5">Problem</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {result.errors.slice(0, 100).map((e, i) => (
                <tr key={i}><td className="px-4 py-2 font-mono text-gray-700">{e.row}</td><td className="px-4 py-2 font-mono text-gray-700">{e.column}</td><td className="px-4 py-2 text-gray-700">{e.message}</td></tr>
              ))}
            </tbody>
          </table>
          {problems > 100 && <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50">Showing the first 100 of {problems} problems.</div>}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm font-semibold text-green-700"><CheckCircle2 size={16} /> Every row passed the checks.</div>
      )}
    </div>
  );
}

function SaveBar({ connected, disabled, saving, saved, error, onSave }) {
  return (
    <div className="flex flex-wrap items-center gap-4 pt-2">
      <button
        onClick={onSave}
        disabled={!connected || disabled || saving}
        className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-500 transition-colors"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
      {!connected && <span className="text-xs text-gray-600">Saving opens when the data service is connected. You can already prepare and check your data here.</span>}
      {saved && <span className="text-sm font-semibold text-green-700 flex items-center gap-1.5"><CheckCircle2 size={15} /> Saved as version {saved.version} ({saved.rows_saved} rows)</span>}
      {error && <span className="text-sm text-red-700">{error}</span>}
    </div>
  );
}

function UploadTab({ dataset, fieldIndex, connected }) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [mapping, setMapping] = useState({});
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState('');

  const onFile = async (f) => {
    setError(''); setResult(null); setSaved(null);
    if (!f) return;
    if (!/\.csv$/i.test(f.name)) { setError('Please upload a CSV file. In Excel: File → Save as → CSV.'); return; }
    const p = parseCsv(await f.text());
    if (!p.headers.length || !p.rows.length) { setError('The file has no header row or no data rows.'); return; }
    setFile(f); setParsed(p);
    const remembered = loadMapping(dataset.id);
    const valid = remembered && Object.values(remembered).every(h => !h || p.headers.includes(h));
    setMapping(valid ? remembered : suggestMapping(dataset.columns, p.headers));
    setStep(2);
  };

  const sample = (header) => parsed?.rows.find(r => r[header])?.[header] ?? '';
  const missingRequired = dataset.columns.filter(c => c.required && !mapping[c.name]);

  const runCheck = () => {
    storeMapping(dataset.id, mapping);
    if (connected) saveMapping(dataset.id, mapping).catch(() => {});
    setResult(checkRows(applyMapping(parsed.rows, mapping), dataset.columns, fieldIndex));
    setStep(3);
  };

  const save = async () => {
    setSaving(true); setError('');
    try {
      const rows = stripFlags(result.rows);
      const server = await validateRows(dataset.id, rows);
      if (!server.ok) { setError(`The server found ${server.errors?.length || 0} problems. Fix them and check again.`); return; }
      setSaved(await commitRows(dataset.id, rows)); setStep(4);
    } catch (e) {
      setError(e instanceof NotConnectedError ? 'The data service is not connected yet.' : e.message);
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <StepBar step={step} />
      {step === 1 && (
        <label className="block rounded-2xl border-2 border-dashed border-gray-300 hover:border-green-500 bg-gray-50/50 p-10 text-center cursor-pointer transition-colors">
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={e => onFile(e.target.files?.[0])} />
          <FileSpreadsheet className="mx-auto text-gray-400" size={36} />
          <div className="text-base font-semibold text-gray-900 mt-3">Choose a CSV file</div>
          <p className="text-sm text-gray-600 mt-1">Any column names: you match them to ours in the next step. From Excel, save as CSV.</p>
          <button type="button" onClick={e => { e.preventDefault(); download(`${dataset.id}-template.csv`, templateCsv(dataset.columns)); }} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-green-700 hover:text-green-800">
            <Download size={15} /> Download our template
          </button>
        </label>
      )}
      {error && step < 3 && <div className="text-sm text-red-700">{error}</div>}

      {step >= 2 && parsed && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700"><span className="font-semibold">{file?.name}</span> · {parsed.rows.length} rows · {parsed.headers.length} columns</div>
            <button onClick={() => { setStep(1); setParsed(null); setResult(null); }} className="text-sm font-semibold text-gray-600 hover:text-gray-900">Choose another file</button>
          </div>
          {step === 2 && (
            <>
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-widest text-gray-600">
                    <tr><th className="px-4 py-2.5 w-[40%]">Our column</th><th className="px-4 py-2.5 w-[30%]">Your column</th><th className="px-4 py-2.5">Example from your file</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {dataset.columns.map(col => (
                      <tr key={col.name}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-gray-900">{col.name}</span>
                            {col.required ? <span className="text-[11px] font-semibold text-amber-800">required</span> : <span className="text-[11px] text-gray-500">optional</span>}
                          </div>
                          <div className="text-xs text-gray-600 mt-0.5">{col.definition}{col.unit ? ` (${col.unit})` : ''}</div>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={mapping[col.name] || ''}
                            onChange={e => setMapping(m => ({ ...m, [col.name]: e.target.value || undefined }))}
                            className={`w-full px-3 py-2 rounded-lg border text-sm bg-white ${col.required && !mapping[col.name] ? 'border-amber-300' : 'border-gray-200'}`}
                          >
                            <option value="">Not in my file</option>
                            {parsed.headers.map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-600 truncate max-w-[220px]">{mapping[col.name] ? sample(mapping[col.name]) || '—' : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={runCheck} disabled={missingRequired.length > 0} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-500 transition-colors">
                  Check rows <ArrowRight size={15} />
                </button>
                {missingRequired.length > 0 && <span className="text-xs text-amber-800">Match the required columns: {missingRequired.map(c => c.name).join(', ')}</span>}
              </div>
            </>
          )}
          {step >= 3 && (
            <>
              <CheckResult result={result} total={parsed.rows.length} />
              <div className="flex items-center gap-4">
                <button onClick={() => setStep(2)} className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50">Back to matching</button>
              </div>
              <SaveBar connected={connected} disabled={!result || result.errors.length > 0} saving={saving} saved={saved} error={error} onSave={save} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ManualTab({ dataset, fieldIndex, blockOptions, connected }) {
  const blank = () => Object.fromEntries(dataset.columns.map(c => [c.name, '']));
  const [rows, setRows] = useState([blank()]);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState('');
  const perField = dataset.columns.some(c => c.type === 'field_id');

  const set = (i, name, value) => { setRows(r => r.map((row, j) => j === i ? { ...row, [name]: value } : row)); setResult(null); };
  const check = () => setResult(checkRows(rows, dataset.columns, fieldIndex));
  const save = async () => {
    setSaving(true); setError('');
    try {
      const rs = stripFlags(result.rows);
      const server = await validateRows(dataset.id, rs);
      if (!server.ok) { setError(`The server found ${server.errors?.length || 0} problems.`); return; }
      setSaved(await commitRows(dataset.id, rs));
    } catch (e) {
      setError(e instanceof NotConnectedError ? 'The data service is not connected yet.' : e.message);
    } finally { setSaving(false); }
  };

  const input = (col, value, onChange) => {
    const base = 'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white';
    if (col.type === 'field_id' && blockOptions.length) {
      return <select className={base} value={value} onChange={e => onChange(e.target.value)}><option value="">Choose block</option>{blockOptions.map(b => <option key={b} value={b}>{b}</option>)}</select>;
    }
    if (col.type === 'choice') return <select className={base} value={value} onChange={e => onChange(e.target.value)}><option value="">Choose</option>{col.choices.map(c => <option key={c}>{c}</option>)}</select>;
    if (col.type === 'yesno') return <select className={base} value={value} onChange={e => onChange(e.target.value)}><option value="">Choose</option><option value="yes">Yes</option><option value="no">No</option></select>;
    const type = { date: 'date', month: 'month', number: 'number', year: 'number' }[col.type] || 'text';
    return <input className={base} type={type} value={value} placeholder={col.example} onChange={e => onChange(e.target.value)} />;
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-600">Enter a few values directly{perField ? ', one row per block' : ''}. For many blocks, upload a file instead.</p>
      <div className="rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-widest text-gray-600">
            <tr>{dataset.columns.map(c => <th key={c.name} className="px-3 py-2.5 whitespace-nowrap">{c.name.replace(/_/g, ' ')}{c.required ? ' *' : ''}</th>)}<th className="w-10" /></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, i) => (
              <tr key={i}>
                {dataset.columns.map(c => <td key={c.name} className="px-3 py-2 min-w-[150px]">{input(c, row[c.name], v => set(i, c.name, v))}</td>)}
                <td className="px-2">{rows.length > 1 && <button onClick={() => setRows(r => r.filter((_, j) => j !== i))} className="p-2 text-gray-400 hover:text-red-600" aria-label="Remove row"><Trash2 size={15} /></button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-3">
        {perField && <button onClick={() => setRows(r => [...r, blank()])} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50"><Plus size={15} /> Add row</button>}
        <button onClick={check} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700">Check <ArrowRight size={15} /></button>
      </div>
      {result && <CheckResult result={result} total={rows.length} />}
      {result && <SaveBar connected={connected} disabled={result.errors.length > 0} saving={saving} saved={saved} error={error} onSave={save} />}
    </div>
  );
}

function ColumnGuide({ dataset }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">What each of our columns means. Your file can use any names; you match them when you upload.</p>
        <button onClick={() => download(`${dataset.id}-template.csv`, templateCsv(dataset.columns))} className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-700 hover:text-green-800"><Download size={15} /> Template</button>
      </div>
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-widest text-gray-600">
            <tr><th className="px-4 py-2.5">Column</th><th className="px-4 py-2.5">Meaning</th><th className="px-4 py-2.5">Format</th><th className="px-4 py-2.5">Example</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {dataset.columns.map(c => (
              <tr key={c.name}>
                <td className="px-4 py-3 align-top"><span className="font-mono text-gray-900">{c.name}</span><div className={`text-[11px] mt-0.5 ${c.required ? 'font-semibold text-amber-800' : 'text-gray-500'}`}>{c.required ? 'required' : 'optional'}</div></td>
                <td className="px-4 py-3 align-top text-gray-700">{c.definition}</td>
                <td className="px-4 py-3 align-top text-gray-700">
                  {TYPE_TEXT[c.type] || c.type}{c.unit ? `, ${c.unit}` : ''}
                  {c.range && <div className="text-xs text-gray-500">{c.range[0]}–{c.range[1]}</div>}
                  {c.choices && <div className="text-xs text-gray-500">{c.choices.join(', ')}</div>}
                </td>
                <td className="px-4 py-3 align-top font-mono text-xs text-gray-700">{c.example}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const YourDataPage = ({ cropType, serviceId, plots, initialDataset }) => {
  const [datasets, setDatasets] = useState(null);
  const [connected, setConnected] = useState(false);
  const [pickedId, setSelectedId] = useState(initialDataset || null);
  const [tab, setTab] = useState('upload');

  useEffect(() => {
    let active = true;
    const keys = scopeKeys({ cropType, serviceId });
    fetchDatasets()
      .then(list => { if (active) { setConnected(true); setDatasets(datasetsForScope(list, keys)); } })
      .catch(() => { if (active) { setConnected(false); setDatasets(datasetsForScope(DATASET_DEFINITIONS, keys).map(d => ({ ...d, status: 'missing' }))); } });
    return () => { active = false; };
  }, [cropType, serviceId]);

  // The layout remounts this page (key) when the sign-in dialog asks for a dataset.
  const selectedId = datasets?.some(d => d.id === pickedId) ? pickedId : datasets?.[0]?.id;

  const fieldIndex = useMemo(() => buildFieldIndex(plots), [plots]);
  const blockOptions = useMemo(() => (plots || []).map(p => p.plot_id || p.name).filter(Boolean).sort(), [plots]);
  const selected = datasets?.find(d => d.id === selectedId);
  const pending = (datasets || []).filter(d => d.status !== 'ok').length;

  return (
    <div className="p-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Your data</h2>
          <p className="text-sm text-gray-500 font-medium mt-2 max-w-2xl">
            Facts only you have, like planting years, harvests and season dates, make your dashboards fit your farms. Enter them by hand or upload a file in your own format.
          </p>
        </div>
        {datasets && (
          <div className="bg-white px-5 py-3 rounded-2xl border border-gray-200 shadow-sm text-sm font-semibold text-gray-700">
            {pending ? `${pending} of ${datasets.length} still needed` : 'Everything is up to date'}
          </div>
        )}
      </div>

      {!connected && datasets && (
        <div className="flex gap-3 rounded-2xl border border-sky-200 bg-sky-50/60 px-5 py-4 text-sm text-sky-900">
          <Info size={18} className="shrink-0 mt-0.5" />
          <div>Saving is being connected by our team. You can already pick a dataset, match your file&rsquo;s columns and check every row against your registered blocks.</div>
        </div>
      )}

      {datasets && datasets.length === 0 && (
        <Card className="p-10 text-center text-sm text-gray-600">This service does not ask for any data from you yet.</Card>
      )}

      {datasets && datasets.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8 items-start">
          <div className="space-y-3">
            {datasets.map(d => (
              <button key={d.id} onClick={() => { setSelectedId(d.id); setTab('upload'); }}
                className={`w-full text-left p-4 rounded-2xl border transition-colors ${d.id === selectedId ? 'bg-white border-green-600 shadow-sm' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-sm font-semibold text-gray-900">{d.name}</span>
                  <Pill status={d.status} />
                </div>
                <p className="text-xs text-gray-600 mt-1.5 line-clamp-2">{d.why}</p>
                <div className="text-[11px] text-gray-500 mt-2">{DUE_TEXT[d.due] || d.due} · {d.grain}</div>
              </button>
            ))}
          </div>

          {selected && (
            <Card className="p-8 space-y-6">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight">{selected.name}</h3>
                  <Pill status={selected.status} />
                </div>
                <p className="text-sm text-gray-600 mt-2 max-w-2xl">{selected.why}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {(selected.unlocks || []).map(u => <span key={u} className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-800 border border-green-100">Unlocks: {u}</span>)}
                </div>
              </div>

              <div className="flex border-b border-gray-200">
                {[['upload', 'Upload a file', <Upload size={15} key="u" />], ['manual', 'Enter by hand', <PencilLine size={15} key="m" />], ['guide', 'Column guide', <BookOpen size={15} key="g" />]].map(([id, label, icon]) => (
                  <button key={id} onClick={() => setTab(id)} className={`-mb-px flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-semibold transition-colors ${tab === id ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
                    {icon}{label}
                  </button>
                ))}
              </div>

              {!fieldIndex && selected.columns.some(c => c.type === 'field_id') && (
                <div className="flex items-center gap-2 text-xs text-amber-800"><AlertTriangle size={14} /> No individual blocks are registered for your organisation yet, so block IDs are checked when you save rather than here.</div>
              )}

              {tab === 'upload' && <UploadTab key={selected.id} dataset={selected} fieldIndex={fieldIndex} connected={connected} />}
              {tab === 'manual' && <ManualTab key={selected.id} dataset={selected} fieldIndex={fieldIndex} blockOptions={blockOptions} connected={connected} />}
              {tab === 'guide' && <ColumnGuide dataset={selected} />}
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default YourDataPage;
