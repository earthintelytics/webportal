import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, RefreshCw, Copy, Check } from 'lucide-react';
import { fetchCredentials, createCredential, deleteCredential, rotateCredential } from '../../../services/adminApi';
import { useConfirm } from '../../components/ConfirmProvider';
import { emailError, accessCodeError } from '../../components/validation';
import { inputCls } from '../../components/formHelpers';
import { Button, IconButton, Field, Pill, Loading, Empty, Note } from '../../components/ui';
import { copyText } from '../../../utils/copyText';

const ROLES = [
  { id: 'admin', label: 'Admin', text: 'Everything the organisation is licensed for, and its team' },
  { id: 'analyst', label: 'Analyst', text: 'Monitoring, reports and farm data' },
  { id: 'viewer', label: 'Viewer', text: 'Read only' },
];
const EMPTY = { first_name: '', last_name: '', email: '', access_code: '', role: 'viewer', label: '' };

/**
 * The organisation's people: sign-ins with a role, within the number of
 * accounts its licence allows (max_accounts; the backend enforces it, G46).
 */
const OrgPeople = ({ org }) => {
  const confirm = useConfirm();
  const [people, setPeople] = useState([]);
  const [state, setState] = useState('loading');
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [revealed, setRevealed] = useState({});
  const [copied, setCopied] = useState('');

  const load = useCallback(async () => {
    try { const c = await fetchCredentials(org.schema_name); setPeople((Array.isArray(c) ? c : []).filter((x) => x.company_id === org.schema_name)); setState('ready'); } catch (e) { setError(e.message); setState('error'); }
  }, [org.schema_name]);
  useEffect(() => { load(); }, [load]); // eslint-disable-line react-hooks/set-state-in-effect

  const limit = Number(org.max_accounts) || null;
  const full = limit != null && people.length >= limit;
  const errors = { email: form.email ? emailError(form.email) : null, code: accessCodeError(form.access_code.trim()) };

  const add = async () => {
    setBusy(true); setError('');
    try {
      const { first_name, last_name, ...rest } = form;
      const c = await createCredential({ company_id: org.schema_name, ...rest, full_name: `${first_name.trim()} ${last_name.trim()}`, access_code: form.access_code.trim(), label: form.label || ROLES.find((r) => r.id === form.role)?.label });
      if (c?.access_code) setRevealed((r) => ({ ...r, [c.id]: c.access_code }));
      setForm(EMPTY); setAdding(false); await load();
    } catch (e) { setError(e.message); }
    setBusy(false);
  };
  const remove = async (p) => {
    if (!(await confirm(`Remove ${p.email}? They can no longer sign in.`))) return;
    try { await deleteCredential(p.id); await load(); } catch (e) { setError(e.message); }
  };
  const rotate = async (p) => {
    if (!(await confirm(`Issue a new access code for ${p.email}? The current one stops working.`))) return;
    try { const c = await rotateCredential(p.id); if (c?.access_code) setRevealed((r) => ({ ...r, [p.id]: c.access_code })); } catch (e) { setError(e.message); }
  };
  const copy = async (t) => { try { await copyText(t); setCopied(t); setTimeout(() => setCopied(''), 1500); } catch { /* clipboard blocked */ } };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">People</p>
          <p className="text-xs text-gray-500">{limit != null ? `${people.length} of ${limit} accounts used (licence)` : `${people.length} accounts · no limit set (Licence tab)`}</p>
        </div>
        <Button variant="secondary" className="!py-2" onClick={() => setAdding((a) => !a)} disabled={full && !adding}><Plus size={15} />Add person</Button>
      </div>
      {full && <Note tone="warning">The licence allows {limit} accounts and all are used. Raise the limit on the Licence tab or remove someone first.</Note>}
      {error && <Note tone="warning">{error}</Note>}

      {adding && !full && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="First name *"><input className={inputCls} value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required /></Field>
            <Field label="Last name *"><input className={inputCls} value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required /></Field>
            <Field label="Email" error={errors.email}><input type="email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          </div>
          <Field label="Role">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {ROLES.map((r) => (
                <button key={r.id} type="button" onClick={() => setForm({ ...form, role: r.id })} className={`text-left px-3 py-2 rounded-xl border ${form.role === r.id ? 'border-green-600 bg-white' : 'border-gray-300 bg-white hover:border-gray-400'}`}>
                  <span className="block text-sm font-semibold text-gray-900">{r.label}</span><span className="block text-xs text-gray-500">{r.text}</span>
                </button>
              ))}
            </div>
          </Field>
          <Field label="Access code" hint="Leave blank to generate one." error={errors.code}><input className={`${inputCls} font-mono`} value={form.access_code} onChange={(e) => setForm({ ...form, access_code: e.target.value })} /></Field>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setAdding(false); setForm(EMPTY); }}>Cancel</Button>
            <Button onClick={add} disabled={busy || !form.first_name.trim() || !form.last_name.trim() || !form.email || errors.email || errors.code}>{busy ? 'Adding…' : 'Add person'}</Button>
          </div>
        </div>
      )}

      {state === 'loading' ? <Loading /> : people.length === 0 ? <Empty>No sign-ins yet.</Empty> : (
        <ul className="divide-y divide-gray-100 border border-gray-200 rounded-xl bg-white">
          {people.map((p) => (
            <li key={p.id} className="px-4 py-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">{p.full_name || p.email}</p>
                {p.full_name && <p className="text-xs text-gray-500 truncate">{p.email}</p>}
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Pill tone={p.role === 'admin' ? 'good' : p.role === 'analyst' ? 'info' : 'neutral'}>{ROLES.find((r) => r.id === p.role)?.label || p.role || 'Admin'}</Pill>
                  {revealed[p.id] && (
                    <button type="button" onClick={() => copy(revealed[p.id])} className="inline-flex items-center gap-1 text-xs font-mono text-green-800 bg-green-50 border border-green-200 px-2 py-0.5 rounded-md">
                      {copied === revealed[p.id] ? <Check size={12} /> : <Copy size={12} />}{revealed[p.id]}
                    </button>
                  )}
                </div>
              </div>
              <div className="flex shrink-0">
                <IconButton label="New access code" onClick={() => rotate(p)}><RefreshCw size={15} /></IconButton>
                <IconButton label="Remove" danger onClick={() => remove(p)}><Trash2 size={15} /></IconButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default OrgPeople;
