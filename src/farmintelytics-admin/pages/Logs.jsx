import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Activity, RefreshCw, X, AlertCircle, CheckCircle2, Clock,
  Loader2, AlertTriangle, Terminal, ChevronRight,
  FileText, Database, Server
} from 'lucide-react';
import { fetchLogs, fetchPipelineLogs } from '../../services/adminApi';
import ErrorBanner from '../components/ErrorBanner';

const STATUS_CFG = {
  pending:    { color: '#d97706', bg: 'rgba(217,119,6,0.08)',  border: 'rgba(217,119,6,0.2)',  icon: Clock },
  processing: { color: '#2563eb', bg: 'rgba(37,99,235,0.08)', border: 'rgba(37,99,235,0.2)', icon: Loader2 },
  completed:  { color: '#16a34a', bg: 'rgba(22,163,74,0.08)', border: 'rgba(22,163,74,0.2)',  icon: CheckCircle2 },
  failed:     { color: '#dc2626', bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.2)',  icon: AlertTriangle },
};

const getStatus = (s) => (STATUS_CFG[String(s).toLowerCase()] || STATUS_CFG.pending);

const StatusBadge = ({ status }) => {
  const cfg = getStatus(status);
  const Icon = cfg.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      fontSize: '11px', fontWeight: 800, padding: '3px 10px',
      borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.06em',
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
    }}>
      <Icon size={10} /> {status}
    </span>
  );
};

const SummaryCard = ({ icon: Icon, label, value, color }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '12px',
    background: '#ffffff', border: '1px solid #e2e8f0',
    borderRadius: '12px', padding: '14px 18px', flex: 1,
  }}>
    <div style={{
      width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
      background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={18} style={{ color }} />
    </div>
    <div>
      <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginTop: '2px' }}>{label}</div>
    </div>
  </div>
);

