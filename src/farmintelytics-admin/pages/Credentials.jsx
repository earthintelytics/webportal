import { useEffect, useMemo, useState } from 'react';
import { Key, Plus, Trash2, Copy, Check, RefreshCw, Shield } from 'lucide-react';
import { fetchCredentials, createCredential, deleteCredential, rotateCredential, fetchOrganizations } from '../../services/adminApi';
import { useConfirm } from '../components/ConfirmProvider';
import ErrorBanner from '../components/ErrorBanner';
import { emailError, accessCodeError } from '../components/validation';
import { inputCls } from '../components/formHelpers';
import { Page, Card, Button, IconButton, Field, Pill, Modal, Empty, Loading } from '../components/ui';

const ROLES = [
  { id: 'admin', label: 'Admin', text: 'Everything the organisation is licensed for' },
  { id: 'analyst', label: 'Analyst', text: 'Monitoring and reports' },
  { id: 'viewer', label: 'Viewer', text: 'Read only' },
];
const EMPTY = { company_id: '', email: '', access_code: '', label: 'Primary', full_name: '', role: 'admin' };

/**
 * Sign-in details for client organisations (email + access code). Codes are
 * hashed at rest: the backend returns a code only right after it is created
 * or reissued, so it is shown once, for this session.
 */
const Credentials = () => {
  const confirm = useConfirm();
  const [creds, setCreds] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [revealed, setRevealed] = useState({});

  const load = async () => {
    try {
      const [c, o] = await Promise.all([fetchCredentials(), fetchOrganizations()]);
      setCreds(c); setOrgs(Array.isArray(o) ? o : o?.items || []);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/set-state-in-effect

  const copy = async (text, id) => {
    try { await navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(''), 2000); } catch { setError('Copy failed: select the text and copy it.'); }
  };

  const rotate = async (id) => {
    if (!(await confirm('Issue a new access code? The current one stops working immediately.'))) return;
    setBusyId(id);
    try { const cred = await rotateCredential(id); if (cred?.access_code) setRevealed((r) => ({ ...r, [id]: cred.access_code })); await load(); } catch (e) { setError(e.message); } finally { setBusyId(null); }
  };
  const remove = async (cred) => {
    if (!(await confirm(`Delete the sign-in for ${cred.email}? They can no longer sign in.`))) return;
    try { await deleteCredential(cred.id); await load(); } catch (e) { setError(e.message); }
  };

  const grouped = useMemo(() => creds.reduce((acc, c) => { (acc[c.company_id] ||= []).push(c); return acc; }, {}), [creds]);
  const link = (companyId) => `${window.location.origin}/login?tenant=${companyId}`;

  return (
    <Page
      eyebrow="Access"
      title="Sign-in details"
      text="The email and access code each organisation signs in with, and the direct link to its own sign-in page."
      actions={<Button onClick={() => setAdding(true)}><Plus size={16} />New sign-in</Button>}
    >
      <ErrorBanner message={error} onDismiss={() => setError('')} onRetry={load} />

      {loading ? <Loading>Loading sign-in details…</Loading> : Object.keys(grouped).length === 0 ? (
        <Empty>No sign-in details yet. Onboarding creates the first one for each organisation, or add one with “New sign-in”.</Empty>
      ) : Object.entries(grouped).map(([companyId, list]) => {
        const org = orgs.find((o) => o.schema_name === companyId);
        return (
          <Card key={companyId} className="overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-6 py-4 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-green-50 border border-green-200 text-green-700 flex items-center justify-center"><Shield size={16} /></span>
                <div>
                  <p className="font-semibold text-gray-900">{org?.display_name || companyId}</p>
                  <p className="text-xs text-gray-500">{list.length} sign-in{list.length === 1 ? '' : 's'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <code className="text-xs text-gray-600 bg-white border border-gray-200 px-2.5 py-1.5 rounded-lg truncate">{link(companyId)}</code>
                <Button variant="secondary" className="!px-3 !py-1.5 text-xs" onClick={() => copy(link(companyId), `link-${companyId}`)}>
                  {copied === `link-${companyId}` ? <><Check size={13} />Copied</> : <><Copy size={13} />Copy link</>}
                </Button>
              </div>
            </div>
            <ul className="divide-y divide-gray-100">
              {list.map((cred) => (
                <li key={cred.id} className="flex flex-col md:flex-row md:items-center gap-3 px-6 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-900">{cred.full_name || cred.email}</span>
                      {cred.full_name && <span className="text-sm text-gray-500">{cred.email}</span>}
                      <Pill>{cred.label}</Pill>
                      <Pill tone="good">{ROLES.find((r) => r.id === cred.role)?.label || cred.role || 'Admin'}</Pill>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-gray-500">
                      {revealed[cred.id] ? (
                        <><code className="font-mono text-sm text-green-800 bg-green-50 border border-green-200 px-2 py-0.5 rounded-md">{revealed[cred.id]}</code><span className="text-red-700 font-medium">Copy it now: it is not shown again</span></>
                      ) : <code className="font-mono text-gray-400 tracking-widest">••••••••••</code>}
                      <span>Created {new Date(cred.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <IconButton label="Copy email" onClick={() => copy(cred.email, `email-${cred.id}`)}>{copied === `email-${cred.id}` ? <Check size={15} /> : <Copy size={15} />}</IconButton>
                    {revealed[cred.id] && <IconButton label="Copy access code" onClick={() => copy(revealed[cred.id], `code-${cred.id}`)}>{copied === `code-${cred.id}` ? <Check size={15} /> : <Key size={15} />}</IconButton>}
                    <IconButton label="Issue a new access code" disabled={busyId === cred.id} onClick={() => rotate(cred.id)}><RefreshCw size={15} /></IconButton>
                    <IconButton label="Delete" danger onClick={() => remove(cred)}><Trash2 size={15} /></IconButton>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        );
      })}

      {adding && <NewCredential orgs={orgs} onClose={() => setAdding(false)} onSaved={async (cred) => { setAdding(false); await load(); if (cred?.access_code) setRevealed((r) => ({ ...r, [cred.id]: cred.access_code })); }} />}
    </Page>
  );
};

function NewCredential({ orgs, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const errors = { email: form.email ? emailError(form.email) : null, access_code: accessCodeError(form.access_code.trim()) };
  const valid = form.company_id && form.email && !errors.email && !errors.access_code;

  const save = async () => {
    setSaving(true); setError('');
    try { onSaved(await createCredential({ ...form, access_code: form.access_code.trim() })); } catch (e) { setError(e.message); setSaving(false); }
  };

  return (
    <Modal title="New sign-in" text="The person signs in with this email and access code on the organisation's own sign-in page." onClose={onClose}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!valid || saving}>{saving ? 'Creating…' : 'Create sign-in'}</Button></>}>
      {error && <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}
      <Field label="Organisation">
        <select className={inputCls} value={form.company_id} onChange={set('company_id')}>
          <option value="">Choose an organisation</option>
          {orgs.map((o) => <option key={o.schema_name} value={o.schema_name}>{o.display_name}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Name"><input className={inputCls} value={form.full_name} onChange={set('full_name')} /></Field>
        <Field label="Label" hint="e.g. Primary, Estate manager"><input className={inputCls} value={form.label} onChange={set('label')} /></Field>
      </div>
      <Field label="Email" error={errors.email}><input type="email" className={inputCls} value={form.email} onChange={set('email')} /></Field>
      <Field label="Access code" hint="Leave blank to generate one." error={errors.access_code}><input className={`${inputCls} font-mono`} value={form.access_code} onChange={set('access_code')} /></Field>
      <Field label="Role">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {ROLES.map((r) => (
            <button key={r.id} type="button" onClick={() => setForm((f) => ({ ...f, role: r.id }))}
              className={`text-left px-3 py-2.5 rounded-xl border ${form.role === r.id ? 'border-green-600 bg-green-50' : 'border-gray-300 bg-white hover:border-gray-400'}`}>
              <span className="block text-sm font-semibold text-gray-900">{r.label}</span>
              <span className="block text-xs text-gray-500">{r.text}</span>
            </button>
          ))}
        </div>
      </Field>
    </Modal>
  );
}

export default Credentials;
