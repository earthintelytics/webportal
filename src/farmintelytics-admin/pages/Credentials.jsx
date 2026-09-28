import React, { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Copy, Check, X, RefreshCw, AlertCircle, Shield } from 'lucide-react';
import { fetchCredentials, createCredential, deleteCredential, rotateCredential, fetchOrganizations } from '../../services/adminApi';
import { useConfirm } from '../components/ConfirmProvider';
import ErrorBanner from '../components/ErrorBanner';

const Credentials = () => {
  const confirm = useConfirm();
  const [creds, setCreds] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [form, setForm] = useState({ company_id: '', email: '', access_code: '', label: 'Primary', full_name: '', role: 'admin' });
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [rotatingId, setRotatingId] = useState(null);
  // Access codes are hashed at rest — the backend only ever returns the
  // real code in the response right after it's created/rotated. Keep
  // those here, keyed by credential id, so they stay visible for this
  // session only; a reload (or another admin's view) shows them masked.
  const [revealed, setRevealed] = useState({});

  const load = async () => {
    try {
      const [c, o] = await Promise.all([fetchCredentials(), fetchOrganizations()]);
      setCreds(c); setOrgs(o);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const copy = async (text, id) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleCreate = async () => {
    if (!form.company_id || !form.email) return;
    setSaving(true);
    try {
      const cred = await createCredential({ ...form, access_code: form.access_code.trim() || '' });
      setForm({ company_id: '', email: '', access_code: '', label: 'Primary', full_name: '', role: 'admin' });
      setShowForm(false);
      await load();
      if (cred?.access_code) setRevealed(r => ({ ...r, [cred.id]: cred.access_code }));
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  const handleRotate = async (id) => {
    if (!(await confirm('Issue a new access code? The current one stops working immediately.'))) return;
    setRotatingId(id);
    try {
      const cred = await rotateCredential(id);
      if (cred?.access_code) setRevealed(r => ({ ...r, [id]: cred.access_code }));
      await load();
    } catch (e) { setError(e.message); } finally { setRotatingId(null); }
  };

  const handleDelete = async (id) => {
    if (!(await confirm('Delete this credential?'))) return;
    try { await deleteCredential(id); await load(); }
    catch (e) { setError(e.message); }
  };

  const inputStyle = { width: '100%', padding: '10px 12px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', color: '#1e293b', fontSize: '13px', fontWeight: 500, outline: 'none', boxSizing: 'border-box', fontFamily: "'Roboto', sans-serif" };
  const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748b', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' };

  // Group by company_id
  const grouped = creds.reduce((acc, c) => {
    if (!acc[c.company_id]) acc[c.company_id] = [];
    acc[c.company_id].push(c);
    return acc;
  }, {});

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ color: '#0f172a', fontSize: '20px', fontWeight: 800, margin: 0 }}>Credentials</h2>
          <p style={{ color: '#64748b', fontSize: '12px', fontWeight: 600, margin: '4px 0 0' }}>Manage tenant login email / access-code pairs</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: '#15803d', border: 'none', borderRadius: '10px', color: 'white', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(22,163,74,0.25)' }}>
          <Plus size={16} />{showForm ? 'Cancel' : 'New Credential'}
        </button>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError('')} onRetry={load} />

      {/* Create form */}
      {showForm && (
        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '20px' }}>
          <p style={{ color: '#1e293b', fontSize: '14px', fontWeight: 700, margin: '0 0 16px' }}>New Credential</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>Organization *</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.company_id} onChange={e => setForm(f => ({ ...f, company_id: e.target.value }))}>
                <option value="">Select org…</option>
                {orgs.map(o => <option key={o.schema_name} value={o.schema_name}>{o.display_name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Label</label>
              <input style={inputStyle} placeholder="Primary, Manager, etc." value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>Account Holder Name</label>
              <input style={inputStyle} placeholder="Full name" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Account Role</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="admin">Admin — full organization access</option>
                <option value="analyst">Analyst — monitoring & reports</option>
                <option value="viewer">Viewer — read-only</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Email *</label>
              <input type="email" style={inputStyle} placeholder="Login email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Access Code (password) <span style={{ color: '#475569', fontWeight: 600 }}>(blank = auto-generate)</span></label>
              <input style={inputStyle} placeholder="Auto-generated if blank" value={form.access_code} onChange={e => setForm(f => ({ ...f, access_code: e.target.value }))} />
            </div>
          </div>
          <button onClick={handleCreate} disabled={saving || !form.company_id || !form.email} style={{ padding: '12px 24px', background: '#15803d', border: 'none', borderRadius: '10px', color: 'white', fontSize: '13px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: saving ? 0.6 : 1 }}>
            {saving ? <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <><Check size={15} />Generate Credential</>}
          </button>
        </div>
      )}

      {/* Credentials list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Object.keys(grouped).length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px', color: '#475569' }}>No credentials yet.</div>
          )}
          {Object.entries(grouped).map(([companyId, credList]) => {
            const org = orgs.find(o => o.schema_name === companyId);
            return (
              <div key={companyId} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Shield size={14} color="#16a34a" />
                  <span style={{ color: '#1e293b', fontSize: '13px', fontWeight: 700 }}>{org?.display_name || companyId}</span>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>({credList.length} credentials)</span>
                </div>
                {credList.map(cred => (
                  <div key={cred.id} style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ color: '#1e293b', fontSize: '13px', fontWeight: 600 }}>{cred.full_name ? `${cred.full_name} — ` : ''}{cred.email}</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '1px 7px', borderRadius: '5px', background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.15)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{cred.label}</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '1px 7px', borderRadius: '5px', background: 'rgba(22,163,74,0.08)', color: '#16a34a', border: '1px solid rgba(22,163,74,0.15)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{cred.role || 'admin'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {revealed[cred.id] ? (
                          <>
                            <code style={{ fontSize: '12px', color: '#15803d', fontFamily: 'monospace', background: 'rgba(22,163,74,0.08)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>{revealed[cred.id]}</code>
                            <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600 }}>Copy now — won't be shown again</span>
                          </>
                        ) : (
                          <code style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace', background: '#ffffff', padding: '2px 8px', borderRadius: '6px', letterSpacing: '2px' }}>••••••••••</code>
                        )}
                        <span style={{ fontSize: '11px', color: '#475569' }}>Created {new Date(cred.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button onClick={() => copy(cred.email, `email-${cred.id}`)} title="Copy email" style={{ padding: '7px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', color: copied === `email-${cred.id}` ? '#16a34a' : '#6b7280', display: 'flex' }}>
                        {copied === `email-${cred.id}` ? <Check size={13} /> : <Copy size={13} />}
                      </button>
                      {revealed[cred.id] && (
                        <button onClick={() => copy(revealed[cred.id], `code-${cred.id}`)} title="Copy code" style={{ padding: '7px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', color: copied === `code-${cred.id}` ? '#16a34a' : '#6b7280', display: 'flex' }}>
                          {copied === `code-${cred.id}` ? <Check size={13} /> : <Key size={13} />}
                        </button>
                      )}
                      <button onClick={() => handleRotate(cred.id)} disabled={rotatingId === cred.id} title="Issue a new access code" style={{ padding: '7px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', color: '#6b7280', display: 'flex', opacity: rotatingId === cred.id ? 0.5 : 1 }}>
                        <RefreshCw size={13} />
                      </button>
                      <button onClick={() => handleDelete(cred.id)} style={{ padding: '7px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)', borderRadius: '8px', cursor: 'pointer', color: '#ef4444', display: 'flex' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Credentials;
