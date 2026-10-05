import { useState } from 'react';
import { createMember, createParcel, uploadParcelFile } from '../../../services/smallholderApi';
import { boundaryCheck } from '../../../farmintelytics-admin/components/validation';
import { Modal, Field, PrimaryButton, SecondaryButton, ErrorNote } from '../../../components/page/PageKit';
import { inputCls } from '../../../components/page/useLoader';

const PHONE = /^\+?[0-9 ()-]{7,20}$/;
const BROWSER_READABLE = /\.(geo)?json$/i;
const ACCEPTED = '.geojson,.json,.kml,.kmz,.zip';

/** Add one member, with an optional parcel boundary. */
const AddMemberDialog = ({ groups, onClose, onSaved }) => {
  const [form, setForm] = useState({ name: '', phone: '', national_id: '', group_id: '', crop: '', planting_year: '' });
  const [file, setFile] = useState(null);
  const [geometry, setGeometry] = useState(null);
  const [fileNote, setFileNote] = useState('');
  const [fileError, setFileError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const year = Number(form.planting_year);
  const errors = {
    name: !form.name.trim() ? 'Enter the farmer\'s name.' : null,
    phone: form.phone && !PHONE.test(form.phone) ? 'Use digits, spaces and an optional + (7–20 characters).' : null,
    planting_year: form.planting_year && (year < 1950 || year > new Date().getFullYear()) ? `Enter a year between 1950 and ${new Date().getFullYear()}.` : null,
  };
  const valid = !Object.values(errors).some(Boolean) && !fileError;

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    setFile(f || null); setGeometry(null); setFileError(''); setFileNote('');
    if (!f) return;
    if (!BROWSER_READABLE.test(f.name)) { setFileNote('The boundary will be read and checked after saving.'); return; }
    try {
      const gj = JSON.parse(await f.text());
      const check = boundaryCheck(gj, f.size);
      if (check.error) { setFileError(check.error); return; }
      setGeometry(gj);
      setFileNote(`Boundary read: ${check.polygons} polygon${check.polygons > 1 ? 's' : ''}. Overlaps, size and forest cover are checked after saving.`);
    } catch {
      setFileError('The file is not valid GeoJSON.');
    }
  };

  const save = async () => {
    setSaving(true); setError('');
    try {
      const member = await createMember({
        name: form.name.trim(), phone: form.phone.trim(), national_id: form.national_id.trim(),
        group_id: form.group_id || null,
      });
      const parcel = { crop: form.crop.trim(), planting_year: form.planting_year ? year : null };
      if (geometry) await createParcel({ member_id: member.id, geometry, ...parcel });
      else if (file) await uploadParcelFile(member.id, file, parcel);
      onSaved();
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Add member"
      onClose={onClose}
      footer={<>
        <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
        <PrimaryButton onClick={save} disabled={!valid || saving}>{saving ? 'Saving…' : 'Save member'}</PrimaryButton>
      </>}
    >
      {error && <ErrorNote message={error} />}
      <Field label="Name" error={errors.name}><input className={inputCls} value={form.name} onChange={set('name')} /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Phone" error={errors.phone}><input className={inputCls} value={form.phone} onChange={set('phone')} inputMode="tel" /></Field>
        <Field label="National ID"><input className={inputCls} value={form.national_id} onChange={set('national_id')} /></Field>
      </div>
      <Field label="Group" hint={groups.length ? null : 'Groups are added under Your data or by the FarmIntelytics team.'}>
        <select className={inputCls} value={form.group_id} onChange={set('group_id')}>
          <option value="">No group</option>
          {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </Field>
      <div className="border-t border-gray-100 pt-5 space-y-4">
        <p className="text-sm font-semibold text-gray-800">Parcel (optional)</p>
        <Field label="Boundary file" hint="GeoJSON, KML, KMZ or a zipped shapefile, in longitude/latitude." error={fileError}>
          <input type="file" accept={ACCEPTED} onChange={onFile} className="block w-full text-sm text-gray-700 file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border file:border-gray-200 file:bg-white file:text-sm" />
        </Field>
        {fileNote && !fileError && <p className="text-xs text-gray-600">{fileNote}</p>}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Crop"><input className={inputCls} value={form.crop} onChange={set('crop')} /></Field>
          <Field label="Planting year" error={errors.planting_year}><input className={inputCls} value={form.planting_year} onChange={set('planting_year')} inputMode="numeric" /></Field>
        </div>
      </div>
    </Modal>
  );
};

export default AddMemberDialog;
