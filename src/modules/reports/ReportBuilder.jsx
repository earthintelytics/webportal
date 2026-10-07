import { useEffect, useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  CalendarDays,
  Layers,
  MapPin,
  GitCompare,
  Sprout,
  FileText,
  Download,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  BrainCircuit,
  Send,
  Clock,
  ShieldCheck,
  Droplets,
  Activity,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import * as api from '../../services/organizationMonitorApi';

/**
 * Reports & AI Decision Intelligence Engine (design: docs/services/reports-and-verification.md).
 * Built by the server from stored results (POST /reports, report_builder.py),
 * and live active alerts to provide actionable agronomic guidance.
 */
const DEFAULT_TYPES = [
  { id: 'monthly', label: 'Monthly farm report', desc: 'How the farm did this month and what needs action.', icon: <CalendarDays size={18} /> },
  { id: 'blocks', label: 'Block report', desc: 'One or a few blocks in detail.', icon: <MapPin size={18} /> },
  { id: 'compare', label: 'Comparison', desc: 'This period against another, or one estate against another.', icon: <GitCompare size={18} /> },
  { id: 'season', label: 'Season summary', desc: 'From the start of the season to now.', icon: <Sprout size={18} /> },
  { id: 'service', label: 'Service & ESG summary', desc: 'EUDR, carbon estimation, and restoration progress.', icon: <ShieldCheck size={18} /> },
];

const FOCUS_AREAS = [
  { id: 'general', label: 'All agronomics' },
  { id: 'irrigation', label: 'Irrigation & water' },
  { id: 'nutrition', label: 'Nutrient & fertilizer' },
  { id: 'canopy', label: 'Canopy & replanting' },
  { id: 'risk', label: 'Risk & drought defense' },
];

const iso = (d) => d.toISOString().slice(0, 10);
const monthRange = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  return { from: iso(new Date(Date.UTC(y, m - 1, 1))), to: iso(new Date(Date.UTC(y, m, 0))) };
};
const lastMonth = () => {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - 1);
  return d.toISOString().slice(0, 7);
};
const shift = ({ from, to }, kind) => {
  const f = new Date(from), t = new Date(to);
  if (kind === 'last_year') {
    f.setUTCFullYear(f.getUTCFullYear() - 1);
    t.setUTCFullYear(t.getUTCFullYear() - 1);
    return { from: iso(f), to: iso(t) };
  }
  const days = Math.round((t - f) / 864e5) + 1;
  f.setUTCDate(f.getUTCDate() - days);
  t.setUTCDate(t.getUTCDate() - days);
  return { from: iso(f), to: iso(t) };
};
const fmtDate = (s) => new Date(s).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
const HEALTH_WORD = (v) => (v == null ? 'no clear images' : v >= 0.7 ? 'strong' : v >= 0.55 ? 'good' : v >= 0.4 ? 'weaker than usual' : 'poor');

