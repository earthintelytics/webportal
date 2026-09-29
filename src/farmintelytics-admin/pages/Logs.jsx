import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Activity, RefreshCw, X, AlertCircle, CheckCircle2, Clock,
  Loader2, AlertTriangle, Terminal, ChevronRight, ChevronDown,
  FileText, Database, Copy, Check, Search, Filter, Eye, ArrowUpRight
} from 'lucide-react';
import { fetchLogs, fetchPipelineLogs } from '../../services/adminApi';
import ErrorBanner from '../components/ErrorBanner';

const STATUS_CFG = {
  pending:    { color: '#d97706', bg: '#fef3c7', border: '#fde68a', icon: Clock },
  processing: { color: '#2563eb', bg: '#dbeafe', border: '#bfdbfe', icon: Loader2 },
  completed:  { color: '#16a34a', bg: '#dcfce7', border: '#bbf7d0', icon: CheckCircle2 },
  failed:     { color: '#dc2626', bg: '#fee2e2', border: '#fecaca', icon: AlertTriangle },
};

const getStatus = (s) => (STATUS_CFG[String(s || 'pending').toLowerCase()] || STATUS_CFG.pending);

const StatusBadge = ({ status }) => {
  const cfg = getStatus(status);
  const Icon = cfg.icon;
  const isSpinning = String(status).toLowerCase() === 'processing';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      fontSize: '11px', fontWeight: 600, padding: '3px 10px',
      borderRadius: '20px', letterSpacing: '0',
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
      flexShrink: 0,
    }}>
      <Icon size={11} className={isSpinning ? 'animate-spin' : ''} /> {status || 'Unknown'}
    </span>
  );
};

