import { useEffect, useState } from 'react';
import { Check, Copy, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { fetchTeamAccounts, createTeamAccount, updateTeamAccount, newTeamAccountCode, deleteTeamAccount } from '../../services/adminApi';
import { TEAM_ROLES } from '../../services/session';
import { useConfirm } from '../components/ConfirmProvider';
import ErrorBanner from '../components/ErrorBanner';
import { emailError } from '../components/validation';
import { inputCls } from '../components/formHelpers';
import { Page, Card, CardHeader, Button, IconButton, Field, Pill, Modal, Toggle, Loading, Note } from '../components/ui';

const fmt = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never');
const ME = () => (localStorage.getItem('fi_admin_email') || '').toLowerCase();

/**
 * FarmIntelytics team accounts for this console (owners only; the server
 * refuses everyone else). A new or reissued sign-in code is shown once.
 */
const TeamAccounts = () => {
  const confirm = useConfirm();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(null); // null | { email, full_name, role }
  const [issued, setIssued] = useState(null); // { email, access_code }
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = () => fetchTeamAccounts().then(setData).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const patch = async (a, body) => {
    setError('');
    try {
      const row = await updateTeamAccount(a.id, body);
      setData((d) => ({ ...d, accounts: d.accounts.map((x) => (x.id === a.id ? row : x)) }));
    } catch (e) { setError(e.message); }
  };
  const add = async () => {
    setBusy(true); setError('');
    try {
      const row = await createTeamAccount(adding);
      const { access_code, ...rest } = row;
      setData((d) => ({ ...d, accounts: [...d.accounts, rest].sort((a, b) => a.email.localeCompare(b.email)) }));
      setIssued({ email: row.email, access_code }); setAdding(null);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const reissue = async (a) => {
    if (!(await confirm(`Give ${a.email} a new sign-in code? The old code stops working.`))) return;
    try { const r = await newTeamAccountCode(a.id); setIssued({ email: r.email, access_code: r.access_code }); } catch (e) { setError(e.message); }
  };
  const remove = async (a) => {
    if (!(await confirm(`Remove ${a.email} from the team? They can no longer sign in.`))) return;
    try { await deleteTeamAccount(a.id); setData((d) => ({ ...d, accounts: d.accounts.filter((x) => x.id !== a.id) })); } catch (e) { setError(e.message); }
  };
  const copy = async () => { try { await navigator.clipboard.writeText(issued.access_code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard blocked */ } };

  const problem = adding && (emailError(adding.email) || null);

  return (
    <Page
      eyebrow="Setup"
      title="Team accounts"
      text="Who at FarmIntelytics can sign in to this console, and what each person may do. Changes apply straight away."
      actions={<Button onClick={() => setAdding({ email: '', full_name: '', role: 'support' })}><Plus size={15} />Add team member</Button>}
    >
      <ErrorBanner message={error} onDismiss={() => setError('')} onRetry={load} />

      {issued && (
        <Note tone="good">
          <span className="block font-semibold">Sign-in code for {issued.email}</span>
          <span className="flex items-center gap-2 mt-1">
            <code className="px-2 py-1 rounded-md bg-white border border-gray-200 text-sm">{issued.access_code}</code>
            <IconButton label="Copy code" onClick={copy}>{copied ? <Check size={15} /> : <Copy size={15} />}</IconButton>
          </span>
          <span className="block text-xs mt-1">Shown only now. Send it to them privately; they sign in at /admin/login.</span>
        </Note>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(TEAM_ROLES).map(([id, r]) => (
          <Card key={id} className="p-5"><p className="text-sm font-semibold text-gray-900">{r.label}</p><p className="text-sm text-gray-500 mt-1">{r.text}</p></Card>
        ))}
      </div>

      <Card>
        <CardHeader title="Accounts" text={data ? `${data.accounts.length + 1} people can sign in, including the built-in owner.` : undefined} />
        {!data ? <Loading /> : (
          <ul className="divide-y divide-gray-100">
            <li className="px-6 py-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <p className="text-sm font-semibold text-gray-900">{data.built_in_owner}</p>
                <p className="text-xs text-gray-500">Built-in owner, set on the server. It cannot be removed, so the team is never locked out.</p>
              </div>
              <Pill tone="good">Owner</Pill>
            </li>
            {data.accounts.map((a) => {
              const me = a.email.toLowerCase() === ME();
              return (
                <li key={a.id} className="px-6 py-4 flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-sm font-semibold text-gray-900">{a.full_name || a.email}{me && <span className="ml-2 text-xs font-medium text-green-800">You</span>}</p>
                    <p className="text-xs text-gray-500">{a.email} · last signed in {fmt(a.last_login_at)}</p>
                  </div>
                  <select aria-label="Role" className={`${inputCls} !w-40`} value={a.role} disabled={me} onChange={(e) => patch(a, { role: e.target.value })}>
                    {Object.entries(TEAM_ROLES).map(([id, r]) => <option key={id} value={id}>{r.label}</option>)}
                  </select>
                  <span className="flex items-center gap-2 text-sm text-gray-600">
                    <Toggle on={a.is_active} disabled={me} onChange={(on) => patch(a, { is_active: on })} label="Can sign in" />{a.is_active ? 'Active' : 'Off'}
                  </span>
                  <IconButton label="New sign-in code" onClick={() => reissue(a)}><RefreshCw size={15} /></IconButton>
                  <IconButton label="Remove" danger disabled={me} onClick={() => remove(a)}><Trash2 size={15} /></IconButton>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {adding && (
        <Modal title="Add team member" text="They get a sign-in code, shown once after you add them." onClose={() => setAdding(null)}
          footer={<><Button variant="secondary" onClick={() => setAdding(null)}>Cancel</Button><Button onClick={add} disabled={busy || !!problem}>{busy ? 'Adding…' : 'Add'}</Button></>}>
          <div className="space-y-4">
            <Field label="Email" error={adding.email && problem}><input className={inputCls} type="email" value={adding.email} onChange={(e) => setAdding({ ...adding, email: e.target.value })} /></Field>
            <Field label="Name"><input className={inputCls} value={adding.full_name} onChange={(e) => setAdding({ ...adding, full_name: e.target.value })} /></Field>
            <Field label="Role">
              <div className="space-y-2">
                {Object.entries(TEAM_ROLES).map(([id, r]) => (
                  <label key={id} className={`flex gap-3 p-3 rounded-xl border cursor-pointer ${adding.role === id ? 'border-green-600 bg-green-50' : 'border-gray-200'}`}>
                    <input type="radio" name="team-role" checked={adding.role === id} onChange={() => setAdding({ ...adding, role: id })} className="mt-0.5 accent-green-700" />
                    <span><span className="block text-sm font-semibold text-gray-900">{r.label}</span><span className="block text-xs text-gray-500">{r.text}</span></span>
                  </label>
                ))}
              </div>
            </Field>
          </div>
        </Modal>
      )}
    </Page>
  );
};

export default TeamAccounts;
