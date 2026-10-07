import { useState, useEffect, useMemo } from 'react';
import { Clock, Plus, Trash2, Pencil, X, Check, ChevronDown, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  fetchSchedulerJobs, createSchedulerJob, updateSchedulerJob, deleteSchedulerJob, fetchPipelineConfigs, fetchOrganizations, fetchPipelineLogs, runSchedulerJob, runOrganizationServices,
} from '../../services/adminApi';
import { licensedServiceOptions } from './organisation/serviceOptions';
import { useConfirm } from '../components/ConfirmProvider';
import ErrorBanner from '../components/ErrorBanner';
import { WEEKDAYS, DEFAULT_SCHEDULE, cronFor, parseCron, scheduleText, nextRun, nextRuns, cronError } from '../components/schedule';

/**
 * Monitoring schedule: when each organisation's estates get new satellite
 * images processed. Plain schedules (every N days / weekly / monthly at a
 * time); the cron rule only appears under technical details.
 */
const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm text-gray-900 outline-none focus:border-green-600';
const Chip = ({ on, children, ...rest }) => (
  <button type="button" {...rest} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${on ? 'bg-green-50 border-green-600 text-green-800' : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'}`}>{children}</button>
);
const fmt = (d) => d ? d.toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
const RUN_STYLE = {
  success: 'bg-green-50 text-green-800 border-green-200', completed: 'bg-green-50 text-green-800 border-green-200',
  partial: 'bg-amber-50 text-amber-800 border-amber-200', failed: 'bg-red-50 text-red-700 border-red-200',
};

function SchedulePicker({ value, onChange }) {
  const s = value;
  const set = (patch) => onChange({ ...s, ...patch });
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[['days', 'Every few days'], ['weekly', 'Weekly'], ['monthly', 'Monthly'], ['custom', 'Custom rule']].map(([id, label]) => (
          <Chip key={id} on={s.mode === id} onClick={() => set(id === 'custom' && !s.custom ? { mode: id, custom: cronFor(s) } : { mode: id })}>{label}</Chip>
        ))}
      </div>
      {s.mode === 'custom' ? <CustomRule value={s.custom || ''} onChange={custom => set({ custom })} /> : (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {s.mode === 'days' && <label className="space-y-1.5 block"><span className="text-sm font-semibold text-gray-800">How often</span><select className={inputCls} value={s.every} onChange={e => set({ every: +e.target.value })}>{[1, 2, 3, 5, 7, 10, 14].map(n => <option key={n} value={n}>{n === 1 ? 'Every day' : `Every ${n} days`}</option>)}</select></label>}
        {s.mode === 'days' && Number(s.every) > 1 && <label className="space-y-1.5 block"><span className="text-sm font-semibold text-gray-800">Starting on day</span><select className={inputCls} value={s.startDay || 1} onChange={e => set({ startDay: +e.target.value })}>{Array.from({ length: Number(s.every) }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d === 1 ? '1 (default)' : d}</option>)}</select><span className="block text-xs text-gray-500">Give each organisation a different start day to spread the load.</span></label>}
        {s.mode === 'weekly' && <label className="space-y-1.5 block"><span className="text-sm font-semibold text-gray-800">Day</span><select className={inputCls} value={s.weekday} onChange={e => set({ weekday: +e.target.value })}>{WEEKDAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}</select></label>}
        {s.mode === 'monthly' && <label className="space-y-1.5 block"><span className="text-sm font-semibold text-gray-800">Day of the month</span><select className={inputCls} value={s.monthday} onChange={e => set({ monthday: +e.target.value })}>{Array.from({ length: 28 }, (_, i) => i + 1).map(d => <option key={d}>{d}</option>)}</select></label>}
        <label className="space-y-1.5 block"><span className="text-sm font-semibold text-gray-800">Time (server time)</span><select className={inputCls} value={s.hour} onChange={e => set({ hour: +e.target.value, minute: 0 })}>{Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}</select></label>
      </div>
      )}
      {s.mode !== 'custom' && <p className="text-sm text-gray-700">Runs <span className="font-semibold">{scheduleText(s).charAt(0).toLowerCase() + scheduleText(s).slice(1)}</span>.</p>}
    </div>
  );
}