const SummaryCard = ({ icon: Icon, label, value, color }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '14px',
    background: '#ffffff', border: '1px solid #e2e8f0',
    borderRadius: '14px', padding: '14px 20px', flex: 1, minWidth: '160px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
  }}>
    <div style={{
      width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
      background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={20} style={{ color }} />
    </div>
    <div>
      <div style={{ fontSize: '22px', fontWeight: 600, color: '#0f172a', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginTop: '3px', letterSpacing: '0.04em' }}>{label}</div>
    </div>
  </div>
);

// Helper to parse complex Python tracebacks or JSON errors into clean, readable pieces
function parseErrorString(raw) {
  if (!raw) return { title: '', detail: '', fullText: '' };
  let text = String(raw).trim();

  // If JSON string, extract message
  if ((text.startsWith('{') && text.endsWith('}')) || (text.startsWith('[') && text.endsWith(']'))) {
    try {
      const parsed = JSON.parse(text);
      if (parsed.message) text = parsed.message;
      else if (parsed.error) text = typeof parsed.error === 'string' ? parsed.error : JSON.stringify(parsed.error);
      else if (parsed.detail) text = typeof parsed.detail === 'string' ? parsed.detail : JSON.stringify(parsed.detail);
    } catch {
      // keep text
    }
  }

  const lines = text.split(/\r?\n/).map(l => l.trimEnd()).filter(Boolean);
  if (lines.length === 0) return { title: text, detail: text, fullText: text };

  // Check if traceback
  let title = lines[lines.length - 1];
  for (let i = lines.length - 1; i >= 0; i--) {
    const l = lines[i];
    if (l.includes('Error:') || l.includes('Exception:') || l.includes('HTTP ') || l.includes('Failed:')) {
      title = l;
      break;
    }
  }

  return {
    title: title.replace(/^Traceback.*$/i, '').trim() || lines[lines.length - 1] || text,
    detail: text,
    fullText: text,
    isMultiLine: lines.length > 1,
  };
}

// Visual error inspector with copy and line formatting
const ErrorInspector = ({ error, compact = false }) => {
  const [copied, setCopied] = useState(false);
  const parsed = parseErrorString(error);
  if (!parsed.title && !parsed.detail) return null;

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(parsed.fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (compact) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px',
        background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px',
        color: '#b91c1c', fontSize: '11px', fontFamily: 'var(--font-mono)', maxWidth: '100%',
      }}>
        <AlertTriangle size={13} style={{ color: '#dc2626', flexShrink: 0 }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontWeight: 600 }}>
          {parsed.title}
        </span>
        <button
          onClick={handleCopy}
          title="Copy error"
          style={{
            background: '#ffffff', border: '1px solid #fca5a5', borderRadius: '4px',
            padding: '2px 6px', cursor: 'pointer', color: '#b91c1c', fontSize: '10px',
            display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0, fontWeight: 700,
          }}
        >
          {copied ? <Check size={10} color="#16a34a" /> : <Copy size={10} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    );
  }

  return (
    <div style={{
      background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '12px',
      overflow: 'hidden', margin: '8px 0',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', background: '#ffe4e6', borderBottom: '1px solid #fecdd3',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={15} style={{ color: '#e11d48' }} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#9f1239', letterSpacing: '0.02em' }}>
            {parsed.title}
          </span>
        </div>
        <button
          onClick={handleCopy}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px', background: '#ffffff',
            border: '1px solid #fca5a5', borderRadius: '6px', padding: '4px 10px',
            cursor: 'pointer', color: '#9f1239', fontSize: '11px', fontWeight: 700,
          }}
        >
          {copied ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
          {copied ? 'Copied Full Error' : 'Copy Error'}
        </button>
      </div>

      <div style={{ padding: '12px 14px', background: '#0f172a', overflowX: 'auto', maxHeight: '240px' }}>
        <pre style={{
          margin: 0, fontSize: '11.5px', fontFamily: 'var(--font-mono)',
          color: '#fca5a5', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {parsed.fullText}
        </pre>
      </div>
    </div>
  );
};

// MinIO Log Row
const PipelineLogRow = ({ log, idx, onOpen, highlighted }) => {
  const status = log.status || (log.error ? 'failed' : 'completed');
  const hasFailed = status === 'failed' || !!log.error;
  const path = log._minio_path || `Log #${idx + 1}`;
  const pathParts = path.split('/');
  const filename = pathParts[pathParts.length - 1];
  const folder = pathParts.slice(0, -1).join('/');

  return (
    <div
      onClick={() => onOpen(log, idx)}
      style={{
        display: 'flex', flexDirection: 'column', gap: '8px',
        padding: '14px 18px', background: highlighted ? '#f8fafc' : '#ffffff', cursor: 'pointer',
        border: `1px solid ${highlighted ? '#2563eb' : (hasFailed ? '#fecaca' : '#e2e8f0')}`,
        borderRadius: '12px', transition: 'all 0.15s ease',
        boxShadow: highlighted ? 'inset 0 0 0 1px var(--status-info)' : 'none',
      }}
      onMouseEnter={e => {
        if (!highlighted) e.currentTarget.style.borderColor = hasFailed ? '#f87171' : '#cbd5e1';
      }}
      onMouseLeave={e => {
        if (!highlighted) e.currentTarget.style.borderColor = hasFailed ? '#fecaca' : '#e2e8f0';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <Terminal size={15} style={{ color: hasFailed ? '#dc2626' : '#64748b', flexShrink: 0 }} />
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', fontFamily: 'var(--font-mono)' }}>
          {folder ? `${folder}/` : ''}
        </span>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
          {filename}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {log.job_name && (
            <span style={{
              fontSize: '11px', fontWeight: 700, color: '#6d28d9',
              background: '#f5f3ff', border: '1px solid #ddd6fe',
              padding: '2px 8px', borderRadius: '6px',
            }}>
              {log.job_name}
            </span>
          )}
          <StatusBadge status={status} />
          <ChevronRight size={16} style={{ color: '#94a3b8' }} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', color: '#64748b', fontSize: '11.5px' }}>
        {log.timestamp && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} /> {new Date(log.timestamp).toLocaleString()}
          </span>
        )}
        {log.duration != null && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            ⏱ {typeof log.duration === 'number' ? `${log.duration.toFixed(1)}s` : `${log.duration}s`}
          </span>
        )}
        {log.plots_processed != null && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            📍 {log.plots_processed} plots
          </span>
        )}
        {log.message && (
          <span style={{ color: '#334155', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '380px' }}>
            {log.message}
          </span>
        )}
      </div>

      {hasFailed && log.error && (
        <ErrorInspector error={log.error} compact={true} />
      )}
    </div>
  );
};

