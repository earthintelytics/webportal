import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, RefreshCw, Search, UserCheck, UserX, Copy, Check, Eye, EyeOff, Pencil, Lock } from 'lucide-react';
import { fetchUsers, createUser, updateUser, toggleUserActive, resetUserPassword, deleteUser } from '../../services/adminApi';
import { useConfirm } from '../components/ConfirmProvider';
import ErrorBanner from '../components/ErrorBanner';
import { emailError } from '../components/validation';
import { inputCls } from '../components/formHelpers';
import { Page, Button, IconButton, Field, Pill, Modal, Table, Td, Empty, Loading, Note } from '../components/ui';

const ACCOUNT_TYPES = [
  { value: 'platform_admin', label: 'Platform admin', tone: 'info' },
  { value: 'organization_owner', label: 'Organisation owner', tone: 'good' },
  { value: 'organization_member', label: 'Organisation member', tone: 'neutral' },
  { value: 'personal', label: 'Personal', tone: 'neutral' },
];
const typeOf = (v) => ACCOUNT_TYPES.find((t) => t.value === v) || ACCOUNT_TYPES[3];
const EMPTY = { email: '', first_name: '', last_name: '', phone_number: '', account_type: 'personal', password: '', is_staff: false };
const PAGE_SIZE = 50;