// Rows stay a fixed, compact height regardless of content length — full
// detail (including the raw JSON that used to grow the row inline) opens
// in a separate modal instead, so a long path or error message can never
// crowd/overlap a neighbouring row.
const PipelineLogRow = ({ log, idx, onOpen, highlighted }) => {
  const status = log.status || (log.error ? 'failed' : 'completed');
  const hasFailed = status === 'failed' || !!log.error;
  const path = log._minio_path || `Log #${idx + 1}`;
  const pathParts = path.split('/');

  return (
    <button
      onClick={() => onOpen(log, idx)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
        padding: '14px 16px', background: highlighted ? '#f1f5f9' : '#ffffff', cursor: 'pointer',
        textAlign: 'left', border: `1px solid ${hasFailed ? '#fca5a5' : '#e2e8f0'}`, borderRadius: '10px',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '280px' }}>
            {pathParts.slice(0, -1).join('/')}
          </span>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {pathParts[pathParts.length - 1]}
          </span>
          <StatusBadge status={status} />
          {log.job_name && (
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#7c3aed',
              background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)',
              padding: '2px 8px', borderRadius: '8px', flexShrink: 0 }}>
              {log.job_name}
            </span>
          )}
          {hasFailed && log.error && (
            <span style={{ fontSize: '11px', color: '#ef4444', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
              ✗ {log.error}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
          {log.duration != null && (
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>⏱ {log.duration}s</span>
          )}
          {log.timestamp && (
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              🕐 {new Date(log.timestamp).toLocaleString()}
            </span>
          )}
          {log.plots_processed != null && (
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>📍 {log.plots_processed} plots</span>
          )}
        </div>
      </div>
      <ChevronRight size={16} style={{ color: '#94a3b8', flexShrink: 0 }} />
    </button>
  );
};

const PipelineLogModal = ({ log, idx, onClose }) => {
  if (!log) return null;
  const status = log.status || (log.error ? 'failed' : 'completed');
  const hasFailed = status === 'failed' || !!log.error;
  const path = log._minio_path || `Log #${idx + 1}`;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '760px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Terminal size={16} color="#0f172a" />
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace', wordBreak: 'break-all', flex: 1 }}>{path}</div>
          <StatusBadge status={status} />
          <button onClick={onClose} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#475569', display: 'inline-flex' }}>
            <X size={13} />
          </button>
        </div>
        <div style={{ padding: '16px 20px', overflow: 'auto', flex: 1 }}>
          {hasFailed && log.error && (
            <div style={{ margin: '0 0 12px', padding: '10px 14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <AlertTriangle size={14} style={{ color: '#ef4444', flexShrink: 0, marginTop: '1px' }} />
              <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#ef4444', wordBreak: 'break-all' }}>{log.error}</span>
            </div>
          )}
          <pre style={{
            color: '#475569', fontSize: '11.5px', fontFamily: 'monospace', margin: 0,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px',
          }}>
            {JSON.stringify(
              Object.fromEntries(Object.entries(log).filter(([k]) => k !== '_minio_path')),
              null, 2
            )}
          </pre>
        </div>
      </div>
    </div>
  );
};

const Logs = () => {
  const location = useLocation();
  // Arriving from the MinIO explorer's "Open in Logs" action lands directly
  // on the structured pipeline tab instead of the raw JSON that file holds.
  const [activeTab, setActiveTab] = useState(location.state?.tab === 'pipeline' ? 'pipeline' : 'jobs');
  const [highlightKey] = useState(location.state?.highlightKey || '');
  const [jobs, setJobs] = useState([]);
  const [pipelineLogs, setPipelineLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pipelineStatusFilter, setPipelineStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [expandedJob, setExpandedJob] = useState(null);
  const [openLog, setOpenLog] = useState(null);
  const autoRefreshRef = useRef(null);

  const loadJobs = async () => {
    try {
      const data = await fetchLogs({ status: statusFilter || undefined, page });
      setJobs(data.items || []);
      setTotal(data.total || 0);
    } catch (e) { setError(e.message); }
  };

  // Each execution_logs file can unwrap into several rows (daily digests are
  // arrays), so a "limit" of even 20 files can render ~100 rows in one go.
  // Start small and let the admin explicitly ask for more instead of always
  // fetching+rendering everything.
  const PIPELINE_LOGS_PAGE_SIZE = 10;
  const [pipelineLimit, setPipelineLimit] = useState(PIPELINE_LOGS_PAGE_SIZE);
  const [pipelineLoadingMore, setPipelineLoadingMore] = useState(false);

  const loadPipeline = async (limit = pipelineLimit) => {
    try {
      const data = await fetchPipelineLogs(undefined, limit);
      setPipelineLogs(data.logs || []);
    } catch (e) { setError(e.message); }
  };

  const loadMorePipeline = async () => {
    setPipelineLoadingMore(true);
    const next = pipelineLimit + PIPELINE_LOGS_PAGE_SIZE;
    await loadPipeline(next);
    setPipelineLimit(next);
    setPipelineLoadingMore(false);
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadJobs(), loadPipeline(pipelineLimit)]);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, [statusFilter, page]);
  useEffect(() => {
    autoRefreshRef.current = setInterval(loadAll, 30000);
    return () => clearInterval(autoRefreshRef.current);
  }, [statusFilter, page]);

  const failedJobs = jobs.filter(j => j.status === 'failed').length;
  const completedJobs = jobs.filter(j => j.status === 'completed').length;
  const processingJobs = jobs.filter(j => j.status === 'processing').length;
  const failedPipeline = pipelineLogs.filter(l => (l.status || '').toLowerCase() === 'failed' || !!l.error).length;
  const pipelineLogStatus = (l) => (l.status || (l.error ? 'failed' : 'completed')).toLowerCase();
  const filteredPipelineLogs = pipelineStatusFilter
    ? pipelineLogs.filter(l => pipelineLogStatus(l) === pipelineStatusFilter)
    : pipelineLogs;

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ color: '#0f172a', fontSize: '20px', fontWeight: 800, margin: 0 }}>System Logs</h2>
          <p style={{ color: '#64748b', fontSize: '12px', fontWeight: 600, margin: '4px 0 0' }}>
            Pipeline job history and MinIO execution audit logs — auto-refreshes every 30s
          </p>
        </div>
        <button onClick={loadAll} style={{
          display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
          background: '#0f172a', border: 'none', borderRadius: '10px',
          color: '#ffffff', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
        }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <SummaryCard icon={Database} label="Total Jobs" value={total.toLocaleString()} color="#0f172a" />
        <SummaryCard icon={CheckCircle2} label="Completed" value={completedJobs} color="#16a34a" />
        <SummaryCard icon={Loader2} label="Processing" value={processingJobs} color="#2563eb" />
        <SummaryCard icon={AlertTriangle} label="Failed Jobs" value={failedJobs} color="#dc2626" />
        <SummaryCard icon={Terminal} label="Failed Pipeline Runs" value={failedPipeline} color="#7c3aed" />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
        {[
          { key: 'jobs', label: 'Pipeline Jobs', icon: Database },
          { key: 'pipeline', label: 'Execution & Audit Logs', icon: Terminal },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            background: activeTab === key ? '#0f172a' : 'transparent',
            color: activeTab === key ? '#ffffff' : '#6b7280',
            fontSize: '12px', fontWeight: 700, transition: 'all 0.15s',
          }}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      <ErrorBanner message={error} onDismiss={() => setError('')} onRetry={loadAll} />

      {/* Jobs Tab */}
      {activeTab === 'jobs' && (
        <>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {['', 'pending', 'processing', 'completed', 'failed'].map(s => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} style={{
                padding: '6px 16px', borderRadius: '20px', border: '1px solid',
                fontSize: '11px', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase',
                letterSpacing: '0.05em', transition: 'all 0.15s',
                background: statusFilter === s ? (s ? getStatus(s || 'pending').color : '#0f172a') : '#ffffff',
                color: statusFilter === s ? '#ffffff' : (s ? getStatus(s).color : '#475569'),
                borderColor: s ? getStatus(s).border : (statusFilter === s ? '#0f172a' : '#e2e8f0'),
              }}>
                {s || 'All'}
              </button>
            ))}
            <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600, marginLeft: 'auto' }}>
              {total.toLocaleString()} total jobs
            </span>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr 120px 130px 100px 160px 1fr', padding: '10px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['ID', 'Plot', 'Sensor', 'Status', 'Date', 'Completed At', 'Error Detail'].map(h => (
                <span key={h} style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</span>
              ))}
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Loader2 size={16} className="animate-spin" /> Loading jobs…
              </div>
            ) : jobs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>No jobs found</div>
            ) : (
              <div style={{ overflowY: 'auto', maxHeight: '420px' }}>
                {jobs.map(job => (
                  <div key={job.id}>
                    <div
                      onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                      style={{
                        display: 'grid', gridTemplateColumns: '56px 1fr 120px 130px 100px 160px 1fr',
                        padding: '12px 16px', borderBottom: '1px solid #f1f5f9',
                        alignItems: 'center', cursor: 'pointer',
                        background: job.status === 'failed' ? 'rgba(220,38,38,0.025)' : 'transparent',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = job.status === 'failed' ? 'rgba(220,38,38,0.05)' : '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = job.status === 'failed' ? 'rgba(220,38,38,0.025)' : 'transparent'}
                    >
                      <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 700 }}>#{job.id}</span>
                      <span style={{ color: '#1e293b', fontSize: '12px', fontWeight: 600 }}>{job.plot_id ? `Plot #${job.plot_id}` : '—'}</span>
                      <span style={{ color: '#64748b', fontSize: '11px', fontFamily: 'monospace' }}>{job.sensor || '—'}</span>
                      <StatusBadge status={job.status} />
                      <span style={{ color: '#64748b', fontSize: '11px' }}>{job.start_date || '—'}</span>
                      <span style={{ color: '#64748b', fontSize: '11px' }}>{job.completed_at ? new Date(job.completed_at).toLocaleString() : '—'}</span>
                      <span style={{
                        color: '#ef4444', fontSize: '11px', fontFamily: 'monospace',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }} title={job.error}>
                        {job.error ? <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><AlertTriangle size={11} /> {job.error}</span> : <span style={{ color: '#16a34a' }}>✓ OK</span>}
                      </span>
                    </div>
                    {expandedJob === job.id && job.error && (
                      <div style={{
                        padding: '12px 16px 14px', background: 'rgba(220,38,38,0.04)',
                        borderBottom: '1px solid rgba(220,38,38,0.15)',
                      }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#dc2626', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          ✗ Error Traceback
                        </div>
                        <pre style={{
                          fontSize: '11px', fontFamily: 'monospace', color: '#7f1d1d',
                          background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)',
                          borderRadius: '8px', padding: '10px 14px', margin: 0,
                          whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: '200px', overflowY: 'auto',
                        }}>
                          {job.error}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ padding: '6px 14px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#475569', cursor: page <= 1 ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 700, opacity: page <= 1 ? 0.4 : 1 }}>← Prev</button>
            <span style={{ color: '#475569', fontSize: '12px', fontWeight: 600 }}>Page {page} of {Math.ceil(total / 50) || 1}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={jobs.length < 50} style={{ padding: '6px 14px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#475569', cursor: jobs.length < 50 ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 700, opacity: jobs.length < 50 ? 0.4 : 1 }}>Next →</button>
          </div>
        </>
      )}

      {/* Pipeline Execution Logs Tab */}
      {activeTab === 'pipeline' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {['', 'pending', 'processing', 'completed', 'failed'].map(s => (
              <button key={s} onClick={() => setPipelineStatusFilter(s)} style={{
                padding: '6px 16px', borderRadius: '20px', border: '1px solid',
                fontSize: '11px', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase',
                letterSpacing: '0.05em', transition: 'all 0.15s',
                background: pipelineStatusFilter === s ? (s ? getStatus(s || 'pending').color : '#0f172a') : '#ffffff',
                color: pipelineStatusFilter === s ? '#ffffff' : (s ? getStatus(s).color : '#475569'),
                borderColor: s ? getStatus(s).border : (pipelineStatusFilter === s ? '#0f172a' : '#e2e8f0'),
              }}>
                {s || 'All'}
              </button>
            ))}
            <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600, marginLeft: 'auto' }}>
              {filteredPipelineLogs.length.toLocaleString()} of {pipelineLogs.length.toLocaleString()} loaded
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Loader2 size={16} /> Loading execution logs…
            </div>
          ) : pipelineLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
              <FileText size={36} style={{ marginBottom: '12px', opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>No execution logs found in MinIO</p>
              <p style={{ margin: '4px 0 0', fontSize: '11px' }}>Logs appear under <code>execution_logs/</code> after a pipeline run</p>
            </div>
          ) : filteredPipelineLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>No {pipelineStatusFilter} logs in the loaded set</p>
              <p style={{ margin: '4px 0 0', fontSize: '11px' }}>Try "Load More" or clear the filter</p>
            </div>
          ) : (
            <>
              {filteredPipelineLogs.map((log, i) => <PipelineLogRow key={i} log={log} idx={i} onOpen={(l, idx) => setOpenLog({ log: l, idx })} highlighted={!!highlightKey && log._minio_path === highlightKey} />)}
              {pipelineLogs.length >= pipelineLimit && (
                <button
                  onClick={loadMorePipeline}
                  disabled={pipelineLoadingMore}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    padding: '10px', marginTop: '4px',
                    borderRadius: '10px', border: '1px solid #e2e8f0',
                    background: '#ffffff', color: '#334155',
                    fontSize: '12px', fontWeight: 700, cursor: pipelineLoadingMore ? 'default' : 'pointer',
                  }}
                >
                  {pipelineLoadingMore ? <Loader2 size={14} className="animate-spin" /> : null}
                  {pipelineLoadingMore ? 'Loading…' : 'Load More'}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {openLog && <PipelineLogModal log={openLog.log} idx={openLog.idx} onClose={() => setOpenLog(null)} />}
    </div>
  );
};

export default Logs;
