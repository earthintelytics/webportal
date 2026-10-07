import { useState } from 'react';
import { Link } from 'react-router-dom';
import { updateOrganization } from '../../../services/adminApi';
import { SERVICE_GROUPS } from '../../../constants/servicePhotos';
import { ALL_CROPS, inputCls } from '../../components/formHelpers';
import { CROP_LABELS } from '../../components/orgConstants';
import { Button, Field, Note, Toggle } from '../../components/ui';

/**
 * What the organisation is licensed for: services, crops, how many accounts
 * it may have (seat limit, enforced by the backend, G46), and where its AI
 * limits are set. Each crop and service can be switched on or off here; the
 * change applies straight away (the server refuses switched-off services).
 */
const OrgLicence = ({ org, onSaved }) => {
  const [seats, setSeats] = useState(org.max_accounts ?? '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const modules = org.allowed_modules || [];
  const crops = org.allowed_crops || [];
  const services = SERVICE_GROUPS.flatMap((g) => g.services.map((s) => ({ ...s, group: g.label })));
  const [switching, setSwitching] = useState('');

  // Switch one crop or service. A crop takes its monitoring services with it.
  const switchItem = async (key, body, label) => {
    setSwitching(key); setMsg('');
    try {
      await updateOrganization(org.id, body);
      onSaved?.({ ...org, ...body });
      setMsg(`${label} saved.`);
    } catch (e) { setMsg(e.message); }
    setSwitching('');
  };
  const toggleCrop = (c, on) => {
    const nextCrops = on ? [...new Set([...crops, c])] : crops.filter((x) => x !== c);
    const nextModules = on ? modules : modules.filter((m) => m !== `rs-${c}` && m !== `management-${c}`);
    switchItem(`crop:${c}`, { allowed_crops: nextCrops, allowed_modules: nextModules }, `${CROP_LABELS[c] || c} ${on ? 'on' : 'off'}`);
  };
  const toggleService = (s, on) => {
    const next = on ? [...new Set([...modules, s.id])] : modules.filter((m) => m !== s.id);
    switchItem(`svc:${s.id}`, { allowed_modules: next }, `${s.label} ${on ? 'on' : 'off'}`);
  };
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
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ALL_CROPS.map((c) => (
            <li key={c} className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm">
              <span className="font-medium text-gray-900">{CROP_LABELS[c] || c}</span>
              <Toggle on={crops.includes(c)} disabled={!!switching} onChange={(on) => toggleCrop(c, on)} label={`${CROP_LABELS[c] || c} monitoring`} />
            </li>
          ))}
        </ul>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-800">Services</p>
        <ul className="divide-y divide-gray-100 border border-gray-200 rounded-xl bg-white">
          {services.map((s) => (
            <li key={s.id} className="px-4 py-2.5 text-sm flex items-center justify-between gap-3">
              <span><span className="font-medium text-gray-900">{s.label}</span><span className="text-gray-500"> · {s.group}</span></span>
              <Toggle on={modules.includes(s.id)} disabled={!!switching} onChange={(on) => toggleService(s, on)} label={s.label} />
            </li>
          ))}
        </ul>
        <p className="text-xs text-gray-500">Switching off takes effect on the next request: people of this organisation can no longer open that service.</p>
      </div>
      <Note>AI use for this organisation (monthly budget, tokens, per-person daily limits, switching AI off) is set in <Link to="/admin/ai" className="font-semibold underline">AI settings → Limits</Link>.</Note>
    </div>
  );
};

export default OrgLicence;
