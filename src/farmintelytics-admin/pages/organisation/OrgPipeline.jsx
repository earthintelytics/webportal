import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import { fetchSchedulerJobs, fetchAdminJobs, runSchedulerJob, fetchMinioInventory } from '../../../services/adminApi';
import { scheduleText, parseCron, nextRun } from '../../components/schedule';
import { formatSize } from '../inventory/inventoryHelpers';
import { Pill, Note, Loading } from '../../components/ui';

const STATUS = { queued: ['Waiting', 'warning'], running: ['Running', 'info'], done: ['Done', 'good'], completed: ['Done', 'good'], failed: ['Failed', 'critical'] };
const KINDS = { monitoring_run: 'Satellite monitoring', suitability_run: 'Suitability', boundary_ingest: 'Boundary upload', dataset_ingest: 'Farm data', report_build: 'Report', eudr_check: 'EUDR check', parcel_check: 'Parcel check', drone_process: 'Drone survey' };
const fmt = (t) => (t ? new Date(t).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');

/**
 * The organisation's data pipeline in one view: its schedules (with Run now),
 * its latest runs, and what it stores. Details live on Monitoring schedule,
 * Pipeline runs and Storage.
 */
const OrgPipeline = ({ org }) => {
  const [schedules, setSchedules] = useState(null);
  const [jobs, setJobs] = useState(null);
  const [storage, setStorage] = useState(null);
  const [errors, setErrors] = useState([]);
  const [started, setStarted] = useState({});
  const id = org.schema_name;

  const load = useCallback(() => {
    const fail = (what) => (e) => setErrors((x) => [...x, `${what}: ${e.message}`]);
    fetchSchedulerJobs().then((all) => setSchedules((all || []).filter((j) => j.name.startsWith(id) || (j.config_path || '').includes(id)))).catch(fail('Schedules'));
    fetchAdminJobs({ companyId: id, limit: 10 }).then((j) => setJobs(Array.isArray(j) ? j : [])).catch((e) => { setJobs([]); fail('Runs')(e); });
    fetchMinioInventory(id).then((m) => setStorage(m?.items || [])).catch(fail('Storage'));
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const used = useMemo(() => (storage || []).reduce((a, f) => a + (f.size_bytes || 0), 0), [storage]);
  const runNow = async (name) => {
    try { await runSchedulerJob(name); setStarted((s) => ({ ...s, [name]: true })); load(); } catch (e) { setErrors((x) => [...x, `Run now: ${e.message}`]); }
  };

  return (
    <div className="space-y-6">
      {errors.length > 0 && <Note tone="warning">{errors.join(' · ')}</Note>}

      <section className="space-y-2">
        <div className="flex items-center justify-between"><p className="text-sm font-semibold text-gray-800">Schedules</p><Link to="/admin/scheduler" className="text-xs font-medium text-green-700">All schedules</Link></div>
        {schedules == null ? <Loading /> : schedules.length === 0 ? <p className="text-sm text-gray-500">No schedule. Onboarding creates one per estate, or add one on Monitoring schedule.</p> : (
          <ul className="divide-y divide-gray-100 border border-gray-200 rounded-xl bg-white">
            {schedules.map((s) => {
              const next = s.enabled ? nextRun(s.cron) : null;
              return (
                <li key={s.name} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{(s.config_path || s.name).replace('configs/', '')}</p>
                    <p className="text-xs text-gray-500">{scheduleText(parseCron(s.cron))}{s.enabled ? ` · next ${fmt(next)}` : ' · paused'}</p>
                  </div>
                  {started[s.name] ? <Pill tone="info">Started</Pill> : (
                    <button type="button" onClick={() => runNow(s.name)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"><Play size={13} />Run now</button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between"><p className="text-sm font-semibold text-gray-800">Latest runs</p><Link to="/admin/runs" className="text-xs font-medium text-green-700">All runs</Link></div>
        {jobs == null ? <Loading /> : jobs.length === 0 ? <p className="text-sm text-gray-500">No runs recorded yet.</p> : (
          <ul className="divide-y divide-gray-100 border border-gray-200 rounded-xl bg-white">
            {jobs.map((j) => {
              const [label, tone] = STATUS[j.status] || [j.status, 'neutral'];
              return (
                <li key={j.id} className="px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0"><p className="text-gray-900">{KINDS[j.kind] || j.kind}{j.farm_id ? ` · ${j.farm_id}` : ''}</p><p className="text-xs text-gray-500">{fmt(j.created_at)}{j.error ? ` · ${j.error.slice(0, 80)}` : ''}</p></div>
                  <Pill tone={tone}>{label}</Pill>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between"><p className="text-sm font-semibold text-gray-800">Stored data</p><Link to="/admin/inventory" className="text-xs font-medium text-green-700">Storage</Link></div>
        <p className="text-sm text-gray-700">{storage == null ? 'Loading…' : `${storage.length.toLocaleString()} files · ${formatSize(used)}`}</p>
      </section>
    </div>
  );
};

export default OrgPipeline;
