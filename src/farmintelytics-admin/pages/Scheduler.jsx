import { useState, useEffect, useMemo } from 'react';
import { Clock, Plus, Trash2, Pencil, X, Check, ChevronDown } from 'lucide-react';
import {
  fetchSchedulerJobs, createSchedulerJob, updateSchedulerJob, deleteSchedulerJob, fetchPipelineConfigs, fetchOrganizations, fetchPipelineLogs,
} from '../../services/adminApi';
import { useConfirm } from '../components/ConfirmProvider';
import ErrorBanner from '../components/ErrorBanner';
import { WEEKDAYS, DEFAULT_SCHEDULE, cronFor, parseCron, scheduleText, nextRun } from '../components/schedule';

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
        {[['days', 'Every few days'], ['weekly', 'Weekly'], ['monthly', 'Monthly']].map(([id, label]) => <Chip key={id} on={s.mode === id} onClick={() => set({ mode: id })}>{label}</Chip>)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {s.mode === 'days' && <label className="space-y-1.5 block"><span className="text-sm font-semibold text-gray-800">How often</span><select className={inputCls} value={s.every} onChange={e => set({ every: +e.target.value })}>{[1, 2, 3, 5, 7, 10, 14].map(n => <option key={n} value={n}>{n === 1 ? 'Every day' : `Every ${n} days`}</option>)}</select></label>}
        {s.mode === 'days' && Number(s.every) > 1 && <label className="space-y-1.5 block"><span className="text-sm font-semibold text-gray-800">Starting on day</span><select className={inputCls} value={s.startDay || 1} onChange={e => set({ startDay: +e.target.value })}>{Array.from({ length: Number(s.every) }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d === 1 ? '1 (default)' : d}</option>)}</select><span className="block text-xs text-gray-500">Give each organisation a different start day to spread the load.</span></label>}
        {s.mode === 'weekly' && <label className="space-y-1.5 block"><span className="text-sm font-semibold text-gray-800">Day</span><select className={inputCls} value={s.weekday} onChange={e => set({ weekday: +e.target.value })}>{WEEKDAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}</select></label>}
        {s.mode === 'monthly' && <label className="space-y-1.5 block"><span className="text-sm font-semibold text-gray-800">Day of the month</span><select className={inputCls} value={s.monthday} onChange={e => set({ monthday: +e.target.value })}>{Array.from({ length: 28 }, (_, i) => i + 1).map(d => <option key={d}>{d}</option>)}</select></label>}
        <label className="space-y-1.5 block"><span className="text-sm font-semibold text-gray-800">Time (server time)</span><select className={inputCls} value={s.hour} onChange={e => set({ hour: +e.target.value, minute: 0 })}>{Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}</select></label>
      </div>
      <p className="text-sm text-gray-700">Runs <span className="font-semibold">{scheduleText(s).toLowerCase()}</span>.</p>
    </div>
  );
}