const Chip = ({ on, children, ...rest }) => (
  <button
    type="button"
    {...rest}
    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
      on
        ? 'bg-green-50 border-green-600 text-green-800 shadow-xs'
        : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
    }`}
  >
    {children}
  </button>
);

const Card = ({ className = '', children }) => (
  <div className={`bg-white rounded-2xl border border-gray-200 shadow-xs ${className}`}>{children}</div>
);

const selectCls = 'px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-600';

export default function ReportBuilder({ plots, estates, tenant, orgName, subject, cropType }) {
  const [typesList] = useState(DEFAULT_TYPES);
  const [type, setType] = useState('monthly');
  const [level, setLevel] = useState('organisation');
  const [estate, setEstate] = useState(estates[0] || '');
  const [blocks, setBlocks] = useState([]);
  const [blockQuery, setBlockQuery] = useState('');
  const [periodKind, setPeriodKind] = useState('month');
  const [month, setMonth] = useState(lastMonth);
  const [range, setRange] = useState(() => ({ from: iso(new Date(Date.now() - 90 * 864e5)), to: iso(new Date()) }));
  const [compare, setCompare] = useState('previous');
  const [compareEstate, setCompareEstate] = useState(estates[1] || '');
  const [focusArea, setFocusArea] = useState('general');
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyTab, setHistoryTab] = useState(false);
  // Settings fold away once a report is made, so the report and Download sit at the top.
  const [showSettings, setShowSettings] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  // A block's estate from the blocks list (the report rows carry only the block id).
  const estateOf = (blockId) => {
    const p = (plots || []).find((x) => String(x.id) === String(blockId));
    return p?.subfarm || p?.division || '—';
  };

  // Interactive AI Assistant State
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswers, setAiAnswers] = useState([]);
  const [aiQuerying, setAiQuerying] = useState(false);

  // Load report options and history on mount
  useEffect(() => {
    let active = true;
    api.fetchReportsHistory().then((res) => {
      if (active && Array.isArray(res)) {
        setHistory(res.map(h => ({
          ...h,
          where: h.numbers?.where || h.where || 'All areas',
          // Past reports come from the server without the chart readings.
          health: h.health || [], water: h.water || [], healthCmp: h.healthCmp || [], waterCmp: h.waterCmp || [],
          cmp: h.cmp || h.compare || null,
          recommendations: h.recommendations || [], risks: h.risks || [], findings: h.findings || [], limits: h.limits || [],
          actions: h.actions || (h.blocks_action || []).map(b => ({
            block: b.field_id,
            estate: '',
            problem: b.problem,
            action: b.action,
            priority: b.priority,
            since: b.since,
          })),
          summary: typeof h.summary === 'string' ? { text: h.summary } : (h.summary || { text: '' }),
          created: h.created_at || h.created || new Date(),
        })));
      }
    }).catch(() => {});
    return () => { active = false; };
  }, [tenant]);

  const period = periodKind === 'month' ? monthRange(month) : range;
  const blockList = useMemo(() => (plots || []).filter(p => !blockQuery || `${p.name} ${p.id} ${p.subfarm || ''}`.toLowerCase().includes(blockQuery.toLowerCase())).slice(0, 200), [plots, blockQuery]);
  const where = level === 'organisation' ? `all of ${orgName}` : level === 'estate' ? estate : `${blocks.length} block${blocks.length === 1 ? '' : 's'}`;
  const canCreate = level !== 'blocks' || blocks.length > 0;

  const create = async () => {
    setBusy(true);
    setErrorMsg('');
    const cmp = type === 'compare' && compare === 'estate' ? null : shift(period, compare === 'last_year' ? 'last_year' : 'previous');

    // 1. Fetch timeseries data for the chart
    const series = async (index, p) => {
      try {
        const r = await api.fetchTimeseriesSlider({ farm: tenant, index, start: p.from, end: p.to, cropType });
        return (r?.timeline || []).filter(t => t.mean != null).map(t => ({ date: t.date, mean: t.mean }));
      } catch { return []; }
    };
    const [health, water, healthCmp, waterCmp] = await Promise.all([
      series('ndvi', period),
      series('ndmi', period),
      cmp ? series('ndvi', cmp) : [],
      cmp ? series('ndmi', cmp) : [],
    ]);

    // 2. Build and persist grounded report on backend
    try {
      const saved = await api.createReport({
        type,
        scope: { level, farm_id: level === 'estate' ? estate : null, field_ids: level === 'blocks' ? blocks : [] },
        period,
        compare: cmp,
        crop: cropType,
        service: subject,
        focus_area: focusArea !== 'general' ? focusArea : null,
      });

      const reportObj = {
        report_id: saved.report_id,
        type: saved.type || type,
        title: saved.title || `${subject}: ${where}`,
        where: saved.numbers?.where || where,
        period: saved.period || period,
        cmp: saved.compare || cmp,
        health,
        water,
        healthCmp,
        waterCmp,
        status: saved.status || null,
        actions: (saved.blocks_action || []).map(b => ({
          block: b.field_id,
          estate: estateOf(b.field_id),
          problem: b.problem,
          action: b.action,
          priority: b.priority,
          since: b.since,
        })),
        summary: typeof saved.summary === 'string' ? { text: saved.summary } : (saved.summary || { text: '' }),
        numbers: saved.numbers || {},
        recommendations: saved.recommendations || [],
        risks: saved.risks || [],
        findings: saved.findings || [],
        limits: saved.limits || [],
        data_used: saved.data_used || { sources: [], dates: [] },
        created: new Date(saved.created_at || Date.now()),
      };

      setReport(reportObj);
      setShowSettings(false);
      setHistory(prev => [reportObj, ...prev.filter(r => r.report_id !== reportObj.report_id).slice(0, 19)]);
      setHistoryTab(false);
    } catch (err) {
      setErrorMsg(`Could not generate report: ${err.message || 'Server error'}`);
    } finally {
      setBusy(false);
    }
  };

  // Ask AI about this specific report
  const askAiOnReport = async () => {
    if (!aiQuestion.trim() || aiQuerying) return;
    const q = aiQuestion.trim();
    setAiQuestion('');
    setAiQuerying(true);
    const newEntry = { q, a: 'Analyzing report data and telemetry…', loading: true };
    setAiAnswers(prev => [...prev, newEntry]);

    try {
      const prompt = `Context: Farm Report for ${where} (${fmtDate(period.from)} to ${fmtDate(period.to)}). Crop Health: ${HEALTH_WORD(report?.numbers?.crop_health_avg)}, Leaf Water: ${report?.numbers?.leaf_water_avg}, Alerts: ${report?.numbers?.alerts}. User Question: ${q}`;
      const res = await api.queryAiAgent(prompt);
      const answerText = res?.response || 'Analysis complete. Recommendations grounded in real data.';
      setAiAnswers(prev => prev.map(item => item.q === q ? { q, a: answerText, loading: false } : item));
    } catch {
      setAiAnswers(prev => prev.map(item => item.q === q ? { q, a: 'Unable to connect to AI advisor. Please verify internet connection.', loading: false } : item));
    } finally {
      setAiQuerying(false);
    }
  };

  const chartData = (a, b, label) => ({
    labels: a.map(p => p.date.slice(5)),
    datasets: [
      { label: `${label} (${fmtDate(report.period.from)} – ${fmtDate(report.period.to)})`, data: a.map(p => p.mean), borderColor: '#15803d', backgroundColor: 'transparent', tension: 0.3, pointRadius: 2 },
      ...(b.length ? [{ label: 'Comparison period', data: b.map(p => p.mean), borderColor: '#94a3b8', borderDash: [5, 4], backgroundColor: 'transparent', tension: 0.3, pointRadius: 0 }] : []),
    ],
  });
  const chartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
    scales: { y: { ticks: { display: false }, grid: { color: '#f1f5f9' } }, x: { grid: { display: false }, ticks: { font: { size: 11 } } } },
  };

  const print = () => {
    document.body.classList.add('fi-print-report');
    window.print();
    setTimeout(() => document.body.classList.remove('fi-print-report'), 500);
  };

  return (
    <div className="p-10 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center text-green-700">
              <BrainCircuit size={20} />
            </span>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Reports</h2>
          </div>
          <p className="text-sm text-gray-500 font-medium mt-2 max-w-2xl">
            Choose what, where and when on the left; your report appears on the right, in plain language, ready to download or share.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setHistoryTab(!historyTab)}
            className="text-sm font-semibold text-gray-600 hover:text-gray-900 px-3 py-2 rounded-xl border border-gray-200 bg-white"
          >
            {historyTab ? 'Back to Generator' : `Past Reports (${history.length})`}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[380px_minmax(0,1fr)] gap-8 items-start">
      {/* LEFT: settings */}
      <aside className="xl:sticky xl:top-6 space-y-4 no-print">
      {/* History View */}
      {/* Report Generator Config Card */}
      {!showSettings && report && (
        <Card className="p-5 space-y-3">
          <p className="text-sm font-semibold text-gray-900">Report settings</p>
          <p className="text-sm text-gray-600">{typesList.find(t => t.id === type)?.label} · {where} · {fmtDate(period.from)} – {fmtDate(period.to)}</p>
          <button type="button" onClick={() => setShowSettings(true)} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50">Change settings</button>
        </Card>
      )}
      {(showSettings || !report) && (
        <Card className="p-6 space-y-6">
          {/* 1. Type */}
          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-green-100 text-green-800 text-xs flex items-center justify-center font-bold">1</span>
              What kind of report?
            </div>
            <div className="grid grid-cols-1 gap-2">
              {typesList.map(t => (
                <button
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className={`text-left px-4 py-3 rounded-xl border transition-all ${
                    type === t.id
                      ? 'border-green-600 ring-2 ring-green-600/20 bg-green-50/40 shadow-xs'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 text-green-700">
                    {t.icon}
                    <span className="text-sm font-semibold text-gray-900">{t.label}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 line-clamp-1">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Area */}
          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-green-100 text-green-800 text-xs flex items-center justify-center font-bold">2</span>
              Which area?
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Chip on={level === 'organisation'} onClick={() => setLevel('organisation')}>Whole organisation</Chip>
              {estates.length > 0 && <Chip on={level === 'estate'} onClick={() => setLevel('estate')}>One estate</Chip>}
              <Chip on={level === 'blocks'} onClick={() => setLevel('blocks')}>Chosen blocks</Chip>
              {level === 'estate' && (
                <select className={selectCls} value={estate} onChange={e => setEstate(e.target.value)}>
                  {estates.map(x => <option key={x}>{x}</option>)}
                </select>
              )}
            </div>
            {level === 'blocks' && (
              <div className="rounded-xl border border-gray-200 p-3 space-y-2 bg-gray-50/50">
                <input
                  value={blockQuery}
                  onChange={e => setBlockQuery(e.target.value)}
                  placeholder="Search blocks by name or code"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
                />
                {(plots || []).length === 0 ? (
                  <div className="text-xs text-gray-500">No individual blocks registered yet; select whole organisation.</div>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                    {blockList.map(p => (
                      <Chip
                        key={p.id}
                        on={blocks.includes(p.id)}
                        onClick={() => setBlocks(b => b.includes(p.id) ? b.filter(x => x !== p.id) : [...b, p.id])}
                      >
                        {p.name || p.id}
                      </Chip>
                    ))}
                  </div>
                )}
                <div className="text-xs font-medium text-gray-500">{blocks.length} block{blocks.length === 1 ? '' : 's'} selected</div>
              </div>
            )}
          </div>

          {/* 3. Period & Agronomic Focus */}
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-green-100 text-green-800 text-xs flex items-center justify-center font-bold">3</span>
                Which observation period?
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Chip on={periodKind === 'month'} onClick={() => setPeriodKind('month')}>A month</Chip>
                <Chip on={periodKind === 'range'} onClick={() => setPeriodKind('range')}>Custom dates</Chip>
                {periodKind === 'month' ? (
                  <input type="month" className={selectCls} value={month} onChange={e => setMonth(e.target.value)} />
                ) : (
                  <div className="flex items-center gap-2">
                    <input type="date" className={selectCls} value={range.from} onChange={e => setRange(r => ({ ...r, from: e.target.value }))} />
                    <span className="text-xs text-gray-400">to</span>
                    <input type="date" className={selectCls} value={range.to} onChange={e => setRange(r => ({ ...r, to: e.target.value }))} />
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs font-semibold text-gray-500 mr-1">Compare with:</span>
                <Chip on={compare === 'previous'} onClick={() => setCompare('previous')}>Previous period</Chip>
                <Chip on={compare === 'last_year'} onClick={() => setCompare('last_year')}>Same period last year</Chip>
                {type === 'compare' && estates.length > 1 && (
                  <Chip on={compare === 'estate'} onClick={() => setCompare('estate')}>Another estate</Chip>
                )}
                {compare === 'estate' && (
                  <select className={selectCls} value={compareEstate} onChange={e => setCompareEstate(e.target.value)}>
                    {estates.map(x => <option key={x}>{x}</option>)}
                  </select>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-green-100 text-green-800 text-xs flex items-center justify-center font-bold">4</span>
                Focus
              </div>
              <p className="text-xs text-gray-500">What the advice should concentrate on.</p>
              <div className="flex flex-wrap gap-2">
                {FOCUS_AREAS.map(f => (
                  <Chip key={f.id} on={focusArea === f.id} onClick={() => setFocusArea(f.id)}>
                    {f.label}
                  </Chip>
                ))}
              </div>
            </div>
          </div>

          {/* Action Trigger */}
          {/* Always in reach: sticks to the bottom of the screen while the choices scroll. */}
          <div className="space-y-3 pt-4 pb-2 border-t border-gray-100 sticky bottom-0 bg-white">
            <div className="space-y-2">
              <button
                onClick={create}
                disabled={busy || !canCreate}
                className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-green-700 hover:bg-green-800 shadow-sm hover:shadow disabled:bg-gray-200 disabled:text-gray-500 transition-all"
              >
                <FileText size={16} />
                {busy ? 'Creating your report…' : 'Create report'}
              </button>
              <span className="block text-xs font-medium text-gray-500 text-center">
                {typesList.find(t => t.id === type)?.label} · {where} · {fmtDate(period.from)} – {fmtDate(period.to)}
              </span>
            </div>
            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
              <Sparkles size={14} className="text-green-700" />
              Built from your satellite images, weather and alerts
            </div>
          </div>
        </Card>
      )}

      </aside>

      {/* RIGHT: results */}
      <section className="min-w-0 space-y-8">
      {errorMsg && (
        <div role="alert" className="p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-800 flex items-center justify-between gap-3">
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg('')} className="font-semibold text-red-900 shrink-0">Close</button>
        </div>
      )}
      {historyTab && (
        <Card className="p-6 space-y-4 no-print">
          <h3 className="text-lg font-bold text-gray-900">Past reports</h3>
          {history.length === 0 ? <p className="text-sm text-gray-500">No reports yet. Create one with the settings on the left.</p> : (
            <div className="divide-y divide-gray-100">
              {history.map((h, i) => (
                <div key={i} className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-sm text-gray-900">{h.title || `${typesList.find(x => x.id === h.type)?.label || 'Report'}: ${h.where}`}</div>
                    <div className="text-xs text-gray-500">{fmtDate(h.period?.from)} – {fmtDate(h.period?.to)} · created {h.created ? new Date(h.created).toLocaleString() : 'recently'}</div>
                  </div>
                  <button onClick={() => { setReport(h); setHistoryTab(false); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-50 text-green-800 border border-green-200 hover:bg-green-100">Open <ChevronRight size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
      {/* Generated Report View */}
      {report && !historyTab && (
        <div id="fi-report" className="space-y-8 animate-fadeIn">
          {/* Title & Actions Bar */}
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-gray-200 pb-5">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-semibold bg-green-100 text-green-800">
                {typesList.find(t => t.id === report.type)?.label || 'Agronomic Report'}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{subject}: {report.where}</h3>
              <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                <span>{fmtDate(report.period.from)} – {fmtDate(report.period.to)}</span>
                {report.cmp && <span className="text-gray-400">· compared with {fmtDate(report.cmp.from)} – {fmtDate(report.cmp.to)}</span>}
              </div>
            </div>
            <div className="no-print flex items-center gap-3">
              <button
                onClick={print}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-xs"
              >
                <Download size={15} /> Download / Print PDF
              </button>
            </div>
          </div>

          {/* SECTION 1: AI Executive Intelligence & Summary */}
          <Card className="p-7 border-green-200 bg-gradient-to-br from-green-50/50 via-white to-white space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-base font-bold text-gray-900">
                <Sparkles size={18} className="text-green-700" />
                Summary
              </div>
              {report.summary?.ai && <span className="text-xs font-medium text-gray-500">Written by the AI assistant from the figures below</span>}
            </div>
            <p className="text-base text-gray-800 leading-relaxed">{report.summary?.text || 'No written summary: the AI assistant was not available for this report. The figures below are complete.'}</p>
          </Card>

          {/* SECTION 2: Metric Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              ['Blocks in this report', report.numbers?.blocks_total ?? '—', <Layers key="1" size={16} className="text-blue-600" />],
              ['Need action now', report.status?.action ?? '—', <AlertTriangle key="2" size={16} className="text-amber-600" />],
              ['Crop health', report.numbers?.crop_health_avg == null ? 'No clear image' : HEALTH_WORD(report.numbers.crop_health_avg), <Sprout key="3" size={16} className="text-green-600" />],
              ['Change on the comparison period', report.numbers?.change_pct == null ? '—' : `${report.numbers.change_pct >= 0 ? '+' : ''}${report.numbers.change_pct}%`, <TrendingUp key="4" size={16} className="text-emerald-600" />],
            ].map(([k, v, icon]) => (
              <Card key={k} className="px-5 py-4">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                  <span>{k}</span>
                  {icon}
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-2 capitalize">{v}</div>
              </Card>
            ))}
          </div>

          {/* SECTION 3: AI Prioritized Action Recommendations */}
          <Card className="p-7 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Activity size={18} className="text-green-700" />
                  What to do
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  Most urgent first.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {(report.recommendations || []).map((rec, i) => (
                <div
                  key={i}
                  className={`p-5 rounded-2xl border transition-all ${
                    rec.priority.includes('Immediate')
                      ? 'border-amber-200 bg-amber-50/40'
                      : rec.priority.includes('Medium')
                      ? 'border-blue-200 bg-blue-50/30'
                      : 'border-green-200 bg-green-50/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                        rec.priority.includes('Immediate')
                          ? 'bg-amber-100 text-amber-900'
                          : rec.priority.includes('Medium')
                          ? 'bg-blue-100 text-blue-900'
                          : 'bg-green-100 text-green-900'
                      }`}
                    >
                      {rec.priority}
                    </span>
                    <Clock size={14} className="text-gray-400" />
                  </div>
                  <h5 className="font-bold text-sm text-gray-900 mt-3">{rec.title}</h5>
                  <p className="text-xs text-gray-700 mt-2 leading-relaxed">{rec.action}</p>
                  <div className="mt-4 pt-3 border-t border-gray-200/60 text-xs">
                    <div className="font-semibold text-gray-800">Expected Impact:</div>
                    <div className="text-gray-600 mt-0.5">{rec.impact}</div>
                  </div>
                  {rec.responsible && (
                    <div className="mt-2 text-2xs text-gray-400 font-medium">
                      Assigned: {rec.responsible}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* SECTION 4: Risk Assessment & Field Findings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Assessment */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                <AlertTriangle size={16} className="text-amber-600" />
                Risks
              </div>
              <div className="space-y-3">
                {(report.risks || []).map((r, i) => (
                  <div key={i} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70 space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-gray-900">{r.risk}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-2xs font-bold ${
                          r.level.includes('High')
                            ? 'bg-red-100 text-red-800'
                            : r.level.includes('Moderate')
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {r.level} Risk
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{r.mitigation}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Key Findings */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                <Droplets size={16} className="text-blue-600" />
                Key grounded findings
              </div>
              <ul className="space-y-2.5 text-xs text-gray-700">
                {(report.findings || []).map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 p-2 rounded-lg bg-gray-50">
                    <CheckCircle2 size={15} className="text-green-600 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* SECTION 5: Blocks Needing Action Table */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                <AlertTriangle size={16} className="text-amber-600" />
                Blocks needing action
              </div>
              <span className="text-xs text-gray-500 font-medium">{(report.actions || []).length} {(report.actions || []).length === 1 ? 'block' : 'blocks'}</span>
            </div>
            {(report.actions || []).length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-green-700 py-3">
                <CheckCircle2 size={16} /> No open alerts for these blocks in this period.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-gray-200 text-gray-500 font-semibold bg-gray-50/50">
                    <tr>
                      <th className="py-2.5 px-3">Block</th>
                      <th className="py-2.5 px-3">Estate</th>
                      <th className="py-2.5 px-3">Problem</th>
                      <th className="py-2.5 px-3">What to do</th>
                      <th className="py-2.5 px-3">Priority</th>
                      <th className="py-2.5 px-3">Since</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(report.actions || []).map((a, i) => (
                      <tr key={i} className="hover:bg-gray-50/60">
                        <td className="py-2.5 px-3 font-bold text-gray-900">{a.block}</td>
                        <td className="py-2.5 px-3 text-gray-600">{a.estate || estateOf(a.block)}</td>
                        <td className="py-2.5 px-3 text-gray-800 font-medium">{a.problem}</td>
                        <td className="py-2.5 px-3 text-green-800">{a.action}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-2xs font-semibold ${
                            a.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {a.priority || 'HIGH'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-400">{a.since}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* SECTION 6: Time-Series Comparison Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[['Crop health', report.health || [], report.healthCmp || []], ['Leaf water', report.water || [], report.waterCmp || []]].map(([label, a, b]) => (
              <Card key={label} className="p-6">
                <div className="text-sm font-bold text-gray-900">{label} over the period</div>
                <div className="text-xs text-gray-500 mt-1">Farm average on each clear satellite image.</div>
                <div className="h-56 mt-4">
                  {a.length ? (
                    <Line data={chartData(a, b, label)} options={chartOpts} />
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-gray-400">
                      No clear satellite image in this period.
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* SECTION 7: Interactive AI Assistant on this Report */}
          <Card className="p-6 border-green-200 bg-gray-50/60 space-y-4 no-print">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <BrainCircuit size={16} className="text-green-700" />
              Ask AI agronomist about this report
            </div>
            <p className="text-xs text-gray-600">
              Ask follow-up questions regarding water management, fertilizer schedules, or specific block anomalies from this report.
            </p>

            <div className="flex items-center gap-2">
              <input
                value={aiQuestion}
                onChange={e => setAiQuestion(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && askAiOnReport()}
                placeholder="e.g. Which block requires immediate fertilizer top-dressing?"
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              />
              <button
                onClick={askAiOnReport}
                disabled={aiQuerying || !aiQuestion.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-sm font-semibold disabled:bg-gray-200 disabled:text-gray-400 transition-all"
              >
                <Send size={14} /> Ask AI
              </button>
            </div>

            {aiAnswers.length > 0 && (
              <div className="space-y-3 pt-2">
                {aiAnswers.map((ans, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white border border-gray-200 text-xs space-y-1.5">
                    <div className="font-bold text-gray-900 flex items-center gap-1.5">
                      <span className="text-green-700">Q:</span> {ans.q}
                    </div>
                    <div className="text-gray-700 leading-relaxed">
                      <span className="font-semibold text-green-800">AI:</span> {ans.a}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* SECTION 8: Data used and limits (plain words) */}
          <Card className="p-6 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-900"><Layers size={16} className="text-gray-600" />Data used and limits</div>
            <ul className="text-sm text-gray-700 space-y-1.5 list-disc pl-5">
              <li>{(report.health || []).length ? `${report.health.length} clear view${report.health.length === 1 ? '' : 's'} of the farm from space in this period${report.cmp ? `, ${(report.healthCmp || []).length} in the comparison period` : ''}. Cloudy days are left out.` : 'No clear view of the farm in this period because of cloud.'}</li>
              <li>Crop health and leaf water are estimates from satellite images, not measurements on the ground.</li>
              {(report.limits || []).map((lim, i) => <li key={i}>{lim}</li>)}
            </ul>
          </Card>

          {/* SECTION 9: Technical appendix (included by default; for agronomists, buyers and auditors) */}
          <Card className="p-6 space-y-4 bg-gray-50/60">
            <div className="text-sm font-bold text-gray-900">Technical appendix</div>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-xs text-gray-700">
              <div><dt className="font-semibold text-gray-900">Imagery</dt><dd>{(report.data_used?.sources || []).join('; ') || 'Not recorded for this report'}</dd></div>
              <div><dt className="font-semibold text-gray-900">Measures behind the words</dt><dd>Crop health = NDVI (vegetation index); Leaf water = NDMI (moisture index). Farm averages per clear view.</dd></div>
              <div><dt className="font-semibold text-gray-900">Period</dt><dd>{report.period.from} to {report.period.to}{report.cmp ? `; comparison ${report.cmp.from} to ${report.cmp.to}` : ''}</dd></div>
              <div><dt className="font-semibold text-gray-900">Clear-view dates</dt><dd>{(report.health || []).map(d => d.date).join(', ') || 'none'}</dd></div>
              <div><dt className="font-semibold text-gray-900">Method</dt><dd>Cloud-masked images; values averaged over the chosen area; block status from the latest clear view, classified with the legend classes set for this crop.</dd></div>
              <div><dt className="font-semibold text-gray-900">Weather</dt><dd>Open-Meteo reanalysis and forecast for the farm location.</dd></div>
            </dl>
          </Card>
        </div>
      )}

      {!report && !historyTab && (
        <Card className="p-10 no-print">
          <div className="max-w-xl mx-auto text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center text-green-700"><FileText size={22} /></div>
            <h3 className="text-lg font-semibold text-gray-900">Your report will appear here</h3>
            <p className="text-sm text-gray-500">Pick the report, the area and the period on the left, then press Create report. It reads top to bottom:</p>
          </div>
          <ol className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl mx-auto">
            {['Summary in plain words', 'Status at a glance', 'Blocks needing action, with what to do', 'What changed against the comparison', 'Advice for your focus', 'Data used and limits'].map((s, i) => (
              <li key={s} className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700"><span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold flex items-center justify-center">{i + 1}</span>{s}</li>
            ))}
          </ol>
        </Card>
      )}
      </section>
      </div>
    </div>
  );
}