// Any cron rule: typed freely, checked as you type, next runs shown.
export function CustomRule({ value, onChange }) {
  const err = value.trim() ? cronError(value) : 'Type a rule, e.g. "0 3 1,15 * *" (03:00 on the 1st and 15th).';
  const runs = err ? [] : nextRuns(value, 3);
  const simple = err ? null : parseCron(value);
  return (
    <div className="space-y-2">
      <label className="space-y-1.5 block">
        <span className="text-sm font-semibold text-gray-800">Cron rule</span>
        <input className={`${inputCls} font-mono`} value={value} onChange={e => onChange(e.target.value)} placeholder="minute hour day-of-month month day-of-week" spellCheck={false} />
      </label>
      <div className="text-xs text-gray-500">5 parts: minute (0–59) · hour (0–23) · day of month (1–31) · month (1–12) · day of week (0–6, Sunday = 0). Use * for any, lists 1,15, ranges 1-5, steps */6.</div>
      {err ? <div className="text-xs text-amber-800">{err}</div> : (
        <div className="text-sm text-gray-700">{simple && <><span className="font-semibold">{scheduleText(simple)}</span>. </>}Next runs: {runs.map(d => d.toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })).join(' · ') || 'none within a year'}</div>
      )}
    </div>
  );
}

function JobModal({ job, orgs, configs, onSave, onClose }) {
  const parsed = job ? parseCron(job.cron) : DEFAULT_SCHEDULE;
  const [schedule, setSchedule] = useState(parsed || { ...DEFAULT_SCHEDULE, mode: 'custom', custom: job?.cron || '' });
  const [org, setOrg] = useState(() => (job ? orgs.find(o => job.name.startsWith(o.schema_name))?.schema_name || '' : ''));
  const [configPath, setConfigPath] = useState(job?.config_path || '');
  const [name, setName] = useState(job?.name || '');
  const [description, setDescription] = useState(job?.description || '');
  const [isBatch, setIsBatch] = useState(job ? job.is_batch : true);
  const [advanced, setAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const orgConfigs = org ? configs.filter(c => c.filename.startsWith(org) || (c.batch_name || '').startsWith(org)) : configs;
  const cron = cronFor(schedule);
  const autoName = configPath ? `${configPath.replace('configs/', '').replace(/\.ya?ml$/, '')}_scheduled_monitoring` : '';

  const save = async () => {
    if (!configPath) return setError('Choose which site to monitor.');
    if (cronError(cron)) return setError(cronError(cron));
    setSaving(true); setError('');
    try {
      const site = configs.find(c => `configs/${c.filename}` === configPath);
      await onSave(job?.name, {
        name: job?.name || name.trim() || autoName, cron, config_path: configPath, is_batch: isBatch, enabled: job ? job.enabled : true,
        description: description.trim() || `Satellite monitoring for ${site?.batch_name || configPath}`,
      });
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-gray-900/30 p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-xl p-7 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{job ? 'Edit schedule' : 'New schedule'}</h3>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100" aria-label="Close"><X size={18} /></button>
        </div>
        <ErrorBanner message={error} onDismiss={() => setError('')} />
        {!job && (
          <div className="grid grid-cols-1 gap-4">
            <label className="space-y-1.5 block"><span className="text-sm font-semibold text-gray-800">Organisation</span>
              <select className={inputCls} value={org} onChange={e => { setOrg(e.target.value); setConfigPath(''); }}>
                <option value="">All organisations</option>
                {orgs.map(o => <option key={o.schema_name} value={o.schema_name}>{o.display_name || o.schema_name}</option>)}
              </select>
            </label>
            <label className="space-y-1.5 block"><span className="text-sm font-semibold text-gray-800">Site to monitor</span>
              <select className={inputCls} value={configPath} onChange={e => setConfigPath(e.target.value)}>
                <option value="">Choose</option>
                {orgConfigs.map(c => <option key={c.filename} value={`configs/${c.filename}`}>{c.batch_name || c.filename}</option>)}
              </select>
              {org && orgConfigs.length === 0 && <span className="block text-xs text-amber-800">No site set up for this organisation yet. Finish its onboarding first.</span>}
            </label>
          </div>
        )}
        <SchedulePicker value={schedule} onChange={setSchedule} />
        <div className="rounded-xl border border-gray-200">
          <button type="button" onClick={() => setAdvanced(a => !a)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700">Technical details<ChevronDown size={16} className={advanced ? 'rotate-180' : ''} /></button>
          {advanced && (
            <div className="px-4 pb-4 pt-3 border-t border-gray-100 space-y-4">
              {!job && <label className="space-y-1.5 block"><span className="text-sm font-semibold text-gray-800">Job name</span><input className={inputCls} placeholder={autoName || 'generated from the site'} value={name} onChange={e => setName(e.target.value)} /></label>}
              <label className="space-y-1.5 block"><span className="text-sm font-semibold text-gray-800">Description</span><input className={inputCls} value={description} onChange={e => setDescription(e.target.value)} placeholder="Generated from the site" /></label>
              <div className="text-xs text-gray-600">Cron rule saved: <span className="font-mono">{cron || '—'}</span></div>
              <label className="flex items-center gap-3 text-sm text-gray-800"><input type="checkbox" checked={isBatch} onChange={e => setIsBatch(e.target.checked)} className="w-4 h-4 accent-green-700" />Run all estates in this configuration together</label>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50">Cancel</button>
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-700 hover:bg-green-800 disabled:bg-gray-200 disabled:text-gray-500"><Check size={15} />{saving ? 'Saving…' : job ? 'Save' : 'Create schedule'}</button>
        </div>
      </div>
    </div>
  );
}

// Run now for one organisation: pick the services to run; one job per service.
function RunServicesModal({ org, onClose, onStarted }) {
  const options = licensedServiceOptions(org);
  const [chosen, setChosen] = useState(options.map((o) => o.id));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const toggle = (id) => setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  const start = async () => {
    if (!chosen.length) return setError('Choose at least one service.');
    setBusy(true); setError('');
    try { const res = await runOrganizationServices(org.schema_name, chosen); onStarted(res); } catch (e) { setError(e.message); setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-gray-900/30 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-xl p-7 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Run now: {org.display_name || org.schema_name}</h3>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100" aria-label="Close"><X size={18} /></button>
        </div>
        <ErrorBanner message={error} onDismiss={() => setError('')} />
        {options.length === 0 ? (
          <p className="text-sm text-gray-600">This organisation has no licensed services. Turn some on under its licence first.</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-800">Which services?</span>
              <button type="button" onClick={() => setChosen(chosen.length === options.length ? [] : options.map((o) => o.id))} className="text-xs font-semibold text-green-700 hover:underline">{chosen.length === options.length ? 'Clear all' : 'Choose all'}</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {options.map((o) => <Chip key={o.id} on={chosen.includes(o.id)} onClick={() => toggle(o.id)}>{o.label}</Chip>)}
            </div>
            <p className="text-xs text-gray-500">Each service runs as its own job, only on the estates whose boundary is for that service. Progress shows under Pipeline runs.</p>
          </div>
        )}
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50">Cancel</button>
          <button onClick={start} disabled={busy || !options.length} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-700 hover:bg-green-800 disabled:bg-gray-200 disabled:text-gray-500"><Play size={15} />{busy ? 'Starting…' : `Run ${chosen.length || ''} ${chosen.length === 1 ? 'service' : 'services'}`}</button>
        </div>
      </div>
    </div>
  );
}

const Scheduler = () => {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [started, setStarted] = useState({});
  const [jobs, setJobs] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);

  const load = async () => {
    try {
      const [j, c, o, l] = await Promise.all([
        fetchSchedulerJobs(), fetchPipelineConfigs(),
        fetchOrganizations().catch(() => []), fetchPipelineLogs(null, 100).catch(() => ({ logs: [] })),
      ]);
      setJobs(j); setConfigs(c); setOrgs(Array.isArray(o) ? o : o?.items || []); setLogs(l?.logs || []);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };
  // load() is async: its state updates happen after the awaited requests, not synchronously in the effect
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/set-state-in-effect

  const rows = useMemo(() => jobs.map(job => {
    const org = orgs.find(o => job.name.startsWith(o.schema_name) || job.config_path.includes(o.schema_name));
    const site = configs.find(c => `configs/${c.filename}` === job.config_path);
    const siteId = (site?.batch_name || job.config_path.replace('configs/', '').replace(/\.ya?ml$/, ''));
    const last = logs.find(l => l.job_name === job.name || (l.batch_name && l.batch_name === site?.batch_name) || (l._minio_path || '').includes(siteId));
    return { job, org, site, parsed: parseCron(job.cron), next: job.enabled ? nextRun(job.cron) : null, last };
  }), [jobs, orgs, configs, logs]);

  // One card per organisation: its services, Run now with a service picker, and its site schedules.
  const groups = useMemo(() => {
    const byOrg = new Map(orgs.map((o) => [o.schema_name, { org: o, rows: [] }]));
    const unassigned = [];
    rows.forEach((r) => { if (r.org && byOrg.has(r.org.schema_name)) byOrg.get(r.org.schema_name).rows.push(r); else unassigned.push(r); });
    const list = [...byOrg.values()].sort((a, b) => (b.rows.length - a.rows.length) || (a.org.display_name || a.org.schema_name).localeCompare(b.org.display_name || b.org.schema_name));
    return { list, unassigned };
  }, [rows, orgs]);
  const [runFor, setRunFor] = useState(null);
  const [orgStarted, setOrgStarted] = useState({});

  const toggle = async (job) => {
    setJobs(prev => prev.map(j => j.name === job.name ? { ...j, enabled: !job.enabled } : j));
    try { await updateSchedulerJob(job.name, { enabled: !job.enabled }); } catch (e) { setError(`Could not change it: ${e.message}`); await load(); }
  };
  // Run now: the backend queues a monitoring job; Pipeline runs shows its progress.
  const runNow = async (name) => {
    try { await runSchedulerJob(name); setStarted((s) => ({ ...s, [name]: true })); } catch (e) { setError(`Could not start it: ${e.message}`); }
  };
  const save = async (name, form) => { if (name) await updateSchedulerJob(name, form); else await createSchedulerJob(form); setModal(null); await load(); };
  const remove = async (name) => {
    if (!(await confirm(`Delete the schedule "${name}"? Monitoring for that site stops until a new schedule is made.`))) return;
    try { await deleteSchedulerJob(name); await load(); } catch (e) { setError(e.message); }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-green-700">Operations</p>
            <h1 className="font-display text-3xl font-semibold text-gray-900 tracking-tight mt-1">Monitoring schedule</h1>
            <p className="text-sm text-gray-500 mt-2 max-w-2xl">When each site gets new satellite images processed, when it runs next, and how its last run went.</p>
          </div>
          <button onClick={() => setModal({ job: null })} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-700 hover:bg-green-800"><Plus size={16} />New schedule</button>
        </div>

        <ErrorBanner message={error} onDismiss={() => setError('')} onRetry={load} />
        <p className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
          "On" means the schedule is saved and will be used. Runs only happen while the scheduler service is running on the server; each run then appears under Pipeline runs. If a schedule is on but Pipeline runs stays empty, the scheduler service is stopped.
        </p>

        {loading ? <div className="text-center py-16 text-sm text-gray-500">Loading schedules…</div> : groups.list.length === 0 && rows.length === 0 ? (
          <div className="text-center py-16 bg-white border border-dashed border-gray-300 rounded-2xl text-sm text-gray-600">No organisations or schedules yet. Onboarding creates one schedule per site, or add one with “New schedule”.</div>
        ) : [...groups.list, ...(groups.unassigned.length ? [{ org: null, rows: groups.unassigned }] : [])].map(({ org: gOrg, rows: gRows }) => {
          const services = gOrg ? licensedServiceOptions(gOrg) : [];
          const key = gOrg?.schema_name || 'unassigned';
          return (
          <section key={key} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100">
              <div className="min-w-0">
                <h2 className="font-display text-lg font-semibold text-gray-900">{gOrg ? (gOrg.display_name || gOrg.schema_name) : 'Not linked to an organisation'}</h2>
                {gOrg && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {services.length ? services.map((s) => <span key={s.id} className="text-xs font-medium px-2 py-0.5 rounded-full border border-gray-200 text-gray-700">{s.label}</span>) : <span className="text-xs text-gray-500">No licensed services</span>}
                  </div>
                )}
              </div>
              {gOrg && (orgStarted[key]
                ? <button onClick={() => navigate('/admin/runs')} className="shrink-0 px-3 py-2 rounded-xl text-sm font-semibold text-sky-800 bg-sky-50 border border-sky-200">{orgStarted[key]} started · view runs</button>
                : <button onClick={() => setRunFor(gOrg)} disabled={!services.length} className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-gray-800 border border-gray-300 hover:bg-gray-50 disabled:opacity-40"><Play size={15} />Run now…</button>)}
            </div>
            {gRows.length === 0 ? (
              <p className="px-5 py-4 text-sm text-gray-500">No schedule for this organisation yet. Add one with “New schedule”, or use Run now.</p>
            ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-600">
                <tr><th className="px-5 py-3">Site</th><th className="px-5 py-3">Schedule</th><th className="px-5 py-3">Next run</th><th className="px-5 py-3">Last run</th><th className="px-5 py-3">On</th><th className="px-5 py-3 w-36" /></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {gRows.map(({ job, site, parsed, next, last }) => (
                  <tr key={job.name} className={job.enabled ? '' : 'bg-gray-50/60'}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className={`w-9 h-9 rounded-xl border flex items-center justify-center ${job.enabled ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}><Clock size={16} /></span>
                        <div className="font-semibold text-gray-900">{site?.batch_name || job.config_path.replace('configs/', '')}</div>
                      </div>
                    </td>
                    <td className="px-5 py-4"><div className="text-gray-800">{scheduleText(parsed)}</div>{!parsed && <div className="text-xs font-mono text-gray-500">{job.cron}</div>}</td>
                    <td className="px-5 py-4 text-gray-700">{job.enabled ? (next ? fmt(next) : 'See custom rule') : 'Paused'}</td>
                    <td className="px-5 py-4">
                      {last ? (
                        <div><span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${RUN_STYLE[last.status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>{last.status || 'recorded'}</span>
                          {last.timestamp && <div className="text-xs text-gray-500 mt-1">{fmt(new Date(last.timestamp))}</div>}</div>
                      ) : <span className="text-xs text-gray-500">No run recorded yet</span>}
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => toggle(job)} role="switch" aria-checked={job.enabled} aria-label={job.enabled ? 'Pause' : 'Resume'} className={`relative w-10 h-6 rounded-full transition-colors ${job.enabled ? 'bg-green-600' : 'bg-gray-300'}`}>
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${job.enabled ? 'left-5' : 'left-1'}`} />
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        {started[job.name]
                          ? <button onClick={() => navigate('/admin/runs')} className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-sky-800 bg-sky-50 border border-sky-200">Started · view</button>
                          : <button onClick={() => runNow(job.name)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100" aria-label="Run now" title="Run now"><Play size={15} /></button>}
                        <button onClick={() => setModal({ job })} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100" aria-label="Edit"><Pencil size={15} /></button>
                        <button onClick={() => remove(job.name)} className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50" aria-label="Delete"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </section>
          );
        })}
        <p className="text-xs text-gray-500">Times are server time. Next runs happen only while the pipeline scheduler service is running; its runs and their progress are on Pipeline runs. A paused schedule keeps its settings; turn it back on to resume.</p>
      </div>
      {runFor && <RunServicesModal org={runFor} onClose={() => setRunFor(null)} onStarted={(res) => { setOrgStarted((s) => ({ ...s, [runFor.schema_name]: `${res?.jobs?.length || 0} ${res?.jobs?.length === 1 ? 'job' : 'jobs'}` })); setRunFor(null); }} />}
      {modal && <JobModal job={modal.job} orgs={orgs} configs={configs} onSave={save} onClose={() => setModal(null)} />}
    </div>
  );
};

export default Scheduler;
