import React, { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Edit3, X, Check } from 'lucide-react';
import {
  fetchSchedulerJobs, createSchedulerJob, updateSchedulerJob, deleteSchedulerJob, fetchPipelineConfigs
} from '../../services/adminApi';
import { useConfirm } from '../components/ConfirmProvider';
import ErrorBanner from '../components/ErrorBanner';

const COMMON_Schedules = [
  { label: 'Every 5 days (Harmattan standard)', cron: '0 3 */5 * *' },
  { label: 'Weekly (Every Sunday midnight)', cron: '0 0 * * 0' },
  { label: 'Monthly (1st of month)', cron: '0 0 1 * *' },
  { label: 'Daily (Every night at 3 AM)', cron: '0 3 * * *' },
];

const JobModal = ({ job, configs, onSave, onClose }) => {
  const [form, setForm] = useState(job ? {
    name: job.name, description: job.description, cron: job.cron,
    config_path: job.config_path, is_batch: job.is_batch, enabled: job.enabled
  } : {
    name: '', description: '', cron: '0 3 */5 * *', config_path: '', is_batch: true, enabled: true
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Not a full cron parser — just catches the common mistakes (wrong number
  // of fields, stray characters) before a bad expression round-trips to the
  // server and comes back as a raw error message.
  const isValidCron = (expr) => {
    const parts = expr.trim().split(/\s+/);
    return parts.length === 5 && parts.every(p => /^[0-9*/,-]+$/.test(p));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.cron.trim() || !form.config_path.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!isValidCron(form.cron)) {
      setError('Cron expression looks off — it needs 5 space-separated fields, e.g. "0 3 */5 * *".');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(job?.name, form);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 12px',
    background: '#ffffff', border: '1px solid #cbd5e1',
    borderRadius: '10px', color: '#1e293b', fontSize: '13px', fontWeight: 500,
    outline: 'none', boxSizing: 'border-box', fontFamily: "var(--font-sans)"
  };
  const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', letterSpacing: '0', marginBottom: '6px' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: '100%', maxWidth: '500px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '20px', padding: '28px', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h3 style={{ color: '#0f172a', fontSize: '16px', fontWeight: 600, margin: 0 }}>{job ? 'Edit Scheduled Job' : 'New Scheduled Job'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
        </div>

        <div style={{ marginBottom: error ? '16px' : 0 }}><ErrorBanner message={error} onDismiss={() => setError('')} /></div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Job Name (Slug) *</label>
            <input style={inputStyle} placeholder="Job name" disabled={!!job} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <input style={inputStyle} placeholder="What this job does" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Config File (YAML) *</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.config_path} onChange={e => setForm(f => ({ ...f, config_path: e.target.value }))}>
              <option value="">Select target config…</option>
              {configs.map(c => (
                <option key={c.filename} value={`configs/${c.filename}`}>{c.filename} ({c.batch_name})</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Cron Expression *</label>
            <input style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }} placeholder="e.g. 0 3 */5 * *" value={form.cron} onChange={e => setForm(f => ({ ...f, cron: e.target.value }))} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
              {COMMON_Schedules.map(sch => (
                <button key={sch.cron} onClick={() => setForm(f => ({ ...f, cron: sch.cron }))} style={{
                  fontSize: '11px', fontWeight: 700, padding: '2px 8px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#475569', cursor: 'pointer'
                }}>{sch.label}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
            <input type="checkbox" id="is_batch" checked={form.is_batch} onChange={e => setForm(f => ({ ...f, is_batch: e.target.checked }))} style={{ accentColor: '#16a34a', cursor: 'pointer' }} />
            <label htmlFor="is_batch" style={{ color: '#334155', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Is Batch Execution</label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', color: '#334155', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{
            flex: 2, padding: '12px', background: '#15803d', border: 'none', borderRadius: '12px',
            color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '13px', opacity: saving ? 0.6 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}>
            {saving ? <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <><Check size={15} />{job ? 'Update' : 'Schedule'}</>}
          </button>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
};

const Scheduler = () => {
  const confirm = useConfirm();
  const [jobs, setJobs] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);

  const load = async () => {
    try {
      const [j, c] = await Promise.all([fetchSchedulerJobs(), fetchPipelineConfigs()]);
      setJobs(j);
      setConfigs(c);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (job) => {
    const updatedStatus = !job.enabled;
    // Optimistic UI update
    setJobs(prev => prev.map(j => j.name === job.name ? { ...j, enabled: updatedStatus } : j));
    try {
      await updateSchedulerJob(job.name, { enabled: updatedStatus });
    } catch (e) {
      setError(`Failed to update status: ${e.message}`);
      await load();
    }
  };

  const handleSave = async (name, form) => {
    try {
      if (name) {
        await updateSchedulerJob(name, form);
      } else {
        await createSchedulerJob(form);
      }
      setModal(null);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDelete = async (name) => {
    if (!(await confirm(`Delete scheduled job "${name}"?`))) return;
    try {
      await deleteSchedulerJob(name);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ color: '#0f172a', fontSize: '20px', fontWeight: 600, margin: 0 }}>Pipeline Scheduler</h2>
          <p style={{ color: '#64748b', fontSize: '12px', fontWeight: 600, margin: '4px 0 0' }}>Orchestrate end-to-end processing schedules dynamically</p>
        </div>
        <button onClick={() => setModal({ job: null })} style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px',
          background: '#15803d', border: 'none', borderRadius: '10px',
          color: 'white', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
          boxShadow: 'none',
        }}>
          <Plus size={16} />Add Scheduled Run
        </button>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError('')} onRetry={load} />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Loading scheduler configurations…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {jobs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px', color: '#475569', background: '#ffffff', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '16px' }}>
              No scheduled jobs defined. Click "Add Scheduled Run" to create one.
            </div>
          )}
          {jobs.map(job => (
            <div key={job.name} style={{
              background: '#ffffff', border: '1px solid #e2e8f0',
              borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              opacity: job.enabled ? 1 : 0.6, transition: 'all 0.2s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: job.enabled ? 'rgba(22,163,74,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${job.enabled ? 'rgba(22,163,74,0.2)' : 'rgba(255,255,255,0.06)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={18} color={job.enabled ? '#16a34a' : '#4b5563'} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#1e293b', fontSize: '14px', fontWeight: 700 }}>{job.name}</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '1px 6px', borderRadius: '5px', background: '#ffffff', color: '#334155', border: '1px solid #e2e8f0' }}>{job.config_path.replace('configs/', '')}</span>
                  </div>
                  <p style={{ color: '#475569', fontSize: '12px', margin: '4px 0 0' }}>{job.description || 'No description provided.'}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                    <code style={{ fontSize: '11px', color: '#16a34a', background: 'rgba(22,163,74,0.06)', padding: '2px 8px', borderRadius: '6px', fontFamily: 'var(--font-mono)' }}>{job.cron}</code>
                    <span style={{ color: '#475569', fontSize: '11px' }}>• runs on schedule</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {/* Active switch */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, letterSpacing: '0.04em' }}>{job.enabled ? 'Active' : 'Disabled'}</span>
                  <button onClick={() => handleToggle(job)} style={{
                    width: '38px', height: '22px', borderRadius: '20px',
                    background: job.enabled ? '#16a34a' : '#1f2937',
                    border: 'none', cursor: 'pointer', position: 'relative',
                    transition: 'background 0.2s', padding: 0
                  }}>
                    <div style={{
                      width: '16px', height: '16px', borderRadius: '50%', background: 'white',
                      position: 'absolute', top: '3px', left: job.enabled ? '19px' : '3px',
                      transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }} />
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '6px', borderLeft: '1px solid rgba(255,255,255,0.06)', paddingLeft: '14px' }}>
                  <button onClick={() => setModal({ job })} style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#475569', display: 'flex' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#e5e7eb'; }} onMouseLeave={e => { e.currentTarget.style.color = '#6b7280'; }}>
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => handleDelete(job.name)} style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#ef4444', display: 'flex' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.05)'; }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && <JobModal job={modal.job} configs={configs} onSave={handleSave} onClose={() => setModal(null)} />}
    </div>
  );
};

export default Scheduler;
