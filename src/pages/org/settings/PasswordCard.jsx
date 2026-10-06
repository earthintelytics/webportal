import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Card, CardHeader, Button, Field, Note } from '../../../farmintelytics-admin/components/ui';
import { inputCls } from '../../../farmintelytics-admin/components/formHelpers';
import { changePassword } from '../../../services/authApi';
import { ROLES, roleLabel } from '../orgProfile';

const Secret = ({ value, onChange, autoComplete }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input type={show ? 'text' : 'password'} className={`${inputCls} pr-10`} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} />
      <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide' : 'Show'} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
};

/** The signed-in person's own account: who they are, their role, and their password. */
const PasswordCard = ({ profile }) => {
  const [f, setF] = useState({ current: '', next: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { tone, text }
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    const problem = !f.current ? 'Enter your current password.'
      : f.next.length < 8 ? 'The new password needs at least 8 characters.'
        : f.next !== f.confirm ? 'The two new passwords are not the same.'
          : f.next === f.current ? 'The new password must be different from the current one.' : null;
    if (problem) { setMsg({ tone: 'warning', text: problem }); return; }
    setBusy(true); setMsg(null);
    try {
      await changePassword({ current_password: f.current, new_password: f.next });
      setF({ current: '', next: '', confirm: '' });
      setMsg({ tone: 'good', text: 'Password changed. Use the new one next time you sign in.' });
    } catch (err) {
      setMsg({ tone: 'warning', text: err?.message || 'The password was not changed. Check your current password.' });
    } finally {
      setBusy(false);
    }
  };

  const role = ROLES.find((r) => r.id === profile.role);
  return (
    <>
    <Card>
      <CardHeader title="Your account" text="Who you are signed in as." />
      <dl className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-5 text-sm">
        <div><dt className="text-gray-500">Name</dt><dd className="mt-1 font-semibold text-gray-900">{profile.fullName || 'Not set'}</dd></div>
        <div><dt className="text-gray-500">Email</dt><dd className="mt-1 font-semibold text-gray-900 break-all">{profile.email}</dd></div>
        <div><dt className="text-gray-500">Role</dt><dd className="mt-1 font-semibold text-gray-900">{roleLabel(profile.role)}</dd>{role && <dd className="text-xs text-gray-500 mt-0.5">{role.text}</dd>}</div>
      </dl>
    </Card>
    <Card>
      <CardHeader title="Password" text="Change the password you sign in with." />
      <form onSubmit={submit} className="p-6 space-y-5 max-w-2xl">
        <Field label="Current password"><Secret value={f.current} onChange={set('current')} autoComplete="current-password" /></Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="New password" hint="At least 8 characters."><Secret value={f.next} onChange={set('next')} autoComplete="new-password" /></Field>
          <Field label="New password again"><Secret value={f.confirm} onChange={set('confirm')} autoComplete="new-password" /></Field>
        </div>
        {msg && <Note tone={msg.tone}>{msg.text}</Note>}
        <div className="flex justify-end"><Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Change password'}</Button></div>
      </form>
    </Card>
    </>
  );
};

export default PasswordCard;