// MinIO Log Detail Modal
const PipelineLogModal = ({ log, idx, onClose }) => {
  const [activeSubTab, setActiveSubTab] = useState('summary');
  const [copiedPayload, setCopiedPayload] = useState(false);
  if (!log) return null;

  const status = log.status || (log.error ? 'failed' : 'completed');
  const hasFailed = status === 'failed' || !!log.error;
  const path = log._minio_path || `Log #${idx + 1}`;
  const payloadData = Object.fromEntries(Object.entries(log).filter(([k]) => k !== '_minio_path'));

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(payloadData, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1100, padding: '20px', backdropFilter: 'blur(3px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff', borderRadius: '18px', width: '100%', maxWidth: '800px',
          maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
          border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc',
        }}>
          <Terminal size={18} color="#0f172a" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
              {path}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              MinIO Execution Audit Log
            </div>
          </div>
          <StatusBadge status={status} />
          <button
            onClick={onClose}
            style={{
              background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px',
              padding: '6px', cursor: 'pointer', color: '#64748b', display: 'flex',
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Sub Navigation */}
        <div style={{ display: 'flex', gap: '6px', padding: '10px 20px', borderBottom: '1px solid #f1f5f9', background: '#ffffff' }}>
          {[
            { id: 'summary', label: 'Structured Overview' },
            { id: 'raw', label: 'Raw Payload & JSON' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveSubTab(t.id)}
              style={{
                padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                fontSize: '12px', fontWeight: 700,
                background: activeSubTab === t.id ? '#0f172a' : '#f1f5f9',
                color: activeSubTab === t.id ? '#ffffff' : '#64748b',
              }}
            >
              {t.label}
            </button>
          ))}
          <button
            onClick={handleCopyPayload}
            style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '5px',
              padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0',
              background: '#ffffff', color: '#475569', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer',
            }}
          >
            {copiedPayload ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
            {copiedPayload ? 'Copied' : 'Copy All'}
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {activeSubTab === 'summary' ? (
            <>
              {hasFailed && log.error && (
                <ErrorInspector error={log.error} compact={false} />
              )}

              {/* Key Values Grid */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px', background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0',
              }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>Job Name</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>{log.job_name || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>Timestamp</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>Duration</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    {log.duration != null ? `${log.duration} seconds` : '—'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>Plots Processed</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{log.plots_processed ?? '—'}</div>
                </div>
              </div>

              {/* Extra details list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>Execution Metadata</div>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                  {Object.entries(payloadData)
                    .filter(([k]) => !['job_name', 'timestamp', 'duration', 'plots_processed', 'error', 'status'].includes(k))
                    .map(([k, v], i) => (
                      <div
                        key={k}
                        style={{
                          display: 'flex', padding: '8px 14px', borderBottom: '1px solid #f1f5f9',
                          background: i % 2 === 0 ? '#fbfcfe' : '#ffffff', fontSize: '12px',
                        }}
                      >
                        <span style={{ width: '180px', fontWeight: 700, color: '#475569', fontFamily: 'var(--font-mono)' }}>{k}</span>
                        <span style={{ flex: 1, color: '#0f172a', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
                          {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </>
          ) : (
            <pre style={{
              margin: 0, padding: '16px', background: '#0f172a', color: '#e2e8f0',
              borderRadius: '12px', fontSize: '12px', fontFamily: 'var(--font-mono)',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowX: 'auto',
            }}>
              {JSON.stringify(payloadData, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

const Logs = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.tab === 'pipeline' ? 'pipeline' : 'jobs');
  const [highlightKey] = useState(location.state?.highlightKey || '');

  // DB Jobs State
  const [jobs, setJobs] = useState([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [expandedJob, setExpandedJob] = useState(null);

  // MinIO Pipeline Logs State
  const [pipelineLogs, setPipelineLogs] = useState([]);
  const [pipelineStatusFilter, setPipelineStatusFilter] = useState('');
  const [pipelineSearchQuery, setPipelineSearchQuery] = useState('');
  const PIPELINE_PAGE_SIZE = 25;
  const [pipelineLimit, setPipelineLimit] = useState(PIPELINE_PAGE_SIZE);
  const [pipelineLoadingMore, setPipelineLoadingMore] = useState(false);
  const [openLog, setOpenLog] = useState(null);

  // General State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoRefreshSec, setAutoRefreshSec] = useState(30);
  const autoRefreshRef = useRef(null);

  const loadJobs = async () => {
    try {
      const data = await fetchLogs({
        status: statusFilter || undefined,
        search: searchQuery || undefined,
        page,
        pageSize: 50,
      });
      setJobs(data.items || []);
      setTotalJobs(data.total || 0);
    } catch (e) {
      setError(e.message || 'Failed to load pipeline jobs');
    }
  };

  const loadPipeline = async (limit = pipelineLimit) => {
    try {
      const data = await fetchPipelineLogs(undefined, limit);
      setPipelineLogs(data.logs || []);
    } catch (e) {
      setError(e.message || 'Failed to load execution audit logs');
    }
  };

  const loadMorePipeline = async () => {
    setPipelineLoadingMore(true);
    const next = pipelineLimit + PIPELINE_PAGE_SIZE;
    await loadPipeline(next);
    setPipelineLimit(next);
    setPipelineLoadingMore(false);
  };

  const loadAll = async () => {
    setLoading(true);
    setError('');
    await Promise.all([loadJobs(), loadPipeline(pipelineLimit)]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, [statusFilter, searchQuery, page]);

  useEffect(() => {
    autoRefreshRef.current = setInterval(() => {
      loadJobs();
      loadPipeline(pipelineLimit);
    }, 30000);
    return () => clearInterval(autoRefreshRef.current);
  }, [statusFilter, searchQuery, page, pipelineLimit]);

  // Statistics calculation
  const failedJobsCount = jobs.filter(j => (j.status || '').toLowerCase() === 'failed' || !!j.error).length;
  const completedJobsCount = jobs.filter(j => (j.status || '').toLowerCase() === 'completed').length;
  const processingJobsCount = jobs.filter(j => (j.status || '').toLowerCase() === 'processing').length;
  const failedPipelineCount = pipelineLogs.filter(l => (l.status || '').toLowerCase() === 'failed' || !!l.error).length;

  // Filtered MinIO Pipeline Logs
  const filteredPipelineLogs = pipelineLogs.filter(l => {
    const st = (l.status || (l.error ? 'failed' : 'completed')).toLowerCase();
    if (pipelineStatusFilter && st !== pipelineStatusFilter) return false;
    if (pipelineSearchQuery) {
      const q = pipelineSearchQuery.toLowerCase();
      const matchPath = (l._minio_path || '').toLowerCase().includes(q);
      const matchJob = (l.job_name || '').toLowerCase().includes(q);
      const matchErr = (l.error || '').toLowerCase().includes(q);
      const matchMsg = (l.message || '').toLowerCase().includes(q);
      if (!matchPath && !matchJob && !matchErr && !matchMsg) return false;
    }
    return true;
  });

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '100%', boxSizing: 'border-box' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ color: '#0f172a', fontSize: '22px', fontWeight: 600, margin: 0, letterSpacing: '-0.02em' }}>
            System & Pipeline Logs
          </h1>
          <p style={{ color: '#64748b', fontSize: '13px', fontWeight: 600, margin: '4px 0 0' }}>
            Live execution history, processing errors, and MinIO audit records — auto-refreshing
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={loadAll}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px',
              background: '#0f172a', border: 'none', borderRadius: '10px',
              color: '#ffffff', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(15,23,42,0.15)',
            }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh Logs
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <SummaryCard icon={Database} label="Total DB Jobs" value={totalJobs.toLocaleString()} color="#0f172a" />
        <SummaryCard icon={CheckCircle2} label="Completed" value={completedJobsCount} color="#16a34a" />
        <SummaryCard icon={Loader2} label="Processing" value={processingJobsCount} color="#2563eb" />
        <SummaryCard icon={AlertTriangle} label="Failed DB Jobs" value={failedJobsCount} color="#dc2626" />
        <SummaryCard icon={Terminal} label="Failed Execution Logs" value={failedPipelineCount} color="#7c3aed" />
      </div>

      {/* Main Tabs Header */}
      <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '4px', width: 'fit-content' }}>
        {[
          { key: 'jobs', label: 'Database Pipeline Jobs', icon: Database, count: totalJobs },
          { key: 'pipeline', label: 'Execution & Audit Logs (MinIO)', icon: Terminal, count: pipelineLogs.length },
        ].map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '9px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: activeTab === key ? '#ffffff' : 'transparent',
              color: activeTab === key ? '#0f172a' : '#64748b',
              fontWeight: 600, fontSize: '12px',
              boxShadow: activeTab === key ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Icon size={14} color={activeTab === key ? '#16a34a' : '#64748b'} />
            {label}
            <span style={{
              fontSize: '11px', padding: '2px 7px', borderRadius: '12px',
              background: activeTab === key ? '#f1f5f9' : '#e2e8f0',
              color: activeTab === key ? '#0f172a' : '#64748b',
            }}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Error Alert Display */}
      <ErrorBanner message={error} onDismiss={() => setError('')} onRetry={loadAll} />

      {/* ─── TAB 1: Database Pipeline Jobs ─── */}
      {activeTab === 'jobs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Filters & Search Bar */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              {['', 'pending', 'processing', 'completed', 'failed'].map(s => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setPage(1); }}
                  style={{
                    padding: '6px 14px', borderRadius: '20px', border: '1px solid',
                    fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                    letterSpacing: '0', transition: 'all 0.15s',
                    background: statusFilter === s ? (s ? getStatus(s).bg : '#0f172a') : '#ffffff',
                    color: statusFilter === s ? (s ? getStatus(s).color : '#ffffff') : '#64748b',
                    borderColor: statusFilter === s ? (s ? getStatus(s).border : '#0f172a') : '#e2e8f0',
                  }}
                >
                  {s || 'All Statuses'}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search Plot ID, Sensor, or Error…"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '7px 10px 7px 32px',
                  borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px',
                  outline: 'none', background: '#ffffff',
                }}
              />
            </div>
          </div>

          {/* Jobs Table Container */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '60px 100px 110px 130px 130px 160px 1fr 30px',
              padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
              fontSize: '11px', fontWeight: 600, color: '#64748b', letterSpacing: '0',
            }}>
              <span>ID</span>
              <span>Plot</span>
              <span>Sensor</span>
              <span>Status</span>
              <span>Target Date</span>
              <span>Completed</span>
              <span>Execution Summary / Error</span>
              <span></span>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '50px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Loader2 size={18} className="animate-spin" /> Loading jobs…
              </div>
            ) : jobs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                <Database size={36} style={{ opacity: 0.3, marginBottom: '8px' }} />
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>No pipeline jobs found</p>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                  Trigger a satellite processing task or run the scheduler to generate jobs.
                </p>
              </div>
            ) : (
              <div>
                {jobs.map(job => {
                  const isExpanded = expandedJob === job.id;
                  const isFailed = (job.status || '').toLowerCase() === 'failed' || !!job.error;

                  return (
                    <div key={job.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <div
                        onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                        style={{
                          display: 'grid', gridTemplateColumns: '60px 100px 110px 130px 130px 160px 1fr 30px',
                          padding: '12px 16px', alignItems: 'center', cursor: 'pointer',
                          background: isFailed ? '#fffafa' : (isExpanded ? '#f8fafc' : '#ffffff'),
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = isFailed ? '#fff1f2' : '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = isFailed ? '#fffafa' : (isExpanded ? '#f8fafc' : '#ffffff')}
                      >
                        <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>#{job.id}</span>
                        <span style={{ color: '#0f172a', fontSize: '12px', fontWeight: 700 }}>
                          {job.plot_id ? `Plot #${job.plot_id}` : '—'}
                        </span>
                        <span style={{ color: '#475569', fontSize: '11.5px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          {job.sensor || '—'}
                        </span>
                        <StatusBadge status={job.status} />
                        <span style={{ color: '#64748b', fontSize: '12px' }}>{job.start_date || '—'}</span>
                        <span style={{ color: '#64748b', fontSize: '11.5px' }}>
                          {job.completed_at ? new Date(job.completed_at).toLocaleString() : '—'}
                        </span>
                        <div style={{ minWidth: 0, paddingRight: '10px' }}>
                          {isFailed ? (
                            <ErrorInspector error={job.error} compact={true} />
                          ) : (
                            <span style={{ color: '#16a34a', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={13} /> Processed successfully
                            </span>
                          )}
                        </div>
                        <div style={{ color: '#94a3b8', display: 'flex', justifyContent: 'center' }}>
                          {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                        </div>
                      </div>

                      {/* Expanded Details Panel */}
                      {isExpanded && (
                        <div style={{ padding: '16px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', background: '#ffffff', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <div>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>Created Timestamp</div>
                              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                                {job.created_at ? new Date(job.created_at).toLocaleString() : '—'}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>Completed Timestamp</div>
                              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                                {job.completed_at ? new Date(job.completed_at).toLocaleString() : '—'}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>Sensor Band Target</div>
                              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{job.sensor || '—'}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>Date Span</div>
                              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                                {job.start_date || '—'} to {job.end_date || '—'}
                              </div>
                            </div>
                          </div>

                          {job.error && (
                            <ErrorInspector error={job.error} compact={false} />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
              Showing {jobs.length} of {totalJobs.toLocaleString()} total database records
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{
                  padding: '6px 14px', background: '#ffffff', border: '1px solid #e2e8f0',
                  borderRadius: '8px', color: '#475569', cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  fontSize: '12px', fontWeight: 700, opacity: page <= 1 ? 0.4 : 1,
                }}
              >
                ← Prev
              </button>
              <span style={{ color: '#0f172a', fontSize: '12px', fontWeight: 600 }}>
                Page {page} of {Math.ceil(totalJobs / 50) || 1}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={jobs.length < 50}
                style={{
                  padding: '6px 14px', background: '#ffffff', border: '1px solid #e2e8f0',
                  borderRadius: '8px', color: '#475569', cursor: jobs.length < 50 ? 'not-allowed' : 'pointer',
                  fontSize: '12px', fontWeight: 700, opacity: jobs.length < 50 ? 0.4 : 1,
                }}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: MinIO Execution & Audit Logs ─── */}
      {activeTab === 'pipeline' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Controls Bar */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              {['', 'completed', 'failed'].map(s => (
                <button
                  key={s}
                  onClick={() => setPipelineStatusFilter(s)}
                  style={{
                    padding: '6px 14px', borderRadius: '20px', border: '1px solid',
                    fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                    letterSpacing: '0', transition: 'all 0.15s',
                    background: pipelineStatusFilter === s ? (s ? getStatus(s).bg : '#0f172a') : '#ffffff',
                    color: pipelineStatusFilter === s ? (s ? getStatus(s).color : '#ffffff') : '#64748b',
                    borderColor: pipelineStatusFilter === s ? (s ? getStatus(s).border : '#0f172a') : '#e2e8f0',
                  }}
                >
                  {s || 'All Records'}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', width: '320px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Filter by filename, job, or error message…"
                value={pipelineSearchQuery}
                onChange={e => setPipelineSearchQuery(e.target.value)}
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '7px 10px 7px 32px',
                  borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px',
                  outline: 'none', background: '#ffffff',
                }}
              />
            </div>
          </div>

          {/* MinIO Logs List */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Loader2 size={18} className="animate-spin" /> Scanning MinIO execution logs…
            </div>
          ) : pipelineLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px' }}>
              <FileText size={36} style={{ color: '#94a3b8', marginBottom: '8px', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>No execution audit logs found in MinIO</p>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                Pipeline runs automatically write execution summaries to <code>execution_logs/</code> and tenant directories.
              </p>
            </div>
          ) : filteredPipelineLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px' }}>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>No matching execution logs</p>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>Try clearing the search query or status filter.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredPipelineLogs.map((log, i) => (
                <PipelineLogRow
                  key={i}
                  log={log}
                  idx={i}
                  onOpen={(l, idx) => setOpenLog({ log: l, idx })}
                  highlighted={!!highlightKey && log._minio_path === highlightKey}
                />
              ))}

              {pipelineLogs.length >= pipelineLimit && (
                <button
                  onClick={loadMorePipeline}
                  disabled={pipelineLoadingMore}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    padding: '12px', marginTop: '6px',
                    borderRadius: '12px', border: '1px solid #e2e8f0',
                    background: '#ffffff', color: '#0f172a',
                    fontSize: '13px', fontWeight: 600, cursor: pipelineLoadingMore ? 'default' : 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                >
                  {pipelineLoadingMore ? <Loader2 size={15} className="animate-spin" /> : null}
                  {pipelineLoadingMore ? 'Scanning more logs…' : `Load More Logs (${pipelineLogs.length} loaded)`}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Pipeline Detail Modal */}
      {openLog && (
        <PipelineLogModal log={openLog.log} idx={openLog.idx} onClose={() => setOpenLog(null)} />
      )}
    </div>
  );
};

export default Logs;

