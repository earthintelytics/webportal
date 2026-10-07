import { useState } from 'react';
import { Modal, Button, Field } from '../../../farmintelytics-admin/components/ui';
import { inputCls } from '../../../farmintelytics-admin/components/formHelpers';
import { emailError } from '../../../farmintelytics-admin/components/validation';
import { ROLES } from '../orgProfile';

/**
 * Add or edit one account. Services: none ticked = every service the
 * organisation has; ticked = only those (DEVELOPMENT.md, "Access model").
 */
const MemberModal = ({ member, services, onSave, onClose }) => {
  const editing = Boolean(member?.id);
  const [form, setForm] = useState(() => ({
    email: member?.email || '', name: member?.name || '',
    role: (member?.role || 'viewer').toLowerCase(), password: '', services: member?.services || [],
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggle = (id) => set('services', form.services.includes(id) ? form.services.filter((s) => s !== id) : [...form.services, id]);

  const submit = async (e) => {
    e.preventDefault();
    // New people, or a changed name: first and last name. Existing names are left as they are.
    if ((!editing || form.name !== (member?.name || '')) && form.name.trim().split(/\s+/).filter(Boolean).length < 2) { setError('Enter the first and last name.'); return; }
    const bad = !editing && emailError(form.email);
    if (bad) { setError(bad); return; }
    if (!editing && form.password.length < 8) { setError('The first password needs at least 8 characters.'); return; }
    setBusy(true); setError('');
    try {
      const body = { name: form.name.trim(), role: form.role, services: form.services };
      if (!editing) Object.assign(body, { email: form.email.trim(), password: form.password });
      await onSave(body);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title={editing ? 'Edit account' : 'Add an account'}
      text={editing ? member.email : 'They sign in at your organisation’s address with this email and password.'}
      onClose={onClose}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="member-form" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save' : 'Add account'}</Button></>}
    >
      <form id="member-form" onSubmit={submit} className="space-y-5">
        {!editing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Email"><input type="email" className={inputCls} value={form.email} onChange={(e) => set('email', e.target.value)} autoFocus /></Field>
            <Field label="First password" hint="They can change it in Settings."><input type="text" className={inputCls} value={form.password} onChange={(e) => set('password', e.target.value)} /></Field>
          </div>
        )}
        <Field label="First and last name *"><input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Amina Bello" required autoComplete="name" /></Field>
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-gray-800 mb-1.5">Role</legend>
          {ROLES.map((r) => (
            <label key={r.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer ${form.role === r.id ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input type="radio" name="role" className="mt-1 accent-green-700" checked={form.role === r.id} onChange={() => set('role', r.id)} />
              <span><span className="block text-sm font-semibold text-gray-900">{r.label}</span><span className="block text-xs text-gray-500">{r.text}</span></span>
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend className="text-sm font-semibold text-gray-800">Services</legend>
          <p className="text-xs text-gray-500 mb-2">Leave all unticked to give every service your organisation has.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {services.map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" className="accent-green-700" checked={form.services.includes(s.id)} onChange={() => toggle(s.id)} />{s.title}
              </label>
            ))}
          </div>
        </fieldset>
        {error && <p className="text-sm text-red-700">{error}</p>}
      </form>
    </Modal>
  );
};

export default MemberModal;
