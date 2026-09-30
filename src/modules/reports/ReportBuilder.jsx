import { useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { CalendarDays, Layers, MapPin, GitCompare, Sprout, FileText, Download, Sparkles, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import * as api from '../../services/organizationMonitorApi';

/**
 * Reports page (design: docs/services/reports-and-verification.md).
 * For people who do not know GIS: pick what, where and when, get a plain
 * report with an AI-written summary, blocks needing action, what changed and
 * the data used. Built from real data already available (farm-average time
 * series per period, the latest status per block, live alerts); parts that
 * need the report service say so.
 */
const TYPES = [
  { id: 'monthly', label: 'Monthly farm report', desc: 'How the farm did this month and what needs action.', icon: <CalendarDays size={18} /> },
  { id: 'blocks', label: 'Block report', desc: 'One or a few blocks in detail.', icon: <MapPin size={18} /> },
  { id: 'compare', label: 'Comparison', desc: 'This period against another, or one estate against another.', icon: <GitCompare size={18} /> },
  { id: 'season', label: 'Season summary', desc: 'From the start of the season to now.', icon: <Sprout size={18} /> },
];
const iso = (d) => d.toISOString().slice(0, 10);
const monthRange = (ym) => { const [y, m] = ym.split('-').map(Number); return { from: iso(new Date(Date.UTC(y, m - 1, 1))), to: iso(new Date(Date.UTC(y, m, 0))) }; };
const lastMonth = () => { const d = new Date(); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - 1); return d.toISOString().slice(0, 7); };
const shift = ({ from, to }, kind) => {
  const f = new Date(from), t = new Date(to);
  if (kind === 'last_year') { f.setUTCFullYear(f.getUTCFullYear() - 1); t.setUTCFullYear(t.getUTCFullYear() - 1); return { from: iso(f), to: iso(t) }; }
  const days = Math.round((t - f) / 864e5) + 1; f.setUTCDate(f.getUTCDate() - days); t.setUTCDate(t.getUTCDate() - days); return { from: iso(f), to: iso(t) };
};
const fmtDate = (s) => new Date(s).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
const avg = (pts) => (pts.length ? pts.reduce((a, p) => a + p.mean, 0) / pts.length : null);
const HEALTH_WORD = (v) => (v == null ? 'no clear images' : v >= 0.7 ? 'strong' : v >= 0.55 ? 'good' : v >= 0.4 ? 'weaker than usual' : 'poor');

const Chip = ({ on, children, ...rest }) => (
  <button type="button" {...rest} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${on ? 'bg-green-50 border-green-600 text-green-800' : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'}`}>{children}</button>
);
const Card = ({ className = '', children }) => <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm ${className}`}>{children}</div>;
const selectCls = 'px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-800';

export default function ReportBuilder({ plots, alerts, estates, tenant, orgName, subject, cropType, onLegacy }) {
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
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState(null);

  const period = periodKind === 'month' ? monthRange(month) : range;
  const scopePlots = useMemo(() => (plots || []).filter(p =>
    level === 'organisation' ? true : level === 'estate' ? p.subfarm === estate : blocks.includes(p.id)), [plots, level, estate, blocks]);
  const blockList = useMemo(() => (plots || []).filter(p => !blockQuery || `${p.name} ${p.id} ${p.subfarm || ''}`.toLowerCase().includes(blockQuery.toLowerCase())).slice(0, 200), [plots, blockQuery]);
  const where = level === 'organisation' ? `all of ${orgName}` : level === 'estate' ? estate : `${blocks.length} block${blocks.length === 1 ? '' : 's'}`;
  const canCreate = level !== 'blocks' || blocks.length > 0;

  const create = async () => {
    setBusy(true);
    const cmp = type === 'compare' && compare === 'estate' ? null : shift(period, compare === 'last_year' ? 'last_year' : 'previous');
    const series = async (index, p) => {
      try {
        const r = await api.fetchTimeseriesSlider({ farm: tenant, index, start: p.from, end: p.to, cropType });
        return (r?.timeline || []).filter(t => t.mean != null).map(t => ({ date: t.date, mean: t.mean }));
      } catch { return []; }
    };
    const [health, water, healthCmp, waterCmp] = await Promise.all([series('ndvi', period), series('ndmi', period), cmp ? series('ndvi', cmp) : [], cmp ? series('ndmi', cmp) : []]);
    const status = { healthy: scopePlots.filter(p => p.health !== 'Stressed').length, action: scopePlots.filter(p => p.health === 'Stressed').length };
    const plotIds = new Set(scopePlots.map(p => p.id));
    const scopedAlerts = (alerts || []).filter(a => level === 'organisation' || plotIds.has(a.plot));
    const actions = [
      ...scopePlots.filter(p => p.health === 'Stressed').map(p => ({ block: p.name || p.id, estate: p.subfarm || '—', problem: 'Crop health is low on the latest clear image', action: 'Scout the block: check water, pests and nutrition', since: 'latest image' })),
      ...scopedAlerts.slice(0, 20).map(a => ({ block: a.plot, estate: a.estate || '—', problem: a.desc, action: a.category === 'Water Stress' ? 'Check water and irrigation' : 'Inspect and record what you find', since: a.date })),
    ].slice(0, 30);
    const h = avg(health), hc = avg(healthCmp), w = avg(water), wc = avg(waterCmp);
    const change = h != null && hc != null ? Math.round(((h - hc) / hc) * 100) : null;
    const numbers = { where, period, compare: cmp, crop_health_avg: h, crop_health_compare_avg: hc, change_pct: change, leaf_water_avg: w, leaf_water_compare_avg: wc, blocks_total: scopePlots.length, blocks_needing_action: status.action, images_in_period: health.length, alerts: scopedAlerts.length };
    const template = [
      `Between ${fmtDate(period.from)} and ${fmtDate(period.to)}, crop health across ${where} was ${HEALTH_WORD(h)}${change != null ? `, ${change >= 0 ? 'up' : 'down'} ${Math.abs(change)}% on the comparison period` : ''}.`,
      health.length ? `${health.length} clear satellite image${health.length > 1 ? 's were' : ' was'} used.` : 'No clear satellite images were available for this period (cloud), so the figures below are limited.',
      status.action ? `${status.action} of ${scopePlots.length} blocks need a closer look; they are listed below with what to do.` : scopePlots.length ? 'No blocks need action on the latest image.' : '',
    ].filter(Boolean).join(' ');
    let summary = { text: template, ai: false };
    try {
      const r = await api.queryAiAgent(`Write a 3 to 5 sentence plain-language farm report summary for a farm manager who does not know GIS. Use only these numbers, do not add any other numbers, no index names (say crop health, leaf water), no certification claims. Subject: ${subject}. Data: ${JSON.stringify(numbers)}`);
      if (r?.response && !/unavailable|error/i.test(r.response)) summary = { text: r.response, ai: true };
    } catch { /* AI not available: keep the template summary */ }
    setReport({ type, where, period, cmp, health, water, healthCmp, waterCmp, status, actions, summary, numbers, created: new Date() });
    setBusy(false);
  };

  const chartData = (a, b, label) => ({
    labels: a.map(p => p.date.slice(5)),
    datasets: [
      { label: `${label} (${fmtDate(report.period.from)} – ${fmtDate(report.period.to)})`, data: a.map(p => p.mean), borderColor: '#15803d', backgroundColor: 'transparent', tension: 0.3, pointRadius: 2 },
      ...(b.length ? [{ label: 'Comparison period', data: b.map(p => p.mean), borderColor: '#94a3b8', borderDash: [5, 4], backgroundColor: 'transparent', tension: 0.3, pointRadius: 0 }] : []),
    ],
  });
  const chartOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } }, scales: { y: { ticks: { display: false }, grid: { color: '#f1f5f9' } }, x: { grid: { display: false }, ticks: { font: { size: 11 } } } } };
  const print = () => { document.body.classList.add('fi-print-report'); window.print(); setTimeout(() => document.body.classList.remove('fi-print-report'), 500); };

  return (
    <div className="p-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Reports</h2>
          <p className="text-sm text-gray-500 font-medium mt-2 max-w-2xl">Choose what, where and when. You get a plain report with what happened, what changed and what to do, ready to download or share.</p>
        </div>
        {onLegacy && <button onClick={onLegacy} className="text-sm font-semibold text-gray-500 hover:text-gray-800">Previous report view</button>}
      </div>

      <Card className="p-7 space-y-7">
        <div className="space-y-3">
          <div className="text-sm font-semibold text-gray-900">1. What kind of report?</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {TYPES.map(t => (
              <button key={t.id} onClick={() => setType(t.id)} className={`text-left p-4 rounded-2xl border ${type === t.id ? 'border-green-600 ring-1 ring-green-600 bg-green-50/40' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className="flex items-center gap-2 text-green-700">{t.icon}<span className="text-sm font-semibold text-gray-900">{t.label}</span></div>
                <div className="text-xs text-gray-500 mt-1.5">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-semibold text-gray-900">2. Which area?</div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip on={level === 'organisation'} onClick={() => setLevel('organisation')}>Whole organisation</Chip>
            {estates.length > 0 && <Chip on={level === 'estate'} onClick={() => setLevel('estate')}>One estate</Chip>}
            <Chip on={level === 'blocks'} onClick={() => setLevel('blocks')}>Chosen blocks</Chip>
            {level === 'estate' && <select className={selectCls} value={estate} onChange={e => setEstate(e.target.value)}>{estates.map(x => <option key={x}>{x}</option>)}</select>}
          </div>
          {level === 'blocks' && (
            <div className="rounded-xl border border-gray-200 p-3 space-y-2">
              <input value={blockQuery} onChange={e => setBlockQuery(e.target.value)} placeholder="Search blocks" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
              {(plots || []).length === 0 ? <div className="text-xs text-gray-500">No individual blocks are registered for this organisation yet; use the whole organisation.</div> : (
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                  {blockList.map(p => <Chip key={p.id} on={blocks.includes(p.id)} onClick={() => setBlocks(b => b.includes(p.id) ? b.filter(x => x !== p.id) : [...b, p.id])}>{p.name || p.id}</Chip>)}
                </div>
              )}
              <div className="text-xs text-gray-500">{blocks.length} chosen</div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="text-sm font-semibold text-gray-900">3. Which period?</div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip on={periodKind === 'month'} onClick={() => setPeriodKind('month')}>A month</Chip>
            <Chip on={periodKind === 'range'} onClick={() => setPeriodKind('range')}>Dates</Chip>
            {periodKind === 'month' ? <input type="month" className={selectCls} value={month} onChange={e => setMonth(e.target.value)} />
              : <><input type="date" className={selectCls} value={range.from} onChange={e => setRange(r => ({ ...r, from: e.target.value }))} /><span className="text-sm text-gray-500">to</span><input type="date" className={selectCls} value={range.to} onChange={e => setRange(r => ({ ...r, to: e.target.value }))} /></>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 mr-1">Compare with</span>
            <Chip on={compare === 'previous'} onClick={() => setCompare('previous')}>Previous period</Chip>
            <Chip on={compare === 'last_year'} onClick={() => setCompare('last_year')}>Same period last year</Chip>
            {type === 'compare' && estates.length > 1 && <Chip on={compare === 'estate'} onClick={() => setCompare('estate')}>Another estate</Chip>}
            {compare === 'estate' && <select className={selectCls} value={compareEstate} onChange={e => setCompareEstate(e.target.value)}>{estates.map(x => <option key={x}>{x}</option>)}</select>}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={create} disabled={busy || !canCreate} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-green-700 hover:bg-green-800 disabled:bg-gray-200 disabled:text-gray-500"><FileText size={16} />{busy ? 'Creating report…' : 'Create report'}</button>
          <span className="text-sm text-gray-500">{TYPES.find(t => t.id === type).label} · {where} · {fmtDate(period.from)} – {fmtDate(period.to)}</span>
        </div>
      </Card>

      {report && (
        <div id="fi-report" className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-green-700">{TYPES.find(t => t.id === report.type).label}</div>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{subject}: {report.where}</h3>
              <div className="text-sm text-gray-500 mt-1">{fmtDate(report.period.from)} – {fmtDate(report.period.to)}{report.cmp ? ` · compared with ${fmtDate(report.cmp.from)} – ${fmtDate(report.cmp.to)}` : ''}</div>
            </div>
            <button onClick={print} className="no-print inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50"><Download size={15} />Download PDF</button>
          </div>

          <Card className="p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900"><Sparkles size={16} className="text-green-700" />Summary</div>
            <p className="text-base text-gray-800 leading-relaxed mt-3">{report.summary.text}</p>
            <p className="text-xs text-gray-500 mt-3">{report.summary.ai ? 'Written by the FarmIntelytics assistant from the numbers in this report.' : 'Summary from the numbers in this report (the AI writer is being connected).'}</p>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              ['Blocks looked at', report.numbers.blocks_total || '—'],
              ['Need a closer look', report.status.action],
              ['Crop health', HEALTH_WORD(report.numbers.crop_health_avg)],
              ['Change vs comparison', report.numbers.change_pct == null ? '—' : `${report.numbers.change_pct >= 0 ? '+' : ''}${report.numbers.change_pct}%`],
            ].map(([k, v]) => <Card key={k} className="px-5 py-4"><div className="text-xs font-semibold text-gray-600">{k}</div><div className="text-2xl font-bold text-gray-900 mt-1 capitalize">{v}</div></Card>)}
          </div>

          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900"><AlertTriangle size={16} className="text-amber-600" />Blocks needing action</div>
            {report.actions.length === 0 ? <div className="flex items-center gap-2 text-sm text-green-700"><CheckCircle2 size={16} />Nothing needs action in this area and period.</div> : (
              <table className="w-full text-sm">
                <thead className="text-left text-xs font-semibold text-gray-500"><tr><th className="py-2">Block</th><th className="py-2">Estate</th><th className="py-2">What we see</th><th className="py-2">What to do</th><th className="py-2">Since</th></tr></thead>
                <tbody className="divide-y divide-gray-100">{report.actions.map((a, i) => <tr key={i}><td className="py-2 font-semibold text-gray-900">{a.block}</td><td className="py-2">{a.estate}</td><td className="py-2 text-gray-700">{a.problem}</td><td className="py-2 text-gray-700">{a.action}</td><td className="py-2 text-gray-500">{a.since}</td></tr>)}</tbody>
              </table>
            )}
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[['Crop health', report.health, report.healthCmp], ['Leaf water', report.water, report.waterCmp]].map(([label, a, b]) => (
              <Card key={label} className="p-6">
                <div className="text-sm font-semibold text-gray-900">{label} over the period</div>
                <div className="text-xs text-gray-500 mt-1">Farm average on each clear satellite image; higher is better.</div>
                <div className="h-56 mt-4">{a.length ? <Line data={chartData(a, b, label)} options={chartOpts} /> : <div className="h-full flex items-center justify-center text-sm text-gray-500">No clear images in this period.</div>}</div>
              </Card>
            ))}
          </div>

          <Card className="p-6 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900"><Layers size={16} className="text-gray-500" />Data used and limits</div>
            <ul className="text-sm text-gray-700 space-y-1 list-disc pl-5">
              <li>{report.health.length} clear Sentinel-2 image{report.health.length === 1 ? '' : 's'} in the period{report.cmp ? `, ${report.healthCmp.length} in the comparison period` : ''}. Cloudy dates are left out.</li>
              <li>Block status uses the latest clear image; per-block values for the chosen period come with the report service.</li>
              <li>Crop health and leaf water are satellite estimates of greenness and leaf moisture, not field measurements.</li>
              <li>Weather, map snapshot and the crop section come with the report service (being connected).</li>
            </ul>
          </Card>
        </div>
      )}

      {!report && <div className="flex items-center gap-2 text-sm text-gray-500"><Info size={15} />Nothing is sent until you press Create report.</div>}
    </div>
  );
}