/** Platform user accounts (Django users): create, edit, disable, reset passwords. */
const UsersPage = () => {
  const confirm = useConfirm();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null); // null | 'new' | user
  const [newPassword, setNewPassword] = useState(null);
  const [copied, setCopied] = useState(false);
  const debounce = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchUsers({ accountType: typeFilter || undefined, search: search || undefined, page });
      setUsers(data.items || []); setTotal(data.total || 0);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => {
    clearTimeout(debounce.current);
    debounce.current = setTimeout(load, 350);
    return () => clearTimeout(debounce.current);
  }, [typeFilter, search, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const flash = (msg) => { setNotice(msg); setTimeout(() => setNotice(''), 4000); };
  const copy = async (text) => { try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { setError('Copy failed: select the password and copy it.'); } };

  const toggle = async (user) => {
    try { const res = await toggleUserActive(user.id); flash(`${res.email} is now ${res.is_active ? 'enabled' : 'disabled'}.`); await load(); } catch (e) { setError(e.message); }
  };
  const resetPw = async (user) => {
    if (!(await confirm(`Reset the password for ${user.email}? The current password stops working immediately.`))) return;
    try { setNewPassword(await resetUserPassword(user.id)); } catch (e) { setError(e.message); }
  };
  const remove = async (user) => {
    if (!(await confirm(`Delete ${user.email} permanently? This cannot be undone.`))) return;
    try { await deleteUser(user.id); flash(`${user.email} deleted.`); await load(); } catch (e) { setError(e.message); }
  };

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Page
      eyebrow="Access"
      title="User accounts"
      text="Everyone with an account on the platform: create accounts, change their type, disable them or reset a password."
      actions={<><Button variant="secondary" onClick={load}><RefreshCw size={15} />Refresh</Button><Button onClick={() => setEditing('new')}><Plus size={16} />New user</Button></>}
    >
      <ErrorBanner message={error} onDismiss={() => setError('')} onRetry={load} />
      {notice && <Note tone="good">{notice}</Note>}
      {newPassword && (
        <Note tone="warning">
          <div className="flex flex-wrap items-center gap-3">
            <span>New password for <strong>{newPassword.email}</strong>. Share it securely; it is not shown again.</span>
            <code className="font-mono text-sm bg-white border border-amber-200 px-2.5 py-1 rounded-lg">{newPassword.new_password}</code>
            <Button variant="secondary" className="!px-3 !py-1.5 text-xs" onClick={() => copy(newPassword.new_password)}>{copied ? <><Check size={13} />Copied</> : <><Copy size={13} />Copy</>}</Button>
            <button type="button" onClick={() => setNewPassword(null)} className="text-xs underline">Dismiss</button>
          </div>
        </Note>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <label className="relative flex-1 min-w-[220px] max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className={`${inputCls} pl-10`} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by email" />
        </label>
        <select className={`${inputCls} w-auto`} value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
          <option value="">All account types</option>
          {ACCOUNT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <span className="ml-auto text-sm text-gray-500">{total.toLocaleString()} users</span>
      </div>

      {loading ? <Loading>Loading users…</Loading> : users.length === 0 ? <Empty>No users match.</Empty> : (
        <Table columns={[{ label: 'User' }, { label: 'Account type' }, { label: 'Signs in with' }, { label: 'Status' }, { label: 'Joined' }, { label: '', className: 'w-40' }]}>
          {users.map((u) => {
            const t = typeOf(u.account_type);
            const name = `${u.first_name || ''} ${u.last_name || ''}`.trim();
            const joined = u.date_joined || u.created_at;
            return (
              <tr key={u.id} className={u.is_active ? '' : 'bg-gray-50/60'}>
                <Td>
                  <p className="font-semibold text-gray-900">{name || u.email}</p>
                  {name && <p className="text-xs text-gray-500">{u.email}</p>}
                  {u.is_staff && <p className="text-xs text-sky-700 mt-0.5">Django admin access</p>}
                </Td>
                <Td><Pill tone={t.tone}>{t.label}</Pill></Td>
                <Td className="text-gray-600 capitalize">{u.auth_provider || 'email'}</Td>
                <Td><Pill tone={u.is_active ? 'good' : 'critical'}>{u.is_active ? 'Active' : 'Disabled'}</Pill></Td>
                <Td className="text-gray-600">{joined ? new Date(joined).toLocaleDateString() : '—'}</Td>
                <Td>
                  <div className="flex justify-end gap-1">
                    <IconButton label="Edit" onClick={() => setEditing({ ...u })}><Pencil size={15} /></IconButton>
                    <IconButton label={u.is_active ? 'Disable' : 'Enable'} onClick={() => toggle(u)}>{u.is_active ? <UserX size={15} /> : <UserCheck size={15} />}</IconButton>
                    <IconButton label="Reset password" onClick={() => resetPw(u)}><Lock size={15} /></IconButton>
                    <IconButton label="Delete" danger onClick={() => remove(u)}><Trash2 size={15} /></IconButton>
                  </div>
                </Td>
              </tr>
            );
          })}
        </Table>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-end gap-3 text-sm text-gray-600">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span>Page {page} of {pages}</span>
          <Button variant="secondary" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      {editing && (
        <UserModal
          user={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={async (result, created) => {
            setEditing(null);
            if (created && result?.generated_password) setNewPassword({ email: result.email, new_password: result.generated_password });
            flash(created ? `User ${result.email} created.` : 'User updated.');
            await load();
          }}
        />
      )}
    </Page>
  );
};

function UserModal({ user, onClose, onSaved }) {
  const isNew = !user;
  const [form, setForm] = useState(user || EMPTY);
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const errors = {
    email: isNew && form.email ? emailError(form.email) : null,
    password: isNew && form.password && form.password.length < 8 ? 'At least 8 characters, or leave blank to generate one.' : null,
  };
  const valid = (!isNew || form.email) && !errors.email && !errors.password;

  const save = async () => {
    setSaving(true); setError('');
    try {
      if (isNew) onSaved(await createUser(form), true);
      else {
        await updateUser(user.id, { first_name: form.first_name, last_name: form.last_name, phone_number: form.phone_number, account_type: form.account_type, is_staff: form.is_staff });
        onSaved(null, false);
      }
    } catch (e) { setError(e.message); setSaving(false); }
  };

  return (
    <Modal title={isNew ? 'New user' : `Edit ${user.email}`} onClose={onClose}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!valid || saving}>{saving ? 'Saving…' : isNew ? 'Create user' : 'Save changes'}</Button></>}>
      {error && <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="First name"><input className={inputCls} value={form.first_name || ''} onChange={set('first_name')} /></Field>
        <Field label="Last name"><input className={inputCls} value={form.last_name || ''} onChange={set('last_name')} /></Field>
      </div>
      {isNew && <Field label="Email" error={errors.email}><input type="email" className={inputCls} value={form.email} onChange={set('email')} /></Field>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Phone"><input className={inputCls} value={form.phone_number || ''} onChange={set('phone_number')} /></Field>
        <Field label="Account type">
          <select className={inputCls} value={form.account_type} onChange={set('account_type')}>
            {ACCOUNT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Field>
      </div>
      {isNew && (
        <Field label="Password" hint="Leave blank to generate one." error={errors.password}>
          <div className="relative">
            <input type={showPass ? 'text' : 'password'} className={`${inputCls} pr-10`} value={form.password} onChange={set('password')} />
            <button type="button" aria-label={showPass ? 'Hide password' : 'Show password'} onClick={() => setShowPass((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPass ? <EyeOff size={15} /> : <Eye size={15} />}</button>
          </div>
        </Field>
      )}
      <label className="flex items-center gap-2 text-sm text-gray-800"><input type="checkbox" checked={!!form.is_staff} onChange={set('is_staff')} />Access to the Django admin</label>
    </Modal>
  );
}

export default UsersPage;
