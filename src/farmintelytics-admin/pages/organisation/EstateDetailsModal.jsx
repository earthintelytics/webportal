import { useState } from 'react';
import { updateFarm } from '../../../services/adminApi';
import { ALL_CROPS, inputCls } from '../../components/formHelpers';
import { CROP_LABELS } from '../../components/orgConstants';
import { Button, Field, Modal } from '../../components/ui';

/**
 * Estate details the platform reads to adapt pages, wording and alerts:
 * crop, group, planting or season date, irrigated.
 */
const EstateDetailsModal = ({ farm, onClose, onSaved }) => {
  const [form, setForm] = useState({ crop: farm.crop || '', group_name: farm.group_name || '', planting_date: farm.planting_date || '', is_irrigated: Boolean(farm.is_irrigated) });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const future = form.planting_date && new Date(form.planting_date) > new Date();

  const save = async () => {
    setSaving(true); setError('');
    try { const updated = await updateFarm(farm.farm_id, { ...form, planting_date: form.planting_date || null }); onSaved(updated || { ...farm, ...form }); } catch (e) { setError(e.message); setSaving(false); }
  };

  return (
    <Modal title="Estate details" text={farm.farm_name} onClose={onClose}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={saving || future}>{saving ? 'Saving…' : 'Save'}</Button></>}>
      {error && <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}
      <Field label="Crop grown here">
        <select className={inputCls} value={form.crop} onChange={(e) => setForm((f) => ({ ...f, crop: e.target.value }))}>
          <option value="">Not set</option>
          {ALL_CROPS.map((c) => <option key={c} value={c}>{CROP_LABELS[c] || c}</option>)}
        </select>
      </Field>
      <Field label="Group or co-operative" hint="Optional."><input className={inputCls} value={form.group_name} onChange={(e) => setForm((f) => ({ ...f, group_name: e.target.value }))} /></Field>
      <Field label="Planting or season start" error={future ? 'The date cannot be in the future.' : null} hint="Lets alerts and wording follow the crop stage. Clients can add dates per block under Farm data.">
        <input type="date" className={inputCls} value={form.planting_date || ''} onChange={(e) => setForm((f) => ({ ...f, planting_date: e.target.value }))} />
      </Field>
      <label className="flex items-center gap-2 text-sm text-gray-800"><input type="checkbox" checked={form.is_irrigated} onChange={(e) => setForm((f) => ({ ...f, is_irrigated: e.target.checked }))} />Irrigated</label>
    </Modal>
  );
};

export default EstateDetailsModal;