function JobModal({ job, orgs, configs, onSave, onClose }) {
  const parsed = job ? parseCron(job.cron) : DEFAULT_SCHEDULE;
  const [schedule, setSchedule] = useState(parsed || DEFAULT_SCHEDULE);
  const [custom, setCustom] = useState(job && !parsed ? job.cron : '');
  const [org, setOrg] = useState(() => (job ? orgs.find(o => job.name.startsWith(o.schema_name))?.schema_name || '' : ''));
  const [configPath, setConfigPath] = useState(job?.config_path || '');
  const [name, setName] = useState(job?.name || '');
  const [description, setDescription] = useState(job?.description || '');
  const [isBatch, setIsBatch] = useState(job ? job.is_batch : true);
  const [advanced, setAdvanced] = useState(Boolean(job && !parsed));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const orgConfigs = org ? configs.filter(c => c.filename.startsWith(org) || (c.batch_name || '').startsWith(org)) : configs;
  const cron = custom.trim() || cronFor(schedule);
  const autoName = configPath ? `${configPath.replace('configs/', '').replace(/\.ya?ml$/, '')}_scheduled_monitoring` : '';

  const save = async () => {
    if (!configPath) return setError('Choose which site to monitor.');
    if (custom.trim() && custom.trim().split(/\s+/).length !== 5) return setError('A custom rule needs 5 parts, e.g. "0 3 */5 * *".');
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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/30 p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
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
        {parsed || !job ? <SchedulePicker value={schedule} onChange={(s) => { setSchedule(s); setCustom(''); }} /> : <p className="text-sm text-gray-700">This schedule uses a custom rule (see technical details).</p>}
        <div className="rounded-xl border border-gray-200">
          <button type="button" onClick={() => setAdvanced(a => !a)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700">Technical details<ChevronDown size={16} className={advanced ? 'rotate-180' : ''} /></button>
          {advanced && (
            <div className="px-4 pb-4 pt-3 border-t border-gray-100 space-y-4">
              {!job && <label className="space-y-1.5 block"><span className="text-sm font-semibold text-gray-800">Job name</span><input className={inputCls} placeholder={autoName || 'generated from the site'} value={name} onChange={e => setName(e.target.value)} /></label>}
              <label className="space-y-1.5 block"><span className="text-sm font-semibold text-gray-800">Description</span><input className={inputCls} value={description} onChange={e => setDescription(e.target.value)} placeholder="Generated from the site" /></label>
              <label className="space-y-1.5 block"><span className="text-sm font-semibold text-gray-800">Custom rule (cron)</span><input className={`${inputCls} font-mono`} placeholder={cronFor(schedule)} value={custom} onChange={e => setCustom(e.target.value)} /><span className="block text-xs text-gray-500">Leave empty to use the schedule above ({cronFor(schedule)}).</span></label>
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

const Scheduler = () => {
  const confirm = useConfirm();
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

  const toggle = async (job) => {
    setJobs(prev => prev.map(j => j.name === job.name ? { ...j, enabled: !job.enabled } : j));
    try { await updateSchedulerJob(job.name, { enabled: !job.enabled }); } catch (e) { setError(`Could not change it: ${e.message}`); await load(); }
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

        {loading ? <div className="text-center py-16 text-sm text-gray-500">Loading schedules…</div> : rows.length === 0 ? (
          <div className="text-center py-16 bg-white border border-dashed border-gray-300 rounded-2xl text-sm text-gray-600">No schedules yet. Onboarding creates one per site, or add one with “New schedule”.</div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-600">
                <tr><th className="px-5 py-3">Organisation and site</th><th className="px-5 py-3">Schedule</th><th className="px-5 py-3">Next run</th><th className="px-5 py-3">Last run</th><th className="px-5 py-3">On</th><th className="px-5 py-3 w-24" /></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map(({ job, org, site, parsed, next, last }) => (
                  <tr key={job.name} className={job.enabled ? '' : 'bg-gray-50/60'}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className={`w-9 h-9 rounded-xl border flex items-center justify-center ${job.enabled ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}><Clock size={16} /></span>
                        <div>
                          <div className="font-semibold text-gray-900">{org?.display_name || 'Unassigned'}</div>
                          <div className="text-xs text-gray-500">{site?.batch_name || job.config_path.replace('configs/', '')}</div>
                        </div>
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
                        <button onClick={() => setModal({ job })} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100" aria-label="Edit"><Pencil size={15} /></button>
                        <button onClick={() => remove(job.name)} className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50" aria-label="Delete"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-gray-500">Times are server time. Next runs happen only while the pipeline scheduler service is running; this page cannot see its state yet. A paused schedule keeps its settings; turn it back on to resume.</p>
      </div>
      {modal && <JobModal job={modal.job} orgs={orgs} configs={configs} onSave={save} onClose={() => setModal(null)} />}
    </div>
  );
};

export default Scheduler;
