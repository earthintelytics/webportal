import { useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { fetchMembers, fetchParcels } from '../../../services/smallholderApi';
import { PageHeader, Card, NotConnectedNote, ErrorNote, EmptyState, StatusPill, SecondaryButton } from '../../../components/page/PageKit';
import { useLoader } from '../../../components/page/useLoader';
import { EUDR_STATUS } from '../smallholderLabels';

/**
 * EUDR passport: per member, the geolocation and deforestation-check result a
 * buyer asks for. A result is shown only after a real check has run (G29);
 * the export carries the check result as recorded, never an assumed one.
 */
const loadMembers = () => fetchMembers({ page_size: 500 });

const EudrPassportPage = () => {
  const { data, state, error: loadError, reload } = useLoader(loadMembers);
  const rows = useMemo(() => data?.rows || [], [data]);
  const [exportError, setError] = useState('');
  const error = exportError || loadError;
  const [q, setQ] = useState('');

  const shown = useMemo(() => rows.filter((r) => !q || `${r.name} ${r.code} ${r.group_name || ''}`.toLowerCase().includes(q.toLowerCase())), [rows, q]);
  const counts = useMemo(() => rows.reduce((c, r) => ({ ...c, [r.eudr_status || 'not_checked']: (c[r.eudr_status || 'not_checked'] || 0) + 1 }), {}), [rows]);

  // GeoJSON of all parcels with the recorded check, for the buyer's due-diligence system.
  const exportGeojson = async () => {
    try {
      const fc = await fetchParcels({});
      const url = URL.createObjectURL(new Blob([JSON.stringify(fc)], { type: 'application/geo+json' }));
      Object.assign(document.createElement('a'), { href: url, download: 'eudr-parcels.geojson' }).click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="p-10 space-y-8">
      <PageHeader
        title="EUDR passport"
        text="For each member: where the land is and whether forest was cleared after 31 December 2020. Buyers in the EU need this for each delivery."
        actions={<SecondaryButton onClick={exportGeojson} disabled={!rows.length}><Download size={15} />Export parcels (GeoJSON)</SecondaryButton>}
      />

      {state === 'not_connected' && <NotConnectedNote what="The member register" />}
      {(state === 'error' || exportError) && <ErrorNote message={error} onRetry={reload} />}

      {rows.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(EUDR_STATUS).map(([k, [label, tone]]) => (
            <Card key={k} className="p-5">
              <StatusPill tone={tone}>{label}</StatusPill>
              <p className="font-mono text-2xl text-gray-900 mt-3">{counts[k] || 0}</p>
            </Card>
          ))}
        </div>
      )}

      {state === 'ready' && rows.length === 0 && <EmptyState title="No members yet" text="Add members and their parcel boundaries under Members and parcels." />}

      {rows.length > 0 && (
        <>
          <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-300 bg-white w-fit">
            <Search size={15} className="text-gray-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search members" className="text-sm outline-none w-52" />
          </label>
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-600">
                <tr><th className="px-5 py-3">Member</th><th className="px-5 py-3">Group</th><th className="px-5 py-3">Parcels</th><th className="px-5 py-3">Area</th><th className="px-5 py-3">Check result</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {shown.map((m) => {
                  const [label, tone] = EUDR_STATUS[m.eudr_status] || EUDR_STATUS.not_checked;
                  return (
                    <tr key={m.id}>
                      <td className="px-5 py-3"><p className="font-semibold text-gray-900">{m.name}</p><p className="text-xs text-gray-500">{m.code}</p></td>
                      <td className="px-5 py-3 text-gray-700">{m.group_name || '—'}</td>
                      <td className="px-5 py-3 font-mono text-gray-700">{m.parcels_count ?? 0}</td>
                      <td className="px-5 py-3 font-mono text-gray-700">{m.area_ha != null ? `${Number(m.area_ha).toFixed(2)} ha` : '—'}</td>
                      <td className="px-5 py-3"><StatusPill tone={tone}>{label}</StatusPill></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
};

export default EudrPassportPage;
