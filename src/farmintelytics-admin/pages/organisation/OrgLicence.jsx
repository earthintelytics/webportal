import { useState } from 'react';
import { Link } from 'react-router-dom';
import { updateOrganization } from '../../../services/adminApi';
import { SERVICE_GROUPS } from '../../../constants/servicePhotos';
import { inputCls } from '../../components/formHelpers';
import { CROP_LABELS } from '../../components/orgConstants';
import { Button, Field, Pill, Note } from '../../components/ui';

/**
 * What the organisation is licensed for: services, crops, how many accounts
 * it may have (seat limit, enforced by the backend, G46), and where its AI
 * limits are set. Services and crops are changed with "Edit" on the card.
 */
const OrgLicence = ({ org, onSaved }) => {
  const [seats, setSeats] = useState(org.max_accounts ?? '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const modules = org.allowed_modules || [];
  const services = SERVICE_GROUPS.flatMap((g) => g.services.map((s) => ({ ...s, group: g.label }))).filter((s) => modules.includes(s.id));
  const n = seats === '' ? null : Number(seats);
  const invalid = n != null && (!Number.isInteger(n) || n < 1 || n > 10000);

  const save = async () => {
    setBusy(true); setMsg('');
    try { await updateOrganization(org.id, { max_accounts: n }); setMsg('Saved.'); onSaved?.({ ...org, max_accounts: n }); } catch (e) { setMsg(e.message); }
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
        <p className="text-sm font-semibold text-gray-800">Accounts the licence allows</p>
        <div className="flex items-end gap-3">
          <Field label="Most accounts" hint="Every sign-in counts, admins included. Leave empty for no limit." error={invalid ? 'Use a whole number from 1 to 10,000.' : null} className="flex-1">
            <input className={inputCls} inputMode="numeric" value={seats} onChange={(e) => setSeats(e.target.value.replace(/[^0-9]/g, ''))} placeholder="No limit" />
          </Field>
          <Button onClick={save} disabled={busy || invalid}>{busy ? 'Saving…' : 'Save'}</Button>
        </div>
        {msg && <p className="text-xs text-gray-600">{msg}</p>}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-800">Crops</p>
        <div className="flex flex-wrap gap-1.5">
          {(org.allowed_crops || []).length ? org.allowed_crops.map((c) => <Pill key={c} tone="good">{CROP_LABELS[c] || c}</Pill>) : <span className="text-sm text-gray-500">None</span>}
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-800">Services</p>
        {services.length ? (
          <ul className="divide-y divide-gray-100 border border-gray-200 rounded-xl bg-white">
            {services.map((s) => <li key={s.id} className="px-4 py-2.5 text-sm"><span className="font-medium text-gray-900">{s.label}</span><span className="text-gray-500"> · {s.group}</span></li>)}
          </ul>
        ) : <span className="text-sm text-gray-500">None</span>}
        <p className="text-xs text-gray-500">Change crops and services with Edit on the organisation's card.</p>
      </div>
      <Note>AI use for this organisation (monthly budget, tokens, per-person daily limits, switching AI off) is set in <Link to="/admin/ai" className="font-semibold underline">AI settings → Limits</Link>.</Note>
    </div>
  );
};

export default OrgLicence;
