import React, { useState, useEffect, useRef } from 'react';
import {
  Users, Plus, Trash2, RefreshCw, X, Check,
  Search, Shield, KeyRound, UserCheck, UserX, Copy,
  ChevronDown, Eye, EyeOff, Edit2, Lock
} from 'lucide-react';
import {
  fetchUsers, createUser, updateUser,
  toggleUserActive, resetUserPassword, deleteUser
} from '../../services/adminApi';
import { useConfirm } from '../components/ConfirmProvider';
import ErrorBanner from '../components/ErrorBanner';

const ACCOUNT_TYPES = [
  { value: '',                     label: 'All Types' },
  { value: 'platform_admin',       label: 'Platform Admin' },
  { value: 'organization_owner',   label: 'Org Owner' },
  { value: 'organization_member',  label: 'Org Member' },
  { value: 'personal',             label: 'Personal' },
];

const TYPE_CFG = {
  platform_admin:       { color: '#7c3aed', bg: 'rgba(124,58,237,0.1)',  label: 'Platform Admin' },
  organization_owner:   { color: '#0284c7', bg: 'rgba(2,132,199,0.1)',   label: 'Org Owner' },
  organization_member:  { color: '#0f766e', bg: 'rgba(15,118,110,0.1)',  label: 'Org Member' },
  personal:             { color: '#64748b', bg: 'rgba(100,116,139,0.1)', label: 'Personal' },
};

