import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, RotateCcw } from 'lucide-react';
import { fetchAdminJobs, retryAdminJob, fetchOrganizations } from '../../services/adminApi';
import ErrorBanner from '../components/ErrorBanner';
import { inputCls } from '../components/formHelpers';
import { Page, Button, IconButton, Chip, Pill, Table, Td, Empty, Loading, Stat, Note } from '../components/ui';

const KINDS = {
  monitoring_run: 'Satellite monitoring', suitability_run: 'Suitability analysis', boundary_ingest: 'Boundary upload',
  dataset_ingest: 'Farm data upload', report_build: 'Report', eudr_check: 'EUDR check', parcel_check: 'Parcel check', drone_process: 'Drone survey',
};
const STATUS = { queued: ['Waiting', 'warning'], running: ['Running', 'info'], done: ['Done', 'good'], completed: ['Done', 'good'], failed: ['Failed', 'critical'] };
const LIVE_MS = 10000;
const fmt = (t) => (t ? new Date(t).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');
const took = (a, b) => { if (!a || !b) return '—'; const s = Math.round((new Date(b) - new Date(a)) / 1000); return s < 90 ? `${s} s` : `${Math.round(s / 60)} min`; };

/**
 * Pipeline runs: every job the backend has sent to the pipeline, for every
 * organisation, with its live status, step and outputs (G27). Refreshes every
 * 10 seconds while anything is waiting or running.
 */
const PipelineRuns = () => {
  const [jobs, setJobs] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [company, setCompany] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [offline, setOffline] = useState(false);
  const [open, setOpen] = useState(null);

  const load = async () => {
    try { setJobs(await fetchAdminJobs({ companyId: company, status })); setError(''); setOffline(false); } catch (e) {
      if (e.code === 'NOT_CONNECTED') setOffline(true); else setError(e.message);
    } finally { setLoading(false); }
  };
  useEffect(() => { fetchOrganizations().then((o) => setOrgs(Array.isArray(o) ? o : o?.items || [])).catch(() => {}); }, []);
  useEffect(() => { setLoading(true); load(); }, [company, status]); // eslint-disable-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  const active = jobs.some((j) => ['queued', 'running'].includes(j.status));
  useEffect(() => {
    if (!active) return undefined;
    const t = setInterval(load, LIVE_MS);
    return () => clearInterval(t);
  }, [active, company, status]); // eslint-disable-line react-hooks/exhaustive-deps

  const retry = async (id) => { try { await retryAdminJob(id); await load(); } catch (e) { setError(e.message); } };
  const orgName = (id) => orgs.find((o) => o.schema_name === id)?.display_name || id;
  const counts = useMemo(() => jobs.reduce((c, j) => ({ ...c, [j.status]: (c[j.status] || 0) + 1 }), {}), [jobs]);

  return (
    <Page
      wide
      eyebrow="Operations"
      title="Pipeline runs"
      text="Every job sent to the pipeline: monitoring, suitability, uploads, checks and reports, for every organisation, with its live status. A job is done only when its results are stored."
      actions={<Button variant="secondary" onClick={load}><RefreshCw size={15} className={loading ? 'animate-spin' : ''} />Refresh</Button>}
    >
      <ErrorBanner message={error} onDismiss={() => setError('')} onRetry={load} />

      {offline ? (
        <Note>The pipeline jobs service is not running on this server yet, so runs cannot be listed here. It goes live with the jobs update (G27, deployed by G43). The Monitoring schedule still shows each schedule's last run.</Note>
      ) : (<>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Waiting" value={counts.queued || 0} />
        <Stat label="Running" value={counts.running || 0} />
        <Stat label="Done" value={(counts.done || 0) + (counts.completed || 0)} />
        <Stat label="Failed" value={counts.failed || 0} sub={counts.failed ? 'Open a row to see why' : null} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {[['', 'All'], ['queued', 'Waiting'], ['running', 'Running'], ['done', 'Done'], ['failed', 'Failed']].map(([v, l]) => <Chip key={v} on={status === v} onClick={() => setStatus(v)}>{l}</Chip>)}
        <select className={`${inputCls} w-auto ml-auto`} value={company} onChange={(e) => setCompany(e.target.value)} aria-label="Organisation">
          <option value="">All organisations</option>
          {orgs.map((o) => <option key={o.schema_name} value={o.schema_name}>{o.display_name}</option>)}
        </select>
      </div>

      {loading && !jobs.length ? <Loading>Loading runs…</Loading> : jobs.length === 0 ? (
        <Empty>No runs yet. Start one with “Run now” on the Monitoring schedule, or from a client action such as a suitability analysis.</Empty>
      ) : (
        <Table columns={[{ label: 'What' }, { label: 'Organisation' }, { label: 'Status' }, { label: 'Step' }, { label: 'Started' }, { label: 'Took' }, { label: '', className: 'w-14' }]}>
          {jobs.map((j) => {
            const [label, tone] = STATUS[j.status] || [j.status, 'neutral'];
            const isOpen = open === j.id;
            return [
              <tr key={j.id} onClick={() => setOpen(isOpen ? null : j.id)} className={`cursor-pointer ${j.status === 'failed' ? 'bg-red-50/40 hover:bg-red-50' : 'hover:bg-gray-50'}`}>
                <Td><p className="font-semibold text-gray-900">{KINDS[j.kind] || j.kind}</p>{j.farm_id && <p className="text-xs text-gray-500">{j.farm_id}</p>}</Td>
                <Td className="text-gray-700">{orgName(j.company_id)}</Td>
                <Td><Pill tone={tone}>{label}{j.status === 'running' && j.progress != null ? ` · ${j.progress}%` : ''}</Pill></Td>
                <Td className="text-gray-600">{j.step || '—'}</Td>
                <Td className="text-xs text-gray-600">{fmt(j.started_at || j.created_at)}</Td>
                <Td className="text-xs text-gray-600 font-mono">{took(j.started_at, j.finished_at)}</Td>
                <Td>{j.status === 'failed' && <IconButton label="Run again" onClick={(e) => { e.stopPropagation(); retry(j.id); }}><RotateCcw size={15} /></IconButton>}</Td>
              </tr>,
              isOpen && (
                <tr key={`${j.id}-detail`}>
                  <td colSpan={7} className="px-5 py-4 bg-gray-50 space-y-2 text-sm">
                    {j.error && <p className="text-red-800 font-mono text-xs whitespace-pre-wrap">{j.error}</p>}
                    <p className="text-gray-600">Results: {(j.outputs || []).length ? (j.outputs || []).map((o) => <code key={o} className="mr-2 text-xs">{o}</code>) : 'none stored'}</p>
                    <p className="text-xs text-gray-500">Job {j.id} · asked by {j.created_by || 'schedule'} · {fmt(j.created_at)}</p>
                  </td>
                </tr>
              ),
            ];
          })}
        </Table>
      )}
      </>)}
    </Page>
  );
};

export default PipelineRuns;
