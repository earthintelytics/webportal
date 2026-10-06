import { useMemo, useState } from 'react';
import { Search, MapPin, Check, CheckCheck } from 'lucide-react';
import { Pill, Chip } from '../../../../../farmintelytics-admin/components/ui';
import { alertCatalogFor, SEVERITY } from './alertCatalog';

const plural = (unit, n) => (n === 1 ? unit : `${unit}s`);
const sev = (a) => SEVERITY[a.severity] || SEVERITY.Info;

/**
 * Alerts: "what needs my attention right now?" for one crop or service.
 * Every alert the backend returns is shown (also ones whose place is not in
 * the plot list), newest and most urgent first. The side panel says what this
 * service watches for, from its doc.
 *
 * alerts: [{ id, plot, category, severity, desc, date, time, status }]
 */
const AlertsPage = ({ alerts, places, serviceId, cropType, onAcknowledge, onAcknowledgeAll, onLocate }) => {
  const catalog = alertCatalogFor(serviceId, cropType);
  const [status, setStatus] = useState('open');
  const [severity, setSeverity] = useState('all');
  const [query, setQuery] = useState('');

  const nameOf = useMemo(() => {
    const m = new Map((places || []).map((p) => [String(p.id), p.name || p.id]));
    return (id) => m.get(String(id)) || id || 'Whole estate';
  }, [places]);

  const open = alerts.filter((a) => a.status !== 'Acknowledged');
  const shown = alerts
    .filter((a) => (status === 'open' ? a.status !== 'Acknowledged' : status === 'done' ? a.status === 'Acknowledged' : true))
    .filter((a) => severity === 'all' || a.severity === severity)
    .filter((a) => !query || `${nameOf(a.plot)} ${a.plot} ${a.category} ${a.desc}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => sev(a).rank - sev(b).rank || `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));

  const counts = Object.keys(SEVERITY).reduce((c, k) => ({ ...c, [k]: open.filter((a) => a.severity === k).length }), {});

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-gray-900">Alerts</h2>
            <p className="text-sm text-gray-500 mt-1">What needs attention now on your {plural(catalog.unit, 2)}.</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {counts.Critical > 0 && <Pill tone="critical">{counts.Critical} act now</Pill>}
            {counts.Warning > 0 && <Pill tone="warning">{counts.Warning} to watch</Pill>}
            <Pill>{open.length} open</Pill>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {[['open', 'Open'], ['done', 'Acknowledged'], ['all', 'All']].map(([v, l]) => <Chip key={v} on={status === v} onClick={() => setStatus(v)}>{l}</Chip>)}
              <span className="w-px h-5 bg-gray-200 mx-1" />
              <Chip on={severity === 'all'} onClick={() => setSeverity('all')}>Any level</Chip>
              {Object.entries(SEVERITY).map(([k, v]) => <Chip key={k} on={severity === k} onClick={() => setSeverity(k)}>{v.label}</Chip>)}
              <label className="relative ml-auto w-full sm:w-56">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <span className="sr-only">Search</span>
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${plural(catalog.unit, 2)}`}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 bg-white text-sm outline-none focus:border-green-600" />
              </label>
            </div>

            {alerts.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center">
                <p className="text-sm font-semibold text-gray-800">No alerts yet</p>
                <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">Alerts appear here after monitoring has run and found something on one of your {plural(catalog.unit, 2)} that needs attention.</p>
              </div>
            ) : shown.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center text-sm text-gray-600">
                {status === 'open' && !query && severity === 'all' ? 'Nothing open: every alert has been acknowledged.' : 'No alerts match these filters.'}
              </div>
            ) : (
              <ul className="space-y-3">
                {shown.map((a) => {
                  const s = sev(a);
                  const done = a.status === 'Acknowledged';
                  return (
                    <li key={a.id} className={`bg-white border rounded-2xl p-5 ${done ? 'border-gray-200 opacity-75' : s.tone === 'critical' ? 'border-l-4 border-l-status-critical border-gray-200' : s.tone === 'warning' ? 'border-l-4 border-l-status-warning border-gray-200' : 'border-gray-200'}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <Pill tone={done ? 'neutral' : s.tone}>{done ? 'Acknowledged' : s.label}</Pill>
                        <span className="text-sm font-semibold text-gray-900">{nameOf(a.plot)}</span>
                        {a.category && <span className="text-xs text-gray-500">· {a.category}</span>}
                        <span className="ml-auto text-xs text-gray-500">{a.date}{a.time && a.time !== '00:00' ? ` · ${a.time}` : ''}</span>
                      </div>
                      <p className="text-sm text-gray-700 mt-2 leading-relaxed">{a.desc}</p>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {a.plot && <button type="button" onClick={() => onLocate(a.plot)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"><MapPin size={13} />Show on map</button>}
                        {!done && <button type="button" onClick={() => onAcknowledge(a.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-green-700 hover:bg-green-800"><Check size={13} />Acknowledge</button>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {status === 'open' && shown.length > 1 && (
              <div className="flex justify-end">
                <button type="button" onClick={() => onAcknowledgeAll(shown.map((a) => a.id))} className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900"><CheckCheck size={15} />Acknowledge all shown</button>
              </div>
            )}
          </div>

          <aside className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
            <div>
              <h3 className="font-display text-base font-semibold text-gray-900">What raises an alert</h3>
              <p className="text-xs text-gray-500 mt-1">Checked after every monitoring run.</p>
            </div>
            {catalog.watches.length ? (
              <ul className="space-y-3">
                {catalog.watches.map((x) => (
                  <li key={x.when} className="text-sm">
                    <p className="text-gray-800">{x.when}</p>
                    <p className="text-xs text-gray-500 mt-0.5">What to do: {x.action}</p>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-gray-500">This service has no automatic alerts.</p>}
            {catalog.note && <p className="text-xs text-gray-500 border-t border-gray-100 pt-3">{catalog.note}</p>}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default AlertsPage;
