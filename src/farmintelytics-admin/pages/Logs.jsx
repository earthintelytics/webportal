import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { RefreshCw, Search, ChevronRight } from 'lucide-react';
import { fetchLogs, fetchPipelineLogs } from '../../services/adminApi';
import ErrorBanner from '../components/ErrorBanner';
import { inputCls } from '../components/formHelpers';
import { Page, Button, Chip, Pill, Tabs, Stat, Loading, Empty } from '../components/ui';
import JobsTable from './logs/JobsTable';
import RunLogModal from './logs/RunLogModal';
import ErrorBox from './logs/ErrorBox';
import { statusOf, logStatus, fmtTime } from './logs/logHelpers';

const JOB_PAGE = 50;
const RUN_PAGE = 25;
const REFRESH_MS = 30000;

/**
 * Logs: pipeline runs (what each scheduled run did, from its run record)
 * and imagery jobs in the database. Refreshes every 30 seconds.
 */
const Logs = () => {
  const location = useLocation();
  const [tab, setTab] = useState(location.state?.tab === 'jobs' ? 'jobs' : 'runs');
  const highlightKey = location.state?.highlightKey || '';
  const [jobs, setJobs] = useState([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [jobStatus, setJobStatus] = useState('');
  const [jobSearch, setJobSearch] = useState('');
  const [page, setPage] = useState(1);
  const [runs, setRuns] = useState([]);
  const [runStatus, setRunStatus] = useState('');
  const [runSearch, setRunSearch] = useState('');
  const [runLimit, setRunLimit] = useState(RUN_PAGE);
  const [openRun, setOpenRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadJobs = async () => {
    try {
      const data = await fetchLogs({ status: jobStatus || undefined, search: jobSearch || undefined, page, pageSize: JOB_PAGE });
      setJobs(data.items || []); setTotalJobs(data.total || 0);
    } catch (e) { setError(e.message || 'Could not load jobs'); }
  };
  const loadRuns = async (limit = runLimit) => {
    try { const data = await fetchPipelineLogs(undefined, limit); setRuns(data.logs || []); } catch (e) { setError(e.message || 'Could not load run records'); }
  };
  const loadAll = async () => { setLoading(true); setError(''); await Promise.all([loadJobs(), loadRuns()]); setLoading(false); };

  useEffect(() => { loadAll(); }, [jobStatus, jobSearch, page]); // eslint-disable-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => {
    const t = setInterval(() => { loadJobs(); loadRuns(); }, REFRESH_MS);
    return () => clearInterval(t);
  }, [jobStatus, jobSearch, page, runLimit]); // eslint-disable-line react-hooks/exhaustive-deps

  const shownRuns = useMemo(() => {
    const q = runSearch.toLowerCase();
    return runs.filter((l) => (!runStatus || logStatus(l) === runStatus)
      && (!q || [l._minio_path, l.job_name, l.error, l.message].some((v) => (v || '').toLowerCase().includes(q))));
  }, [runs, runStatus, runSearch]);
  const failedRuns = runs.filter((l) => logStatus(l) === 'failed').length;
  const failedJobs = jobs.filter((j) => (j.status || '').toLowerCase() === 'failed' || j.error).length;
  const lastRun = runs[0];

  return (
    <Page
      wide
      eyebrow="Operations"
      title="Logs"
      text="What each pipeline run did and any errors, plus the imagery jobs recorded per block. Refreshes every 30 seconds."
      actions={<Button variant="secondary" onClick={loadAll}><RefreshCw size={15} className={loading ? 'animate-spin' : ''} />Refresh</Button>}
    >
      <ErrorBanner message={error} onDismiss={() => setError('')} onRetry={loadAll} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Last run" value={lastRun ? statusOf(logStatus(lastRun))[0] : '—'} sub={lastRun ? fmtTime(lastRun.timestamp) : 'No run recorded yet'} />
        <Stat label="Runs that failed" value={failedRuns} sub={`of ${runs.length} loaded`} />
        <Stat label="Imagery jobs" value={totalJobs.toLocaleString()} />
        <Stat label="Jobs that failed" value={failedJobs} sub="on this page" />
      </div>

      <Tabs value={tab} onChange={setTab} tabs={[
        { id: 'runs', label: 'Pipeline runs', count: runs.length },
        { id: 'jobs', label: 'Imagery jobs', count: totalJobs },
      ]} />

      {tab === 'runs' ? (
        <>
          <div className="flex flex-wrap items-center gap-3">
            {[['', 'All'], ['completed', 'Done'], ['failed', 'Failed']].map(([v, l]) => <Chip key={v} on={runStatus === v} onClick={() => setRunStatus(v)}>{l}</Chip>)}
            <label className="relative ml-auto w-full sm:w-80">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className={`${inputCls} pl-10`} value={runSearch} onChange={(e) => setRunSearch(e.target.value)} placeholder="Job, file or error" />
            </label>
          </div>
          {loading ? <Loading>Reading run records…</Loading> : runs.length === 0 ? (
            <Empty>No run records yet. Each pipeline run writes one when it finishes.</Empty>
          ) : shownRuns.length === 0 ? <Empty>No runs match.</Empty> : (
            <div className="space-y-2.5">
              {shownRuns.map((log, i) => {
                const st = logStatus(log);
                const [label, tone] = statusOf(st);
                const highlighted = highlightKey && log._minio_path === highlightKey;
                return (
                  <button key={log._minio_path || i} type="button" onClick={() => setOpenRun(log)}
                    className={`w-full text-left bg-white rounded-2xl border px-5 py-4 space-y-2 hover:border-gray-300 ${highlighted ? 'border-sky-500' : st === 'failed' ? 'border-red-200' : 'border-gray-200'}`}>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-semibold text-gray-900">{log.job_name || (log._minio_path || '').split('/').pop()}</span>
                      <Pill tone={tone}>{label}</Pill>
                      <span className="ml-auto flex items-center gap-1 text-xs text-gray-500">{fmtTime(log.timestamp)}<ChevronRight size={15} /></span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      {log.duration != null && <span>Took {Number(log.duration).toFixed(1)} s</span>}
                      {log.plots_processed != null && <span>{log.plots_processed} blocks</span>}
                      {log.message && <span className="text-gray-700 truncate max-w-md">{log.message}</span>}
                      <span className="font-mono truncate max-w-md">{log._minio_path}</span>
                    </div>
                    {log.error && <ErrorBox error={log.error} compact />}
                  </button>
                );
              })}
              {runs.length >= runLimit && (
                <Button variant="secondary" className="w-full" onClick={async () => { const next = runLimit + RUN_PAGE; await loadRuns(next); setRunLimit(next); }}>Load more ({runs.length} loaded)</Button>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            {[['', 'All'], ['pending', 'Waiting'], ['processing', 'Running'], ['completed', 'Done'], ['failed', 'Failed']].map(([v, l]) => <Chip key={v} on={jobStatus === v} onClick={() => { setJobStatus(v); setPage(1); }}>{l}</Chip>)}
            <label className="relative ml-auto w-full sm:w-80">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className={`${inputCls} pl-10`} value={jobSearch} onChange={(e) => { setJobSearch(e.target.value); setPage(1); }} placeholder="Block or error" />
            </label>
          </div>
          {loading ? <Loading>Loading jobs…</Loading> : <JobsTable jobs={jobs} />}
          {totalJobs > JOB_PAGE && (
            <div className="flex items-center justify-end gap-3 text-sm text-gray-600">
              <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <span>Page {page} of {Math.ceil(totalJobs / JOB_PAGE)}</span>
              <Button variant="secondary" disabled={jobs.length < JOB_PAGE} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          )}
        </>
      )}

      {openRun && <RunLogModal log={openRun} onClose={() => setOpenRun(null)} />}
    </Page>
  );
};

export default Logs;
