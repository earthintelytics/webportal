import { useRef, useState } from 'react';
import { Building2, ImagePlus } from 'lucide-react';
import { Card, CardHeader, Button, Note } from '../../../farmintelytics-admin/components/ui';
import { uploadOrganizationLogo } from '../../../services/adminApi';
import { CROP_LABELS } from '../../../farmintelytics-admin/components/orgConstants';

/** Name, logo and what the licence covers. The logo shows in the header and on reports. */
const OrganisationCard = ({ profile, services, canEdit, onLogo }) => {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const upload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true); setError('');
    try {
      const res = await uploadOrganizationLogo(profile.tenant, file);
      if (!res?.logo_url) throw new Error('The logo was not saved.');
      localStorage.setItem('fi_logo_url', res.logo_url);
      onLogo(res.logo_url);
    } catch (err) {
      setError(`Logo not saved: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader title="Organisation" text="Your logo appears in the header and on reports." />
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-20 h-20 rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
            {profile.logoUrl ? <img src={profile.logoUrl} alt="" className="w-full h-full object-contain" /> : <Building2 size={32} className="text-gray-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-xl font-semibold text-gray-900">{profile.name}</p>
            <p className="text-sm text-gray-500 mt-0.5">Sign-in page: {window.location.host}/org/{profile.tenant}/login</p>
          </div>
          {canEdit && (
            <>
              <Button variant="secondary" onClick={() => input.current?.click()} disabled={busy}><ImagePlus size={15} />{busy ? 'Uploading…' : profile.logoUrl ? 'Change logo' : 'Upload logo'}</Button>
              <input ref={input} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={upload} className="hidden" />
            </>
          )}
        </div>
        {error && <Note tone="warning">{error}</Note>}

        <dl className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4">
          <div className="rounded-xl border border-gray-200 p-4">
            <dt className="text-sm text-gray-500">Crops</dt>
            <dd className="mt-2 flex flex-wrap gap-1.5">
              {profile.crops.length ? profile.crops.map((c) => <span key={c} className="text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">{CROP_LABELS[c] || c}</span>) : <span className="text-sm text-gray-500">None</span>}
            </dd>
          </div>
          <div className="rounded-xl border border-gray-200 p-4">
            <dt className="text-sm text-gray-500">Services</dt>
            <dd className="mt-2 flex flex-wrap gap-1.5">
              {services.length ? services.filter((s) => s.group !== 'crops').map((s) => <span key={s.id} className="text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">{s.title}</span>) : <span className="text-sm text-gray-500">None</span>}
              {services.some((s) => s.group === 'crops') && <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">Crop monitoring</span>}
            </dd>
          </div>
          <div className="rounded-xl border border-gray-200 p-4 md:min-w-[180px]">
            <dt className="text-sm text-gray-500">Accounts allowed</dt>
            <dd className="font-display text-2xl font-semibold text-gray-900 mt-1">{profile.maxAccounts ?? 'No limit'}</dd>
          </div>
        </dl>
        <p className="text-xs text-gray-500">Crops, services and the number of accounts are set by FarmIntelytics. To change them, contact your FarmIntelytics team.</p>
      </div>
    </Card>
  );
};

export default OrganisationCard;