const TypeBadge = ({ type }) => {
  const cfg = TYPE_CFG[type] || TYPE_CFG.personal;
  return (
    <span style={{
      fontSize: '11px', fontWeight: 800, padding: '2px 10px',
      borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.06em',
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}33`,
    }}>{cfg.label}</span>
  );
};

const EMPTY_FORM = {
  email: '', first_name: '', last_name: '', phone_number: '',
  account_type: 'personal', password: '', is_staff: false,
};

const UsersPage = () => {
  const confirm = useConfirm();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [resetResult, setResetResult] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [copied, setCopied] = useState('');
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchUsers({ accountType: typeFilter || undefined, search: search || undefined, page });
      setUsers(data.items || []);
      setTotal(data.total || 0);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(load, 350);
  }, [typeFilter, search, page]);

  const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 4000); };

  const copy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    } catch (e) {
      setError('Could not copy to clipboard — your browser may be blocking clipboard access.');
    }
  };

  const handleCreate = async () => {
    if (!form.email) return;
    setSaving(true);
    try {
      const result = await createUser(form);
      if (result.generated_password && !form.password) {
        setResetResult({ email: result.email, new_password: result.generated_password });
      }
      setForm(EMPTY_FORM);
      setShowForm(false);
      showSuccess(`User ${result.email} created.`);
      await load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      await updateUser(editUser.id, {
        first_name: editUser.first_name,
        last_name: editUser.last_name,
        phone_number: editUser.phone_number,
        account_type: editUser.account_type,
        is_staff: editUser.is_staff,
      });
      setEditUser(null);
      showSuccess('User updated.');
      await load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleToggle = async (user) => {
    try {
      const res = await toggleUserActive(user.id);
      showSuccess(`${res.email} is now ${res.is_active ? 'enabled' : 'disabled'}.`);
      await load();
    } catch (e) { setError(e.message); }
  };

  const handleResetPw = async (user) => {
    if (!(await confirm(`Reset the password for ${user.email}? Their current password will stop working immediately.`))) return;
    try {
      const res = await resetUserPassword(user.id);
      setResetResult(res);
    } catch (e) { setError(e.message); }
  };

  const handleDelete = async (user) => {
    if (!(await confirm(`Permanently delete ${user.email}? This cannot be undone.`))) return;
    try {
      await deleteUser(user.id);
      showSuccess(`${user.email} deleted.`);
      await load();
    } catch (e) { setError(e.message); }
  };

  const inp = {
    width: '100%', padding: '9px 12px', background: '#fff',
    border: '1px solid #cbd5e1', borderRadius: '10px',
    color: '#1e293b', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
  };
  const lbl = {
    display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748b',
    letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '5px',
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ color: '#0f172a', fontSize: '20px', fontWeight: 800, margin: 0 }}>User Accounts</h2>
          <p style={{ color: '#64748b', fontSize: '12px', fontWeight: 600, margin: '4px 0 0' }}>
            Create, manage and control all platform user accounts from here
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', color: '#475569', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
            <RefreshCw size={13} /> Refresh
          </button>
          <button onClick={() => { setShowForm(true); setEditUser(null); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', background: '#0f172a', border: 'none', borderRadius: '10px', color: 'white', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
            <Plus size={15} /> New User
          </button>
        </div>
      </div>

      {/* Alerts */}
      <ErrorBanner message={error} onDismiss={() => setError('')} onRetry={load} />
      {success && (
        <div style={{ padding: '12px 16px', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '10px', color: '#16a34a', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Check size={14} />{success}
        </div>
      )}

      {/* Password Reset Result */}
      {resetResult && (
        <div style={{ padding: '16px 20px', background: '#fefce8', border: '1px solid #fde047', borderRadius: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#854d0e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
            🔑 New Password Generated — Share Securely
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div><span style={{ fontSize: '11px', color: '#713f12' }}>Email: </span><code style={{ fontSize: '12px', fontWeight: 700 }}>{resetResult.email}</code></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#713f12' }}>Password: </span>
              <code style={{ fontSize: '14px', fontWeight: 900, letterSpacing: '0.05em', padding: '3px 10px', background: '#fff', border: '1px solid #fde047', borderRadius: '6px' }}>{resetResult.new_password}</code>
              <button onClick={() => copy(resetResult.new_password, 'pw')} style={{ padding: '5px', background: 'none', border: '1px solid #fde047', borderRadius: '6px', cursor: 'pointer', color: copied === 'pw' ? '#16a34a' : '#713f12', display: 'flex' }}>
                {copied === 'pw' ? <Check size={13} /> : <Copy size={13} />}
              </button>
            </div>
          </div>
          <button onClick={() => setResetResult(null)} style={{ marginTop: '10px', fontSize: '11px', color: '#713f12', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Dismiss</button>
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>Create New User Account</p>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={16} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div><label style={lbl}>First Name</label><input style={inp} value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} placeholder="First name" /></div>
            <div><label style={lbl}>Last Name</label><input style={inp} value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} placeholder="Last name" /></div>
            <div><label style={lbl}>Email *</label><input type="email" style={inp} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Account email" /></div>
            <div><label style={lbl}>Phone Number</label><input style={inp} value={form.phone_number} onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))} placeholder="+234..." /></div>
            <div>
              <label style={lbl}>Account Type</label>
              <select style={{ ...inp, cursor: 'pointer' }} value={form.account_type} onChange={e => setForm(f => ({ ...f, account_type: e.target.value }))}>
                {ACCOUNT_TYPES.slice(1).map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Password <span style={{ color: '#94a3b8', fontWeight: 600, textTransform: 'none' }}>(blank = auto-generate)</span></label>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} style={{ ...inp, paddingRight: '38px' }} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Auto-generated if blank" />
                <button onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: 0 }}>
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <input type="checkbox" id="is_staff" checked={form.is_staff} onChange={e => setForm(f => ({ ...f, is_staff: e.target.checked }))} style={{ accentColor: '#0f172a' }} />
            <label htmlFor="is_staff" style={{ fontSize: '12px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>Django Staff access (Django Admin panel)</label>
          </div>
          <button onClick={handleCreate} disabled={saving || !form.email} style={{ padding: '11px 24px', background: '#0f172a', border: 'none', borderRadius: '10px', color: 'white', fontSize: '13px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: saving ? 0.6 : 1 }}>
            {saving ? <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <><Shield size={14} />Create Account</>}
          </button>
        </div>
      )}

      {/* Edit User Drawer */}
      {editUser && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>Edit — {editUser.email}</p>
            <button onClick={() => setEditUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={16} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div><label style={lbl}>First Name</label><input style={inp} value={editUser.first_name} onChange={e => setEditUser(u => ({ ...u, first_name: e.target.value }))} /></div>
            <div><label style={lbl}>Last Name</label><input style={inp} value={editUser.last_name} onChange={e => setEditUser(u => ({ ...u, last_name: e.target.value }))} /></div>
            <div><label style={lbl}>Phone</label><input style={inp} value={editUser.phone_number || ''} onChange={e => setEditUser(u => ({ ...u, phone_number: e.target.value }))} /></div>
            <div>
              <label style={lbl}>Account Type</label>
              <select style={{ ...inp, cursor: 'pointer' }} value={editUser.account_type} onChange={e => setEditUser(u => ({ ...u, account_type: e.target.value }))}>
                {ACCOUNT_TYPES.slice(1).map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <input type="checkbox" id="edit_staff" checked={!!editUser.is_staff} onChange={e => setEditUser(u => ({ ...u, is_staff: e.target.checked }))} style={{ accentColor: '#0f172a' }} />
            <label htmlFor="edit_staff" style={{ fontSize: '12px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>Django Staff access</label>
          </div>
          <button onClick={handleUpdate} disabled={saving} style={{ padding: '11px 24px', background: '#0f172a', border: 'none', borderRadius: '10px', color: 'white', fontSize: '13px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: saving ? 0.6 : 1 }}>
            {saving ? <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <><Check size={14} />Save Changes</>}
          </button>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '340px' }}>
          <Search size={13} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input ref={searchRef} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by email…" style={{ ...inp, paddingLeft: '34px' }} />
        </div>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }} style={{ ...inp, width: 'auto', cursor: 'pointer', paddingRight: '28px' }}>
          {ACCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600, marginLeft: 'auto' }}>{total.toLocaleString()} users</span>
      </div>

      {/* Users Table */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 130px 80px 140px 120px', padding: '10px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          {['User', 'Account Type', 'Auth', 'Status', 'Joined', 'Actions'].map(h => (
            <span key={h} style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</span>
          ))}
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading users…</div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No users found</div>
        ) : (
          <div style={{ overflowY: 'auto', maxHeight: '500px' }}>
            {users.map(user => (
              <div key={user.id} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 130px 80px 140px 120px', padding: '13px 16px', borderBottom: '1px solid #f1f5f9', alignItems: 'center', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* User info */}
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{user.first_name || user.last_name ? `${user.first_name} ${user.last_name}`.trim() : '—'}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>{user.email}</div>
                  {user.is_staff && <span style={{ fontSize: '11px', fontWeight: 800, color: '#7c3aed', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Django Staff</span>}
                </div>
                <TypeBadge type={user.account_type} />
                <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)', textTransform: 'capitalize' }}>{user.auth_provider || 'email'}</span>
                <span style={{ fontSize: '11px', color: user.is_active ? '#16a34a' : '#dc2626', fontWeight: 700 }}>{user.is_active ? 'Active' : 'Disabled'}</span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{user.date_joined ? new Date(user.date_joined).toLocaleDateString() : user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</span>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  <button onClick={() => { setEditUser({ ...user }); setShowForm(false); }} title="Edit" style={{ padding: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '7px', cursor: 'pointer', color: '#475569', display: 'flex' }}>
                    <Edit2 size={12} />
                  </button>
                  <button onClick={() => handleToggle(user)} title={user.is_active ? 'Disable' : 'Enable'} style={{ padding: '6px', background: user.is_active ? 'rgba(220,38,38,0.06)' : 'rgba(22,163,74,0.06)', border: `1px solid ${user.is_active ? 'rgba(220,38,38,0.2)' : 'rgba(22,163,74,0.2)'}`, borderRadius: '7px', cursor: 'pointer', color: user.is_active ? '#dc2626' : '#16a34a', display: 'flex' }}>
                    {user.is_active ? <UserX size={12} /> : <UserCheck size={12} />}
                  </button>
                  <button onClick={() => handleResetPw(user)} title="Reset Password" style={{ padding: '6px', background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '7px', cursor: 'pointer', color: '#7c3aed', display: 'flex' }}>
                    <Lock size={12} />
                  </button>
                  <button onClick={() => handleDelete(user)} title="Delete" style={{ padding: '6px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)', borderRadius: '7px', cursor: 'pointer', color: '#dc2626', display: 'flex' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ padding: '6px 14px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#475569', cursor: page <= 1 ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 700, opacity: page <= 1 ? 0.4 : 1 }}>← Prev</button>
        <span style={{ color: '#475569', fontSize: '12px', fontWeight: 600 }}>Page {page} of {Math.ceil(total / 50) || 1}</span>
        <button onClick={() => setPage(p => p + 1)} disabled={users.length < 50} style={{ padding: '6px 14px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#475569', cursor: users.length < 50 ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 700, opacity: users.length < 50 ? 0.4 : 1 }}>Next →</button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default UsersPage;
