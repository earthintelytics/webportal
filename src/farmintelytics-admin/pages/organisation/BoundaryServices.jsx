import { useState } from 'react';
import { licensedServiceOptions } from './serviceOptions';
import { updateFarm } from '../../../services/adminApi';
import { Button, Chip, Field, Modal } from '../../components/ui';

/**
 * Which services an estate's boundary is for. None chosen = every service of
 * the organisation. A rice-only boundary then appears only in rice monitoring.
 */
export const ServicesPicker = ({ org, value = [], onChange, disabled = false }) => {
  const options = licensedServiceOptions(org);
  const toggle = (id) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  return (
    <Field label="Which services is this boundary for?" hint={value.length ? `${value.length} chosen. It appears only in these.` : 'None chosen: it appears in every service of the organisation.'}>
      <div className="flex flex-wrap gap-2">
        <Chip on={!value.length} onClick={() => !disabled && onChange([])}>All services</Chip>
        {options.map((o) => <Chip key={o.id} on={value.includes(o.id)} onClick={() => !disabled && toggle(o.id)}>{o.label}</Chip>)}
      </div>
    </Field>
  );
};

/** Change the services of an existing estate. */
const BoundaryServicesModal = ({ org, farm, onClose, onSaved }) => {
  const [services, setServices] = useState(farm.services || []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const save = async () => {
    setBusy(true); setError('');
    try { const updated = await updateFarm(farm.farm_id, { services }); onSaved(updated || { ...farm, services }); } catch (e) { setError(e.message); setBusy(false); }
  };
  return (
    <Modal title={`${farm.farm_name}: services`} text="Choose where this estate's boundary is used." onClose={onClose}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button></>}>
      {error && <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}
      <ServicesPicker org={org} value={services} onChange={setServices} disabled={busy} />
    </Modal>
  );
};

export default BoundaryServicesModal;
